import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Manage() {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = () => {
    // In a real application, this should be handled by a secure backend
    // Using hardcoded passwords is only for demonstration
    if (password === "admin123") {
      setIsAuthenticated(true);
      toast({
        title: "登录成功",
        description: "欢迎访问后台管理系统",
      });
      fetchProducts();
    } else {
      toast({
        title: "密码错误",
        description: "请输入正确的管理员密码",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/products");
      // First convert response to json and then cast to Product[]
      const productData = await response.json();
      setProducts(productData);
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法获取产品数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-md py-24 px-4">
        <Card className="bg-card text-card-foreground shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-accent">
              后台管理系统
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="请输入管理密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-primary/50 border-accent"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full bg-accent text-primary hover:bg-accent/80"
              >
                登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-accent">STONKS DEX 后台管理系统</h1>
      
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>商品管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <Button 
              className="bg-accent text-primary hover:bg-accent/80"
              onClick={() => toast({
                title: "功能开发中",
                description: "新增商品功能即将推出",
              })}
            >
              添加新商品
            </Button>
            <Button 
              variant="outline" 
              className="border-accent text-accent"
              onClick={fetchProducts}
              disabled={isLoading}
            >
              {isLoading ? "加载中..." : "刷新数据"}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/50">
                  <TableRow>
                    <TableHead className="text-accent">ID</TableHead>
                    <TableHead className="text-accent">商品名称</TableHead>
                    <TableHead className="text-accent">价格 ($STONKS)</TableHead>
                    <TableHead className="text-accent">库存</TableHead>
                    <TableHead className="text-accent">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        暂无商品数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.price}</TableCell>
                        <TableCell>{product.stock || "未设置"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              className="text-accent hover:text-white hover:bg-primary/50"
                              onClick={() => toast({
                                title: "功能开发中",
                                description: "编辑商品功能即将推出",
                              })}
                            >
                              编辑
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="text-destructive hover:text-white hover:bg-destructive/90"
                              onClick={() => toast({
                                title: "功能开发中",
                                description: "删除商品功能即将推出",
                              })}
                            >
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button 
          variant="outline" 
          className="border-accent text-accent"
          onClick={() => setLocation("/")}
        >
          返回首页
        </Button>
      </div>
    </div>
  );
}