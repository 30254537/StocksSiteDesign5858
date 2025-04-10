import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function Manage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // 联系信息状态
  const [contactInfo, setContactInfo] = useState<{
    email: string;
    address: string;
  }>({
    email: '',
    address: ''
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(false);
  
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

  // 检查管理员身份验证
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      try {
        const response = await apiRequest("GET", "/api/check-admin-auth");
        if (response.ok) {
          setIsAuthenticated(true);
          fetchProducts();
          // 获取联系信息
          fetchContactInfo();
        } else {
          // 未经授权，重定向到登录页面
          toast({
            title: "需要管理员权限",
            description: "请先登录",
            variant: "destructive",
          });
          setLocation("/admin-stonks-dex-secret-login");
        }
      } catch (error) {
        // 出错，重定向到登录页面
        setLocation("/admin-stonks-dex-secret-login");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [setLocation, toast]);
  
  // 获取联系信息
  const fetchContactInfo = async () => {
    setLoadingContactInfo(true);
    try {
      const response = await apiRequest("GET", "/api/contact-info");
      const data = await response.json();
      setContactInfo({
        email: data.email || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error("获取联系信息失败:", error);
      toast({
        title: "获取联系信息失败",
        description: "无法获取联系信息，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingContactInfo(false);
    }
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    
    // In a real implementation, these values would be set in form fields
    document.getElementById("product-id")?.setAttribute("value", product.id.toString());
    
    const nameInput = document.getElementById("product-name") as HTMLInputElement;
    if (nameInput) nameInput.value = product.name;
    
    const priceInput = document.getElementById("product-price") as HTMLInputElement;
    if (priceInput) priceInput.value = product.price.toString();
    
    const descInput = document.getElementById("product-description") as HTMLTextAreaElement;
    if (descInput) descInput.value = product.description || "";
    
    const stockInput = document.getElementById("product-stock") as HTMLInputElement;
    if (stockInput) stockInput.value = product.stock?.toString() || "0";

    // 图片处理在UI中展示，不需要设置文件输入值（浏览器安全限制）
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    toast({
      title: "编辑产品",
      description: `正在编辑: ${product.name}`,
    });
  };
  
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("确定要删除此产品吗？此操作无法撤销。")) {
      try {
        // 发送删除请求
        await apiRequest("DELETE", `/api/products/${productId}`);
        
        toast({
          title: "删除成功",
          description: "产品已成功删除",
        });
        
        // Re-fetch products to update the UI
        await fetchProducts();
      } catch (error) {
        console.error("删除产品错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除产品，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };
  
  // 存储选择的文件对象引用
  const [selectedFilesObjects, setSelectedFilesObjects] = useState<File[]>([]);
  
  // 处理文件选择变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('文件输入变化事件触发');
    console.log('选择的文件数量:', files ? files.length : 0);
    
    if (files && files.length > 0) {
      // 将FileList转换为数组
      const newFiles = Array.from(files);
      const fileNames = newFiles.map(file => file.name);
      console.log('文件名列表:', fileNames);
      
      // 保存所有选择的文件名称
      setSelectedFiles(prevSelectedFiles => [...prevSelectedFiles, ...fileNames]);
      
      // 保存文件对象引用
      setSelectedFilesObjects(prevFiles => [...prevFiles, ...newFiles]);
      
      console.log('文件输入元素有效:', true);
      console.log('累计选择的文件数量:', selectedFiles.length + fileNames.length);
      
      // 重置文件输入框，以便用户可以再次选择同一文件
      e.target.value = '';
    }
  };

  // 在检查认证状态时显示加载中
  if (checkingAuth) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full mb-4"></div>
        <p>正在验证管理员身份...</p>
      </div>
    );
  }

  // 如果未认证，显示未授权信息（虽然通常会被重定向）
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-3xl font-bold mb-4 text-accent">需要管理员权限</h1>
        <p className="mb-8">您没有访问此页面的权限</p>
        <Button onClick={() => setLocation("/admin-stonks-dex-secret-login")}>前往登录</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-accent">STONKS DEX 后台管理系统</h1>
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          className="text-accent hover:text-white hover:bg-primary/50"
          onClick={async () => {
            try {
              await apiRequest("POST", "/api/admin-logout");
              toast({
                title: "已登出",
                description: "您已成功登出管理系统",
              });
              setLocation("/");
            } catch (error) {
              console.error("登出错误:", error);
            }
          }}
        >
          退出登录
        </Button>
      </div>
      
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>商品管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
            <h3 className="text-xl mb-4 text-accent">产品表单</h3>
            <form id="product-form" className="space-y-4" encType="multipart/form-data" onSubmit={async (e) => {
              e.preventDefault();
              
              const productId = document.getElementById("product-id") as HTMLInputElement;
              const name = document.getElementById("product-name") as HTMLInputElement;
              const description = document.getElementById("product-description") as HTMLTextAreaElement;
              const price = document.getElementById("product-price") as HTMLInputElement;
              const stock = document.getElementById("product-stock") as HTMLInputElement;
              const imageInput = document.getElementById("product-image") as HTMLInputElement;
              
              const isEditing = productId.value ? true : false;
              
              try {
                // 创建 FormData 对象来处理文件上传
                const formData = new FormData();
                
                // 添加产品数据
                const productData: any = {
                  name: name.value,
                  description: description.value,
                  price: parseFloat(price.value),
                  stock: parseInt(stock.value),
                };
                
                // 如果是编辑模式并且有现有图片列表，添加到数据
                if (isEditing && editingProduct && editingProduct.imageUrls) {
                  productData.existingImages = editingProduct.imageUrls;
                }
                
                formData.append('productData', JSON.stringify(productData));
                
                // 如果收集了文件，添加到表单数据
                if (selectedFilesObjects.length > 0) {
                  console.log('选择的文件总数量:', selectedFilesObjects.length);
                  console.log('文件列表:', selectedFilesObjects.map(f => f.name));
                  
                  // 支持多文件上传
                  for (let i = 0; i < selectedFilesObjects.length; i++) {
                    console.log(`添加文件 ${i+1}/${selectedFilesObjects.length}: ${selectedFilesObjects[i].name}`);
                    formData.append('images', selectedFilesObjects[i]);
                  }
                  
                  // 打印表单数据检查
                  console.log('FormData包含的数据:');
                  // 检查images字段
                  const imageValues = formData.getAll('images');
                  console.log(`- images: ${imageValues.length} 个值`);
                  // 检查productData字段
                  console.log('- productData 已添加')
                }
                
                // 发送请求
                if (isEditing) {
                  // 更新产品 - 确保不设置Content-Type以便浏览器自动添加带boundary的值
                  await apiRequest("PUT", `/api/products/${productId.value}`, formData, {
                    headers: {} // 不设置Content-Type，让浏览器自动处理
                  });
                  
                  toast({
                    title: "更新成功",
                    description: `产品 "${name.value}" 已更新`,
                  });
                } else {
                  // 创建新产品 - 确保不设置Content-Type以便浏览器自动添加带boundary的值
                  await apiRequest("POST", "/api/products", formData, {
                    headers: {} // 不设置Content-Type，让浏览器自动处理
                  });
                  
                  toast({
                    title: "添加成功",
                    description: `产品 "${name.value}" 已添加`,
                  });
                }
                
                // Reset form after submission
                if (!isEditing) {
                  e.currentTarget.reset();
                  setSelectedFiles([]); // 清空已选择的文件列表名称
                  setSelectedFilesObjects([]); // 清空已选择的文件对象
                }
                
                // Re-fetch products to update the table
                await fetchProducts();
                
                // Reset editing state
                if (isEditing) {
                  setEditingProduct(null);
                  setSelectedFiles([]); // 清空已选择的文件列表名称
                  setSelectedFilesObjects([]); // 清空已选择的文件对象
                  productId.value = "";
                  window.scrollTo({ top: document.getElementById("products-table")?.offsetTop || 0, behavior: "smooth" });
                }
              } catch (error) {
                console.error("产品操作错误:", error);
                toast({
                  title: isEditing ? "更新失败" : "添加失败",
                  description: "操作失败，请稍后再试",
                  variant: "destructive",
                });
              }
            }}>
              <input type="hidden" id="product-id" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="product-name" className="block text-sm">产品名称:</label>
                  <Input 
                    id="product-name" 
                    className="bg-primary/50 border-accent"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="product-price" className="block text-sm">价格 ($STONKS):</label>
                  <Input 
                    id="product-price" 
                    type="number" 
                    step="0.01" 
                    className="bg-primary/50 border-accent"
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="product-description" className="block text-sm">产品描述:</label>
                <textarea 
                  id="product-description" 
                  className="w-full rounded-md p-2 bg-primary/50 border border-accent"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="product-stock" className="block text-sm">库存数量:</label>
                  <Input 
                    id="product-stock" 
                    type="number" 
                    className="bg-primary/50 border-accent"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="product-image" className="block text-sm">产品图片: (可选择多张)</label>
                  <div className="relative cursor-pointer" onClick={() => document.getElementById('product-image')?.click()}>
                    <Input 
                      id="product-image" 
                      type="file" 
                      accept="image/*"
                      className="bg-primary/50 border-accent sr-only" 
                      multiple
                      onChange={handleFileChange}
                    />
                    <div className="w-full h-24 bg-primary/30 border-2 border-dashed border-accent/50 rounded-md flex items-center justify-center hover:bg-primary/40 transition-colors">
                      <div className="text-center">
                        <i className="fas fa-upload text-accent mb-2"></i>
                        <p className="text-sm text-accent">添加上传图片</p>
                        <p className="text-xs text-gray-400 mt-1">点击或拖放文件至此处</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 显示已选择的文件名 */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs mb-1 text-accent">已选择 {selectedFiles.length} 个文件:</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                        {selectedFiles.map((fileName, index) => (
                          <div key={index} className="bg-primary/50 px-2 py-1 rounded-md flex items-center">
                            <span className="truncate max-w-[120px]">{fileName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 显示已有产品图片 */}
                  {editingProduct && editingProduct.imageUrls && editingProduct.imageUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs mb-2">当前图片:</p>
                      <div className="flex flex-wrap gap-2">
                        {editingProduct.imageUrls.map((url, index) => (
                          <div key={index} className="relative w-16 h-16 border border-accent/30 rounded overflow-hidden">
                            <img src={url} alt={`产品图片 ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                {editingProduct && (
                  <Button 
                    type="button"
                    variant="outline"
                    className="border-accent text-accent"
                    onClick={() => {
                      setEditingProduct(null);
                      setSelectedFiles([]); // 清空已选择的文件列表名称
                      setSelectedFilesObjects([]); // 清空已选择的文件对象
                      (document.getElementById("product-id") as HTMLInputElement).value = "";
                      (document.getElementById("product-form") as HTMLFormElement).reset();
                    }}
                  >
                    取消编辑
                  </Button>
                )}
                <Button 
                  type="submit"
                  className="bg-accent text-primary hover:bg-accent/80"
                >
                  {editingProduct ? "更新产品" : "添加产品"}
                </Button>
              </div>
            </form>
          </div>
          
          <div className="mb-4 flex justify-between items-center">
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
            <div id="products-table" className="rounded-md border overflow-hidden">
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
                              onClick={() => handleEditProduct(product)}
                            >
                              编辑
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="text-destructive hover:text-white hover:bg-destructive/90"
                              onClick={() => handleDeleteProduct(product.id)}
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
      
      {/* 联系信息管理卡片 */}
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>联系信息管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
            <h3 className="text-xl mb-4 text-accent">修改联系信息</h3>
            <form
              id="contact-form"
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                
                const emailInput = document.getElementById("contact-email") as HTMLInputElement;
                const addressInput = document.getElementById("contact-address") as HTMLTextAreaElement;
                
                if (!emailInput.value || !addressInput.value) {
                  toast({
                    title: "表单验证失败",
                    description: "请填写所有字段",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  // 更新电子邮箱
                  await apiRequest("PUT", "/api/contact-info/email", {
                    value: emailInput.value
                  });
                  
                  // 更新地址
                  await apiRequest("PUT", "/api/contact-info/address", {
                    value: addressInput.value
                  });
                  
                  // 更新本地状态
                  setContactInfo({
                    email: emailInput.value,
                    address: addressInput.value
                  });
                  
                  toast({
                    title: "更新成功",
                    description: "联系信息已更新",
                  });
                } catch (error) {
                  console.error("更新联系信息失败:", error);
                  toast({
                    title: "更新失败",
                    description: "无法更新联系信息，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <div className="space-y-2">
                <label htmlFor="contact-email" className="block text-sm">电子邮箱:</label>
                <Input 
                  id="contact-email" 
                  className="bg-primary/50 border-accent"
                  required 
                  defaultValue={contactInfo.email}
                  placeholder="company@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="contact-address" className="block text-sm">地址:</label>
                <Textarea 
                  id="contact-address" 
                  className="bg-primary/50 border-accent"
                  required 
                  defaultValue={contactInfo.address}
                  placeholder="公司地址"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="bg-accent text-primary hover:bg-accent/80"
                  disabled={loadingContactInfo}
                >
                  {loadingContactInfo ? "更新中..." : "更新联系信息"}
                </Button>
              </div>
            </form>
          </div>
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