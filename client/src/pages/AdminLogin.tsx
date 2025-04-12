import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAdminRoute] = useRoute("/admin-stonks-dex-secret-login");

  useEffect(() => {
    // 检查是否已经登录
    const checkAuth = async () => {
      try {
        const response = await apiRequest("GET", "/api/check-admin-auth");
        if (response.ok) {
          // 已登录，重定向到管理页面
          setLocation("/manage");
        }
      } catch (error) {
        // 未登录，不做处理
      }
    };

    checkAuth();
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "错误",
        description: "请输入用户名和密码",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    console.log("尝试登录，用户名:", username);
    
    try {
      const response = await apiRequest("POST", "/api/admin-login", {
        username,
        password
      });
      
      console.log("登录响应状态:", response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log("登录响应数据:", responseData);
      
      if (response.ok) {
        toast({
          title: "登录成功",
          description: "欢迎回来，管理员",
        });
        
        // 验证一下是否真的登录成功
        const authCheckResponse = await apiRequest("GET", "/api/check-admin-auth");
        console.log("验证登录状态:", authCheckResponse.status);
        
        if (authCheckResponse.ok) {
          // 确认已登录，重定向到管理页面
          console.log("验证成功，正在重定向到管理页面");
          setLocation("/manage");
        } else {
          console.error("登录验证失败，但登录API返回成功");
          toast({
            title: "登录异常",
            description: "登录成功但验证失败，请刷新重试",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "登录失败",
          description: responseData.message || "用户名或密码错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("登录过程中出错:", error);
      toast({
        title: "登录错误",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdminRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">404</h1>
          <p className="mb-8">页面不存在</p>
          <Button onClick={() => setLocation("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>请输入您的管理员凭据</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="管理员用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="管理员密码"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}