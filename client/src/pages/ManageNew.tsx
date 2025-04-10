import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Product, ContractAddress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrderManagement from "@/components/OrderManagement";

export default function Manage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // 管理选项卡切换状态
  const [activeTab, setActiveTab] = useState<string>("products");
  
  // 通用状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // 产品管理状态
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFilesObjects, setSelectedFilesObjects] = useState<File[]>([]);
  
  // 联系信息状态
  const [contactInfo, setContactInfo] = useState<{
    email: string;
    address: string;
  }>({
    email: '',
    address: ''
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(false);
  
  // 合约地址状态
  const [contractAddresses, setContractAddresses] = useState<ContractAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ContractAddress | null>(null);
  
  // 获取商品列表
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/products");
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
          fetchContactInfo();
          fetchContractAddresses();
        } else {
          toast({
            title: "需要管理员权限",
            description: "请先登录",
            variant: "destructive",
          });
          setLocation("/admin-stonks-dex-secret-login");
        }
      } catch (error) {
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
  
  // 获取合约地址列表
  const fetchContractAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await apiRequest("GET", "/api/contract-addresses");
      const data = await response.json();
      setContractAddresses(data);
    } catch (error) {
      console.error("获取合约地址列表失败:", error);
      toast({
        title: "获取合约地址失败",
        description: "无法获取合约地址列表，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingAddresses(false);
    }
  };
  
  // 处理编辑合约地址
  const handleEditAddress = (address: ContractAddress) => {
    setEditingAddress(address);
    
    // 填充表单
    document.getElementById("address-id")?.setAttribute("value", address.id.toString());
    
    const networkInput = document.getElementById("address-network") as HTMLSelectElement;
    if (networkInput) networkInput.value = address.network;
    
    const coinTypeInput = document.getElementById("address-coin-type") as HTMLSelectElement;
    if (coinTypeInput) coinTypeInput.value = address.coinType;
    
    const addressInput = document.getElementById("address-value") as HTMLInputElement;
    if (addressInput) addressInput.value = address.address;
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("address-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑合约地址",
      description: `正在编辑: ${address.network} - ${address.coinType}`,
    });
  };
  
  // 处理删除合约地址
  const handleDeleteAddress = async (addressId: number) => {
    if (window.confirm("确定要删除此合约地址吗？此操作无法撤销。")) {
      try {
        await apiRequest("DELETE", `/api/contract-addresses/${addressId}`);
        
        toast({
          title: "删除成功",
          description: "合约地址已成功删除",
        });
        
        // 重新获取地址列表以更新UI
        await fetchContractAddresses();
      } catch (error) {
        console.error("删除合约地址错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除合约地址，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };
  
  // 处理编辑产品
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    
    // 填充表单字段
    document.getElementById("product-id")?.setAttribute("value", product.id.toString());
    
    const nameInput = document.getElementById("product-name") as HTMLInputElement;
    if (nameInput) nameInput.value = product.name;
    
    const priceInput = document.getElementById("product-price") as HTMLInputElement;
    if (priceInput) priceInput.value = product.price.toString();
    
    const descInput = document.getElementById("product-description") as HTMLTextAreaElement;
    if (descInput) descInput.value = product.description || "";
    
    const stockInput = document.getElementById("product-stock") as HTMLInputElement;
    if (stockInput) stockInput.value = product.stock?.toString() || "0";
    
    // 滚动到表单
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    toast({
      title: "编辑产品",
      description: `正在编辑: ${product.name}`,
    });
  };
  
  // 处理删除产品
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("确定要删除此产品吗？此操作无法撤销。")) {
      try {
        await apiRequest("DELETE", `/api/products/${productId}`);
        
        toast({
          title: "删除成功",
          description: "产品已成功删除",
        });
        
        // 重新获取产品列表以更新UI
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
  
  // 处理文件选择变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      // 将FileList转换为数组
      const newFiles = Array.from(files);
      const fileNames = newFiles.map(file => file.name);
      
      // 保存所有选择的文件名称
      setSelectedFiles(prevSelectedFiles => [...prevSelectedFiles, ...fileNames]);
      
      // 保存文件对象引用
      setSelectedFilesObjects(prevFiles => [...prevFiles, ...newFiles]);
      
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

  // 主要管理界面
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-accent">STONKS DEX 后台管理系统</h1>
        
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
      
      {/* 管理导航选项卡 */}
      <div className="flex flex-wrap border-b border-accent/30 mb-8">
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "products" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("products")}
        >
          商品管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "contracts" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("contracts")}
        >
          合约地址管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "contact" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("contact")}
        >
          联系信息管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "music" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("music")}
        >
          音乐管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "orders" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          订单管理
        </button>
      </div>
      
      {/* 产品管理 */}
      {activeTab === "products" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>商品管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 产品表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                
                // 获取表单数据
                const productId = document.getElementById("product-id")?.getAttribute("value");
                const name = (document.getElementById("product-name") as HTMLInputElement).value;
                const price = parseFloat((document.getElementById("product-price") as HTMLInputElement).value);
                const description = (document.getElementById("product-description") as HTMLTextAreaElement).value;
                const stock = parseInt((document.getElementById("product-stock") as HTMLInputElement).value || "0");
                const featured = (document.getElementById("product-featured") as HTMLInputElement).checked;
                const categoryElement = document.querySelector('[data-value]');
                const category = categoryElement ? categoryElement.getAttribute('data-value') || 'clothing' : 'clothing';
                const hasSizes = (document.getElementById("product-hasSizes") as HTMLInputElement).checked;
                
                // 基本验证
                if (!name || isNaN(price) || price <= 0) {
                  toast({
                    title: "表单错误",
                    description: "请检查产品名称和价格",
                    variant: "destructive",
                  });
                  return;
                }
                
                // 添加文本字段
                formData.append("name", name);
                formData.append("price", price.toString());
                formData.append("description", description);
                formData.append("stock", stock.toString());
                formData.append("featured", featured.toString());
                formData.append("category", category);
                formData.append("hasSizes", hasSizes.toString());
                
                // 添加文件
                selectedFilesObjects.forEach(file => {
                  formData.append("images", file);
                });
                
                try {
                  // 发送请求
                  let response;
                  
                  if (productId) {
                    // 编辑模式
                    formData.append("id", productId);
                    response = await fetch(`/api/products/${productId}`, {
                      method: "PUT",
                      body: formData,
                    });
                  } else {
                    // 新增模式
                    response = await fetch("/api/products", {
                      method: "POST",
                      body: formData,
                    });
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("product-form") as HTMLFormElement).reset();
                    document.getElementById("product-id")?.removeAttribute("value");
                    setSelectedFiles([]);
                    setSelectedFilesObjects([]);
                    setEditingProduct(null);
                    
                    // 提示成功
                    toast({
                      title: productId ? "更新成功" : "添加成功",
                      description: productId ? "产品已成功更新" : "新产品已成功添加",
                    });
                    
                    // 重新获取产品列表
                    await fetchProducts();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("提交产品表单错误:", error);
                  toast({
                    title: "提交失败",
                    description: "无法保存产品信息，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
              id="product-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="hidden" id="product-id" />
                
                <div className="space-y-2">
                  <label htmlFor="product-name" className="block text-sm font-medium">
                    产品名称
                  </label>
                  <Input
                    id="product-name"
                    placeholder="输入产品名称"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="product-price" className="block text-sm font-medium">
                    价格 (USD)
                  </label>
                  <Input
                    id="product-price"
                    type="number"
                    placeholder="输入价格 (美元)"
                    step="0.01"
                    min="0"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="product-description" className="block text-sm font-medium">
                    产品描述
                  </label>
                  <Textarea
                    id="product-description"
                    placeholder="输入产品描述"
                    className="bg-primary/50 border-accent min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="product-category" className="block text-sm font-medium">
                    产品类别
                  </label>
                  <Select defaultValue="clothing">
                    <SelectTrigger className="bg-primary/50 border-accent" data-id="product-category">
                      <SelectValue placeholder="选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clothing">服装</SelectItem>
                      <SelectItem value="accessories">配件</SelectItem>
                      <SelectItem value="collectibles">收藏品</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="product-stock" className="block text-sm font-medium">
                    库存数量
                  </label>
                  <Input
                    id="product-stock"
                    type="number"
                    placeholder="输入库存数量"
                    min="0"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="product-featured"
                      className="w-4 h-4 mr-2 accent-accent"
                    />
                    <label htmlFor="product-featured" className="text-sm font-medium">
                      精选产品
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="product-hasSizes"
                      className="w-4 h-4 mr-2 accent-accent"
                    />
                    <label htmlFor="product-hasSizes" className="text-sm font-medium">
                      有尺码选项
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium">
                    产品图片
                  </label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="product-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="bg-primary/50 border-accent"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-accent text-accent"
                      onClick={() => {
                        setSelectedFiles([]);
                        setSelectedFilesObjects([]);
                      }}
                      disabled={selectedFiles.length === 0}
                    >
                      清除选择
                    </Button>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">已选择 {selectedFiles.length} 个文件:</p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <li key={index}>{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {editingProduct?.imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">当前图片:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="relative w-24 h-24 bg-primary/30 rounded overflow-hidden">
                          <img
                            src={editingProduct.imageUrl}
                            alt={editingProduct.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {editingProduct.imageUrls && editingProduct.imageUrls.map((img: string, idx: number) => (
                          <div key={idx} className="relative w-24 h-24 bg-primary/30 rounded overflow-hidden">
                            <img
                              src={img}
                              alt={`${editingProduct.name} ${idx + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/80 text-black"
                >
                  {editingProduct ? "更新产品" : "添加产品"}
                </Button>
                
                {editingProduct && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-500 text-gray-400"
                    onClick={() => {
                      // 重置表单
                      (document.getElementById("product-form") as HTMLFormElement).reset();
                      document.getElementById("product-id")?.removeAttribute("value");
                      setSelectedFiles([]);
                      setSelectedFilesObjects([]);
                      setEditingProduct(null);
                    }}
                  >
                    取消编辑
                  </Button>
                )}
              </div>
            </form>
            
            {/* 产品列表 */}
            <div>
              <h3 className="text-xl font-bold mb-4">产品列表</h3>
              
              {isLoading ? (
                <div className="flex justify-center my-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/50">
                      <TableRow>
                        <TableHead className="text-accent">图片</TableHead>
                        <TableHead className="text-accent">名称</TableHead>
                        <TableHead className="text-accent">价格</TableHead>
                        <TableHead className="text-accent">库存</TableHead>
                        <TableHead className="text-accent">类别</TableHead>
                        <TableHead className="text-accent">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            暂无产品
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="w-16 h-16 bg-primary/30 rounded overflow-hidden">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    无图片
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.name}
                              {product.featured && (
                                <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                                  精选
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-accent">⊙ {product.ethPrice.toFixed(6)}</span>
                                <span className="text-xs text-gray-400">${product.price.toFixed(2)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{product.stock || "无限"}</TableCell>
                            <TableCell>
                              <span className="capitalize">{product.category || "未分类"}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-accent hover:text-white hover:bg-primary/50"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  编辑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-white hover:bg-red-500/20"
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
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 合约地址管理 */}
      {activeTab === "contracts" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>合约地址管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 合约地址表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              id="address-form"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const addressId = document.getElementById("address-id")?.getAttribute("value");
                const networkElement = document.querySelector('[data-id="address-network"]');
                const network = networkElement ? networkElement.getAttribute('data-value') || 'solana' : 'solana';
                const coinTypeElement = document.querySelector('[data-id="address-coin-type"]');
                const coinType = coinTypeElement ? coinTypeElement.getAttribute('data-value') || 'stonks' : 'stonks';
                const address = (document.getElementById("address-value") as HTMLInputElement).value;
                
                // 基本验证
                if (!network || !coinType || !address) {
                  toast({
                    title: "表单错误",
                    description: "请填写所有必填字段",
                    variant: "destructive",
                  });
                  return;
                }
                
                const addressData = {
                  network,
                  coinType,
                  address
                };
                
                try {
                  let response;
                  
                  if (addressId) {
                    // 编辑模式
                    response = await apiRequest("PUT", `/api/contract-addresses/${addressId}`, addressData);
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/contract-addresses", addressData);
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("address-form") as HTMLFormElement).reset();
                    document.getElementById("address-id")?.removeAttribute("value");
                    setEditingAddress(null);
                    
                    // 提示成功
                    toast({
                      title: addressId ? "更新成功" : "添加成功",
                      description: addressId ? "合约地址已成功更新" : "新合约地址已成功添加",
                    });
                    
                    // 重新获取合约地址列表
                    await fetchContractAddresses();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("提交合约地址表单错误:", error);
                  toast({
                    title: "提交失败",
                    description: "无法保存合约地址信息，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="hidden" id="address-id" />
                
                <div className="space-y-2">
                  <label htmlFor="address-network" className="block text-sm font-medium">
                    区块链网络
                  </label>
                  <Select defaultValue="solana">
                    <SelectTrigger className="bg-primary/50 border-accent" data-id="address-network">
                      <SelectValue placeholder="选择网络" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solana">Solana</SelectItem>
                      <SelectItem value="ethereum">Ethereum (ERC20)</SelectItem>
                      <SelectItem value="bsc">Binance Smart Chain (BEP20)</SelectItem>
                      <SelectItem value="tron">TRON (TRC20)</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address-coin-type" className="block text-sm font-medium">
                    币种类型
                  </label>
                  <Select defaultValue="stonks">
                    <SelectTrigger className="bg-primary/50 border-accent" data-id="address-coin-type">
                      <SelectValue placeholder="选择币种" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stonks">STONKS</SelectItem>
                      <SelectItem value="usdt">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="address-value" className="block text-sm font-medium">
                    合约地址
                  </label>
                  <Input
                    id="address-value"
                    placeholder="输入合约地址"
                    className="bg-primary/50 border-accent font-mono text-xs"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/80 text-black"
                >
                  {editingAddress ? "更新合约地址" : "添加合约地址"}
                </Button>
                
                {editingAddress && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-500 text-gray-400"
                    onClick={() => {
                      // 重置表单
                      (document.getElementById("address-form") as HTMLFormElement).reset();
                      document.getElementById("address-id")?.removeAttribute("value");
                      setEditingAddress(null);
                    }}
                  >
                    取消编辑
                  </Button>
                )}
              </div>
            </form>
            
            {/* 合约地址列表 */}
            <div>
              <h3 className="text-xl font-bold mb-4">合约地址列表</h3>
              
              {loadingAddresses ? (
                <div className="flex justify-center my-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/50">
                      <TableRow>
                        <TableHead className="text-accent">网络</TableHead>
                        <TableHead className="text-accent">币种</TableHead>
                        <TableHead className="text-accent">合约地址</TableHead>
                        <TableHead className="text-accent">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractAddresses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            暂无合约地址
                          </TableCell>
                        </TableRow>
                      ) : (
                        contractAddresses.map((address) => (
                          <TableRow key={address.id}>
                            <TableCell className="font-medium capitalize">
                              {address.network}
                            </TableCell>
                            <TableCell className="uppercase">{address.coinType}</TableCell>
                            <TableCell>
                              <div 
                                className="bg-primary/30 p-2 rounded font-mono text-xs overflow-x-auto whitespace-nowrap cursor-pointer select-all"
                                title="点击右键可选择并复制"
                              >
                                {address.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-accent hover:text-white hover:bg-primary/50"
                                  onClick={() => handleEditAddress(address)}
                                >
                                  编辑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-white hover:bg-red-500/20"
                                  onClick={() => handleDeleteAddress(address.id)}
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
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 联系信息管理 */}
      {activeTab === "contact" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>联系信息管理</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="mb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const email = (document.getElementById("contact-email") as HTMLInputElement).value;
                const address = (document.getElementById("contact-address") as HTMLTextAreaElement).value;
                
                try {
                  // 更新联系邮箱
                  await apiRequest("PUT", "/api/contact-info/email", { value: email });
                  
                  // 更新联系地址
                  await apiRequest("PUT", "/api/contact-info/address", { value: address });
                  
                  toast({
                    title: "更新成功",
                    description: "联系信息已成功更新",
                  });
                  
                  // 重新获取联系信息
                  await fetchContactInfo();
                } catch (error) {
                  console.error("更新联系信息错误:", error);
                  toast({
                    title: "更新失败",
                    description: "无法更新联系信息，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="block text-sm font-medium">
                    联系邮箱
                  </label>
                  <Input
                    id="contact-email"
                    placeholder="输入联系邮箱"
                    className="bg-primary/50 border-accent"
                    defaultValue={contactInfo.email}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contact-address" className="block text-sm font-medium">
                    联系地址
                  </label>
                  <Textarea
                    id="contact-address"
                    placeholder="输入联系地址"
                    className="bg-primary/50 border-accent min-h-[100px]"
                    defaultValue={contactInfo.address}
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/80 text-black"
                disabled={loadingContactInfo}
              >
                {loadingContactInfo ? "更新中..." : "更新联系信息"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* 音乐管理 */}
      {activeTab === "music" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>音乐管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-24 my-4">
              <p className="text-gray-400">音乐管理功能正在开发中...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 订单管理 */}
      {activeTab === "orders" && <OrderManagement />}
    </div>
  );
}