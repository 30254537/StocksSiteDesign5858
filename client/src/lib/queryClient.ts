import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  // 默认配置
  const config: RequestInit = {
    method,
    credentials: "include",
    ...options
  };
  
  // 如果没有在options中提供headers，则使用默认的
  if (!options?.headers) {
    // 根据数据类型设置headers
    if (data instanceof FormData) {
      // 对于FormData，不设置Content-Type，让浏览器自动添加带boundary的正确值
    } else if (data) {
      // 对于普通JSON数据
      config.headers = {
        "Content-Type": "application/json",
      };
    }
  }
  
  // 如果数据是FormData，直接使用，否则将其序列化为JSON
  if (data) {
    if (data instanceof FormData) {
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, config);
  await throwIfResNotOk(res);
  
  // 检查特殊的缓存控制头，如果存在，则清除相关缓存
  const clearCacheHeader = res.headers.get('X-Clear-Translation-Cache');
  if (clearCacheHeader) {
    // 动态导入并调用清除缓存函数
    import('./translations').then(({ clearTranslationCache }) => {
      clearTranslationCache(clearCacheHeader);
      console.log(`服务器请求清除翻译缓存: ${clearCacheHeader}`);
    }).catch(err => {
      console.error('无法导入清除缓存函数:', err);
    });
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      // 添加缓存控制头，防止浏览器缓存
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // 检查特殊的缓存控制头，如果存在，则清除相关缓存
    const clearCacheHeader = res.headers.get('X-Clear-Translation-Cache');
    if (clearCacheHeader) {
      // 动态导入并调用清除缓存函数
      import('./translations').then(({ clearTranslationCache }) => {
        clearTranslationCache(clearCacheHeader);
        console.log(`GET请求服务器清除翻译缓存: ${clearCacheHeader}`);
      }).catch(err => {
        console.error('无法导入清除缓存函数:', err);
      });
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
