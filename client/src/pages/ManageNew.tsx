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
  
  // 订单管理状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  
  // 订单状态显示函数
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "待付款",
      paid: "已付款",
      shipped: "已发货",
      completed: "已完成",
      cancelled: "已取消"
    };
    return statusMap[status] || status;
  };
  
  // 支付方式显示函数
  const getPaymentMethodDisplay = (method: string): string => {
    const methodMap: Record<string, string> = {
      stonks: "STONKS代币",
      usdt: "USDT",
      fiat: "法币支付"
    };
    return methodMap[method] || method;
  };
  
  // 状态CSS类
  const getStatusClass = (status: string): string => {
    const statusClassMap: Record<string, string> = {
      pending: "px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400",
      paid: "px-2 py-1 rounded-full bg-green-500/20 text-green-400",
      shipped: "px-2 py-1 rounded-full bg-blue-500/20 text-blue-400",
      completed: "px-2 py-1 rounded-full bg-accent/20 text-accent",
      cancelled: "px-2 py-1 rounded-full bg-red-500/20 text-red-400"
    };
    return statusClassMap[status] || "px-2 py-1 rounded-full bg-gray-500/20 text-gray-400";
  };
  
  // 获取订单列表
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await apiRequest("GET", "/api/orders");
      const ordersData = await response.json();
      setOrders(ordersData);
    } catch (error) {
      console.error("获取订单列表错误:", error);
      toast({
        title: "获取订单列表失败",
        description: "无法获取订单列表，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };
  
  // 根据过滤条件获取订单
  const filteredOrders = orderStatusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === orderStatusFilter);
  
  // 获取订单详情
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await apiRequest("GET", `/api/orders/${orderId}/items`);
      const itemsData = await response.json();
      setSelectedOrderItems(itemsData);
      setShowOrderDialog(true);
    } catch (error) {
      console.error("获取订单详情错误:", error);
      toast({
        title: "获取订单详情失败",
        description: "无法获取订单详情，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 更新订单状态
  const handleOrderStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.ok) {
        toast({
          title: "状态更新成功",
          description: `订单状态已更新为：${getStatusDisplay(newStatus)}`,
        });
        
        // 刷新订单列表
        await fetchOrders();
        
        // 如果正在查看该订单的详情，关闭详情对话框
        if (selectedOrder?.id === orderId) {
          setShowOrderDialog(false);
          setSelectedOrder(null);
        }
      } else {
        throw new Error("更新订单状态失败");
      }
    } catch (error) {
      console.error("更新订单状态错误:", error);
      toast({
        title: "更新订单状态失败",
        description: "无法更新订单状态，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 更新物流单号
  const handleTrackingNumberUpdate = async (orderId: number) => {
    if (!trackingNumber.trim()) {
      toast({
        title: "请输入物流单号",
        description: "物流单号不能为空",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/tracking`, {
        trackingNumber: trackingNumber.trim()
      });
      
      if (response.ok) {
        toast({
          title: "物流单号更新成功",
          description: "订单已标记为已发货状态",
        });
        
        // 刷新订单列表
        await fetchOrders();
        
        // 关闭对话框
        setShowTrackingDialog(false);
        setTrackingNumber("");
      } else {
        throw new Error("更新物流单号失败");
      }
    } catch (error) {
      console.error("更新物流单号错误:", error);
      toast({
        title: "更新物流单号失败",
        description: "无法更新物流单号，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
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
          fetchOrders();
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
            <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
              <h3 className="text-xl mb-4 text-accent">产品表单</h3>
              <form id="product-form" className="space-y-4" encType="multipart/form-data" onSubmit={async (e) => {
                e.preventDefault();
                
                const productId = document.getElementById("product-id") as HTMLInputElement;
                const name = document.getElementById("product-name") as HTMLInputElement;
                const description = document.getElementById("product-description") as HTMLTextAreaElement;
                const price = document.getElementById("product-price") as HTMLInputElement;
                const stock = document.getElementById("product-stock") as HTMLInputElement;
                
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
                    // 支持多文件上传
                    for (let i = 0; i < selectedFilesObjects.length; i++) {
                      formData.append('images', selectedFilesObjects[i]);
                    }
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
                  
                  // 重置表单和状态
                  if (!isEditing) {
                    e.currentTarget.reset();
                    setSelectedFiles([]);
                    setSelectedFilesObjects([]);
                  }
                  
                  // 刷新产品列表
                  await fetchProducts();
                  
                  // 重置编辑状态
                  if (isEditing) {
                    setEditingProduct(null);
                    setSelectedFiles([]);
                    setSelectedFilesObjects([]);
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
                        setSelectedFiles([]);
                        setSelectedFilesObjects([]);
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
      )}
      
      {/* 合约地址管理 */}
      {activeTab === "contracts" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>合约地址管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
              <h3 className="text-xl mb-4 text-accent">添加/编辑合约地址</h3>
              <form id="address-form" className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                
                const addressId = document.getElementById("address-id") as HTMLInputElement;
                const network = document.getElementById("address-network") as HTMLSelectElement;
                const coinType = document.getElementById("address-coin-type") as HTMLSelectElement;
                const address = document.getElementById("address-value") as HTMLInputElement;
                
                const isEditing = addressId.value ? true : false;
                
                try {
                  if (isEditing) {
                    // 更新已有合约地址
                    await apiRequest("PUT", `/api/contract-addresses/${addressId.value}`, {
                      network: network.value,
                      coinType: coinType.value,
                      address: address.value
                    });
                    
                    toast({
                      title: "更新成功",
                      description: `${network.value} - ${coinType.value} 合约地址已更新`,
                    });
                  } else {
                    // 创建新合约地址
                    await apiRequest("POST", "/api/contract-addresses", {
                      network: network.value,
                      coinType: coinType.value,
                      address: address.value
                    });
                    
                    toast({
                      title: "添加成功",
                      description: `${network.value} - ${coinType.value} 合约地址已添加`,
                    });
                  }
                  
                  // 重置表单
                  e.currentTarget.reset();
                  // 重新获取合约地址列表
                  await fetchContractAddresses();
                  setEditingAddress(null);
                  addressId.value = "";
                } catch (error) {
                  console.error("合约地址操作错误:", error);
                  toast({
                    title: isEditing ? "更新失败" : "添加失败",
                    description: "操作失败，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}>
                <input type="hidden" id="address-id" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="address-network" className="block text-sm">网络:</label>
                    <select
                      id="address-network"
                      className="w-full rounded-md p-2 bg-primary/50 border border-accent"
                    >
                      <option value="ETH">以太坊 (ETH)</option>
                      <option value="BSC">币安智能链 (BSC)</option>
                      <option value="TRON">波场 (TRON)</option>
                      <option value="SOL">索拉纳 (SOL)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="address-coin-type" className="block text-sm">代币类型:</label>
                    <select
                      id="address-coin-type"
                      className="w-full rounded-md p-2 bg-primary/50 border border-accent"
                    >
                      <option value="STONKS">STONKS</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address-value" className="block text-sm">合约地址:</label>
                  <Input 
                    id="address-value" 
                    className="bg-primary/50 border-accent"
                    required 
                    placeholder="输入完整的合约地址"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  {editingAddress && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="border-accent text-accent"
                      onClick={() => {
                        setEditingAddress(null);
                        (document.getElementById("address-id") as HTMLInputElement).value = "";
                        (document.getElementById("address-form") as HTMLFormElement).reset();
                      }}
                    >
                      取消编辑
                    </Button>
                  )}
                  <Button 
                    type="submit"
                    className="bg-accent text-primary hover:bg-accent/80"
                  >
                    {editingAddress ? "更新合约地址" : "添加合约地址"}
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="mb-4 flex justify-between items-center">
              <Button 
                variant="outline" 
                className="border-accent text-accent"
                onClick={fetchContractAddresses}
                disabled={loadingAddresses}
              >
                {loadingAddresses ? "加载中..." : "刷新数据"}
              </Button>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/50">
                  <TableRow>
                    <TableHead className="text-accent">ID</TableHead>
                    <TableHead className="text-accent">网络</TableHead>
                    <TableHead className="text-accent">代币类型</TableHead>
                    <TableHead className="text-accent">合约地址</TableHead>
                    <TableHead className="text-accent">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAddresses ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <span>加载合约地址中...</span>
                      </TableCell>
                    </TableRow>
                  ) : contractAddresses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {loadingAddresses ? (
                          <span>加载合约地址中...</span>
                        ) : "尚未添加任何合约地址"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    contractAddresses.map((addr) => (
                      <TableRow key={addr.id}>
                        <TableCell>{addr.id}</TableCell>
                        <TableCell>{addr.network}</TableCell>
                        <TableCell>{addr.coinType}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          <div 
                            className="cursor-pointer hover:text-accent" 
                            onClick={() => {
                              // 点击时复制到剪贴板
                              navigator.clipboard.writeText(addr.address);
                              toast({
                                title: "已复制",
                                description: "合约地址已复制到剪贴板",
                              });
                            }}
                            title={addr.address}
                          >
                            {addr.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              className="text-accent hover:text-white hover:bg-primary/50"
                              onClick={() => handleEditAddress(addr)}
                            >
                              编辑
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="text-destructive hover:text-white hover:bg-destructive/90"
                              onClick={() => handleDeleteAddress(addr.id)}
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
            <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
              <h3 className="text-xl mb-4 text-accent">联系方式设置</h3>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                
                const email = document.getElementById("contact-email") as HTMLInputElement;
                const address = document.getElementById("contact-address") as HTMLTextAreaElement;
                
                try {
                  // 更新联系信息
                  await apiRequest("PUT", "/api/contact-info", {
                    email: email.value,
                    address: address.value
                  });
                  
                  toast({
                    title: "更新成功",
                    description: "联系信息已更新",
                  });
                  
                  // 重新获取联系信息
                  await fetchContactInfo();
                } catch (error) {
                  console.error("联系信息操作错误:", error);
                  toast({
                    title: "更新失败",
                    description: "操作失败，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="block text-sm">联系邮箱:</label>
                  <Input 
                    id="contact-email" 
                    type="email"
                    className="bg-primary/50 border-accent"
                    defaultValue={contactInfo.email}
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contact-address" className="block text-sm">联系地址:</label>
                  <textarea 
                    id="contact-address" 
                    className="w-full rounded-md p-2 bg-primary/50 border border-accent"
                    rows={3}
                    defaultValue={contactInfo.address}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="submit"
                    className="bg-accent text-primary hover:bg-accent/80"
                    disabled={loadingContactInfo}
                  >
                    {loadingContactInfo ? "保存中..." : "保存联系信息"}
                  </Button>
                </div>
              </form>
            </div>
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
            <div className="p-4 bg-primary/30 rounded-md text-center">
              <p>音乐管理功能正在施工中...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 订单管理 */}
      {activeTab === "orders" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>订单管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-between items-center">
              <Button 
                variant="outline" 
                className="border-accent text-accent"
                onClick={fetchOrders}
                disabled={loadingOrders}
              >
                {loadingOrders ? "加载中..." : "刷新订单"}
              </Button>
              
              <div className="flex items-center space-x-2">
                <label htmlFor="order-status-filter" className="text-sm">状态筛选:</label>
                <select
                  id="order-status-filter"
                  className="rounded-md p-2 bg-primary/50 border border-accent text-sm"
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  value={orderStatusFilter}
                >
                  <option value="all">全部订单</option>
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="shipped">已发货</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>

            {loadingOrders ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-primary/50">
                    <TableRow>
                      <TableHead className="text-accent">订单号</TableHead>
                      <TableHead className="text-accent">日期</TableHead>
                      <TableHead className="text-accent">总金额</TableHead>
                      <TableHead className="text-accent">支付方式</TableHead>
                      <TableHead className="text-accent">状态</TableHead>
                      <TableHead className="text-accent">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          {orderStatusFilter === 'all' ? "暂无订单记录" : `暂无${getStatusDisplay(orderStatusFilter)}订单`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className={order.status === 'paid' && !order.trackingNumber ? "bg-yellow-900/20" : ""}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString('zh-CN')}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-accent">⊙ {order.ethTotal.toFixed(6)} $STONKS</span>
                              <span className="text-xs text-gray-400">${order.total.toFixed(2)} USD</span>
                            </div>
                          </TableCell>
                          <TableCell>{getPaymentMethodDisplay(order.paymentMethod)}</TableCell>
                          <TableCell>
                            <span className={getStatusClass(order.status)}>
                              {getStatusDisplay(order.status)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                className="text-accent hover:text-white hover:bg-primary/50"
                                onClick={() => setSelectedOrder(order)}
                              >
                                查看详情
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
            
            {/* 订单详情弹窗 */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-nightblue border border-accent rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-accent mb-1">订单 #{selectedOrder.id}</h3>
                        <p className="text-sm text-gray-400">创建于 {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setSelectedOrder(null)}
                      >
                        关闭
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <h4 className="font-medium text-accent">订单状态</h4>
                        <div className="flex items-center gap-3">
                          <span className={getStatusClass(selectedOrder.status)}>
                            {getStatusDisplay(selectedOrder.status)}
                          </span>
                          {selectedOrder.status !== 'cancelled' && (
                            <select
                              className="rounded bg-primary/50 border border-accent p-1 text-sm"
                              value={selectedOrder.status}
                              onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value)}
                            >
                              <option value="pending">待付款</option>
                              <option value="paid">已付款</option>
                              <option value="shipped">已发货</option>
                              <option value="completed">已完成</option>
                              <option value="cancelled">已取消</option>
                            </select>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-accent">支付信息</h4>
                        <p>方式: {getPaymentMethodDisplay(selectedOrder.paymentMethod)}</p>
                        <div className="flex flex-col">
                          <span className="text-accent">⊙ {selectedOrder.ethTotal.toFixed(6)} $STONKS</span>
                          <span className="text-xs text-gray-400">${selectedOrder.total.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="font-medium text-accent mb-2">收货信息</h4>
                      <div className="bg-primary/20 p-3 rounded border border-accent/30">
                        <p className="whitespace-pre-line">{selectedOrder.shippingAddress || '暂无收货地址'}</p>
                      </div>
                    </div>
                    
                    {selectedOrder.status === 'pending' && (
                      <div className="mb-6">
                        <h4 className="font-medium text-accent mb-2">标记为已付款</h4>
                        <Button 
                          variant="outline" 
                          className="border-green-500 text-green-500 hover:bg-green-500/20"
                          onClick={() => handleOrderStatusChange(selectedOrder.id, 'paid')}
                        >
                          确认收到付款
                        </Button>
                      </div>
                    )}
                    
                    {selectedOrder.status === 'paid' && (
                      <div className="mb-6">
                        <h4 className="font-medium text-accent mb-2">添加物流信息</h4>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="输入物流单号" 
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="bg-primary/50 border-accent"
                          />
                          <Button 
                            variant="outline" 
                            className="border-accent text-accent"
                            onClick={() => handleTrackingNumberUpdate(selectedOrder.id)}
                          >
                            提交并发货
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.trackingNumber && (
                      <div className="mb-6">
                        <h4 className="font-medium text-accent mb-2">物流单号</h4>
                        <div className="bg-primary/20 p-3 rounded border border-accent/30">
                          <p>{selectedOrder.trackingNumber}</p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-accent mb-2">订单商品</h4>
                      <div className="rounded-md border border-accent/30 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-primary/50">
                            <TableRow>
                              <TableHead className="text-accent">商品</TableHead>
                              <TableHead className="text-accent">数量</TableHead>
                              <TableHead className="text-accent">单价</TableHead>
                              <TableHead className="text-accent">小计</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrderItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {item.product?.imageUrl && (
                                      <div className="w-12 h-12 bg-primary/30 rounded overflow-hidden">
                                        <img 
                                          src={item.product.imageUrl} 
                                          alt={item.product?.name || '产品图片'} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <p>{item.product?.name || '未知商品'}</p>
                                      {item.size && <p className="text-xs text-gray-400">尺码: {item.size}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-accent">⊙ {item.ethPrice.toFixed(6)}</span>
                                    <span className="text-xs text-gray-400">${item.price.toFixed(2)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-accent">⊙ {(item.ethPrice * item.quantity).toFixed(6)}</span>
                                    <span className="text-xs text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-accent mb-2">订单商品</h4>
                      <div className="rounded-md border border-accent/30 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-primary/50">
                            <TableRow>
                              <TableHead className="text-accent">商品</TableHead>
                              <TableHead className="text-accent">数量</TableHead>
                              <TableHead className="text-accent">单价</TableHead>
                              <TableHead className="text-accent">小计</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrderItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {item.product?.imageUrl && (
                                      <div className="w-12 h-12 bg-primary/30 rounded overflow-hidden">
                                        <img 
                                          src={item.product.imageUrl} 
                                          alt={item.product?.name || '产品图片'} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <p>{item.product?.name || '未知商品'}</p>
                                      {item.size && <p className="text-xs text-gray-400">尺码: {item.size}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-accent">⊙ {item.ethPrice.toFixed(6)}</span>
                                    <span className="text-xs text-gray-400">${item.price.toFixed(2)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-accent">⊙ {(item.ethPrice * item.quantity).toFixed(6)}</span>
                                    <span className="text-xs text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {selectedOrder.notes && (
                      <div className="mt-6">
                        <h4 className="font-medium text-accent mb-2">订单备注</h4>
                        <div className="bg-primary/20 p-3 rounded border border-accent/30">
                          <p className="whitespace-pre-line">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}