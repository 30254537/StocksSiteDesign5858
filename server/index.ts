import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 只对API请求设置JSON内容类型
app.use((req, res, next) => {
  // 只有API请求才设置JSON响应类型
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// Set up session middleware
app.use(session({
  secret: 'stonksdexshop-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // set to true if using https
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // 为静态上传文件提供服务
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
  
  // 特别确保API路由在此处注册 - 这是最重要的！
  const server = await registerRoutes(app);

  // 为音乐API路由添加特殊中间件，预先设置内容类型
  app.use('/api/music/*', (req, res, next) => {
    // 保存原始的res.send方法
    const originalSend = res.send;
    
    // 覆盖res.send方法，确保在发送之前设置正确的Content-Type
    res.send = function(...args) {
      // 如果还没设置Content-Type或者它被设置为HTML
      if (!res.get('Content-Type') || res.get('Content-Type').includes('text/html')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        console.log('预先设置音乐API路由的Content-Type为application/json');
      }
      
      // 调用原始send方法
      return originalSend.apply(res, args);
    };
    
    next();
  });

  // 错误处理中间件
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // 注意：Vite设置应该在所有API路由之后
  // 这样catch-all路由才不会干扰其他路由
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
