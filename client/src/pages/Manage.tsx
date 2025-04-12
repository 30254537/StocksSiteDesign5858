import { useState, useEffect, useRef } from "react";
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

export default function Manage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // 管理选项卡切换状态
  const [activeTab, setActiveTab] = useState<string>("products");
  
  // 通用状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // 推文管理状态
  const [tweets, setTweets] = useState<any[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);
  
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
  
  // 网站内容管理状态
  const [websiteContents, setWebsiteContents] = useState<any[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [editingContent, setEditingContent] = useState<any | null>(null);
  
  // 获取网站内容数据
  const fetchWebsiteContents = async () => {
    setLoadingContents(true);
    try {
      const response = await apiRequest("GET", "/api/website-contents");
      const data = await response.json();
      setWebsiteContents(data);
    } catch (error) {
      console.error("获取网站内容失败:", error);
      toast({
        title: "获取失败",
        description: "无法获取网站内容数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingContents(false);
    }
  };
  
  // 处理编辑网站内容
  const handleEditContent = (content: any) => {
    setEditingContent(content);
    
    // 填充表单
    document.getElementById("content-id")?.setAttribute("value", content.id.toString());
    
    const keyInput = document.getElementById("content-key") as HTMLInputElement;
    if (keyInput) keyInput.value = content.key;
    
    const valueInput = document.getElementById("content-value") as HTMLTextAreaElement;
    if (valueInput) valueInput.value = content.value || "";
    
    const sectionInput = document.getElementById("content-section") as HTMLInputElement;
    if (sectionInput) sectionInput.value = content.section || "";
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("content-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑网站内容",
      description: `正在编辑: ${content.key}`,
    });
  };
  
  // 处理删除网站内容
  const handleDeleteContent = async (contentId: number) => {
    if (window.confirm("确定要删除此网站内容项吗？此操作无法撤销。")) {
      try {
        // 发送删除请求
        await apiRequest("DELETE", `/api/website-contents/${contentId}`);
        
        toast({
          title: "删除成功",
          description: "网站内容项已成功删除",
        });
        
        // 重新获取内容列表以更新UI
        await fetchWebsiteContents();
      } catch (error) {
        console.error("删除网站内容错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除网站内容，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };
  
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // 清除产品相关翻译缓存
      import('@/lib/translations').then(({ clearTranslationCache }) => {
        // 清除所有产品名称的翻译缓存
        clearTranslationCache('product.name');
        console.log("已清除产品名称翻译缓存");
      });
      
      // 添加时间戳参数避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/products?t=${timestamp}`, null, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // 清除响应缓存
      const productData = await response.json();
      console.log("刷新获取的产品数据:", productData);
      
      // 强制重新渲染：先清空产品列表，然后用setTimeout确保DOM更新后再设置新数据
      setProducts([]);
      
      // 立即设置实际数据，确保UI能立即更新
      setTimeout(() => {
        setProducts(productData);
        console.log("产品数据已更新，强制重绘");
      }, 10);
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

  // 获取推文数据
  const fetchTweets = async () => {
    setLoadingTweets(true);
    try {
      const response = await apiRequest("GET", "/api/crypto-tweets");
      const data = await response.json();
      setTweets(data.data || []);
    } catch (error) {
      console.error("获取推文失败:", error);
      toast({
        title: "获取推文失败",
        description: "无法获取推文数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingTweets(false);
    }
  };
  
  // 处理推文翻译
  const handleTranslateTweet = async (tweetId: number) => {
    try {
      const response = await apiRequest("POST", `/api/crypto-tweets/${tweetId}/translate`);
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "翻译成功",
          description: "推文已成功翻译",
        });
        
        // 更新推文列表中的翻译
        setTweets(prevTweets => 
          prevTweets.map(tweet => 
            tweet.id === tweetId ? { ...tweet, translatedText: data.tweet.translatedText, isTranslated: true } : tweet
          )
        );
      } else {
        toast({
          title: "翻译失败",
          description: "无法翻译推文，请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("翻译推文错误:", error);
      toast({
        title: "翻译失败",
        description: "无法翻译推文，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 添加测试合约地址推文
  const handleAddTestContractTweet = async () => {
    try {
      setLoadingTweets(true);
      const response = await apiRequest("POST", "/api/test/add-contract-tweet");
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "添加成功",
          description: "测试合约地址推文已添加",
        });
        
        // 重新获取推文列表
        await fetchTweets();
      } else {
        toast({
          title: "添加失败",
          description: "无法添加测试合约地址推文，请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("添加测试合约地址推文错误:", error);
      toast({
        title: "添加失败",
        description: "无法添加测试合约地址推文，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingTweets(false);
    }
  };

  // 处理刷新推文
  const handleSyncTweets = async () => {
    try {
      setLoadingTweets(true);
      const response = await apiRequest("POST", "/api/crypto-tweets/sync");
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "同步成功",
          description: data.message || "推文已成功同步",
        });
        
        // 重新获取推文列表
        await fetchTweets();
      } else {
        toast({
          title: "同步失败",
          description: "无法同步推文，请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("同步推文错误:", error);
      toast({
        title: "同步失败",
        description: "无法同步推文，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingTweets(false);
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
          // 获取合约地址列表
          fetchContractAddresses();
          // 获取推文数据
          fetchTweets();
          // 获取网站内容数据
          fetchWebsiteContents();
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
        // 发送删除请求
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
        // 清除特定产品的翻译缓存
        import('@/lib/translations').then(({ clearTranslationCache }) => {
          // 清除该产品的翻译缓存
          clearTranslationCache(`product.name.${productId}`);
          console.log(`已清除产品 ${productId} 的翻译缓存`);
        });
        
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
  
  // 文件处理函数
  
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
      
      {/* 管理导航选项卡 - 使用两行布局确保所有选项可见 */}
      <div className="border-b border-accent/30 mb-8">
        {/* 第一行 */}
        <div className="flex flex-wrap mb-2">
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
        </div>
          
        {/* 第二行 */}
        <div className="flex flex-wrap">
          <button
            className={`px-4 py-2 font-medium transition-colors duration-200 ${
              activeTab === "contents" 
                ? "text-accent border-b-2 border-accent" 
                : "text-gray-400 hover:text-accent"
            }`}
            onClick={() => setActiveTab("contents")}
          >
            网站内容管理
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
          
          <button
            className={`px-4 py-2 font-medium transition-colors duration-200 ${
              activeTab === "tweets" 
                ? "text-accent border-b-2 border-accent" 
                : "text-gray-400 hover:text-accent"
            }`}
            onClick={() => setActiveTab("tweets")}
          >
            推文管理
          </button>
        </div>
      </div>
      
      {/* 根据活动选项卡展示不同的卡片 */}
      {activeTab === "contents" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>网站内容管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
              <h3 className="text-xl mb-4 text-accent">内容表单</h3>
              <form id="content-form" className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                
                const contentId = document.getElementById("content-id") as HTMLInputElement;
                const key = document.getElementById("content-key") as HTMLInputElement;
                const value = document.getElementById("content-value") as HTMLTextAreaElement;
                const section = document.getElementById("content-section") as HTMLInputElement;
                
                const isEditing = contentId.value ? true : false;
                
                try {
                  // 构建内容数据
                  const contentData = {
                    key: key.value,
                    value: value.value,
                    section: section.value,
                  };
                  
                  // 发送请求
                  if (isEditing) {
                    // 更新内容
                    await apiRequest("PUT", `/api/website-contents/${contentId.value}`, contentData);
                    
                    toast({
                      title: "更新成功",
                      description: `内容项 "${key.value}" 已更新`,
                    });
                  } else {
                    // 创建新内容
                    await apiRequest("POST", "/api/website-contents", contentData);
                    
                    toast({
                      title: "添加成功",
                      description: `内容项 "${key.value}" 已添加`,
                    });
                  }
                  
                  // 重置表单
                  if (!isEditing) {
                    e.currentTarget.reset();
                  }
                  
                  // 重新获取内容列表更新UI
                  await fetchWebsiteContents();
                  
                  // 重置编辑状态
                  if (isEditing) {
                    setEditingContent(null);
                    contentId.value = "";
                    window.scrollTo({ top: document.getElementById("contents-table")?.offsetTop || 0, behavior: "smooth" });
                  }
                } catch (error) {
                  console.error("内容操作错误:", error);
                  toast({
                    title: isEditing ? "更新失败" : "添加失败",
                    description: "操作失败，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}>
                <input type="hidden" id="content-id" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="content-key" className="block text-sm">内容关键字:</label>
                    <Input 
                      id="content-key" 
                      className="bg-primary/50 border-accent"
                      placeholder="例如: home.title, about.description"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="content-section" className="block text-sm">内容分类:</label>
                    <Input 
                      id="content-section" 
                      className="bg-primary/50 border-accent"
                      placeholder="例如: home, about, footer"
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="content-value" className="block text-sm">内容值:</label>
                  <textarea 
                    id="content-value" 
                    className="w-full rounded-md p-2 bg-primary/50 border border-accent"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  {editingContent && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="border-accent text-accent"
                      onClick={() => {
                        setEditingContent(null);
                        (document.getElementById("content-id") as HTMLInputElement).value = "";
                        (document.getElementById("content-form") as HTMLFormElement).reset();
                      }}
                    >
                      取消编辑
                    </Button>
                  )}
                  <Button 
                    type="submit"
                    className="bg-accent text-primary hover:bg-accent/80"
                  >
                    {editingContent ? "更新内容" : "添加内容"}
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="mb-4 flex justify-between items-center">
              <Button 
                variant="outline" 
                className="border-accent text-accent"
                onClick={fetchWebsiteContents}
                disabled={loadingContents}
              >
                {loadingContents ? "加载中..." : "刷新数据"}
              </Button>
            </div>

            {loadingContents ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div id="contents-table" className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-primary/50">
                    <TableRow>
                      <TableHead className="text-accent">ID</TableHead>
                      <TableHead className="text-accent">键名</TableHead>
                      <TableHead className="text-accent">分类</TableHead>
                      <TableHead className="text-accent">内容</TableHead>
                      <TableHead className="text-accent">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {websiteContents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          暂无网站内容数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      websiteContents.map((content) => (
                        <TableRow key={content.id}>
                          <TableCell>{content.id}</TableCell>
                          <TableCell>{content.key}</TableCell>
                          <TableCell>{content.section || "未分类"}</TableCell>
                          <TableCell>
                            <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                              {content.value}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                className="text-accent hover:text-white hover:bg-primary/50"
                                onClick={() => handleEditContent(content)}
                              >
                                编辑
                              </Button>
                              <Button 
                                variant="ghost" 
                                className="text-destructive hover:text-white hover:bg-destructive/90"
                                onClick={() => handleDeleteContent(content.id)}
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
                  
                  // 清除正在编辑的产品的翻译缓存
                  import('@/lib/translations').then(({ clearTranslationCache }) => {
                    // 清除该产品的翻译缓存
                    clearTranslationCache(`product.name.${productId.value}`);
                    console.log(`已清除产品 ${productId.value} 的翻译缓存 (更新表单)`);
                  });
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
      {activeTab === "contact" && (
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

      {/* 合约地址管理卡片 */}
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
              
              if (!network.value || !coinType.value || !address.value) {
                toast({
                  title: "表单验证失败",
                  description: "请填写所有字段",
                  variant: "destructive",
                });
                return;
              }
              
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
                addressId.value = "";
                setEditingAddress(null);
                
                // 重新获取合约地址列表
                await fetchContractAddresses();
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
                  <label htmlFor="address-network" className="block text-sm">区块链网络:</label>
                  <Select id="address-network" defaultValue="SOL">
                    <SelectTrigger className="bg-primary/50 border-accent">
                      <SelectValue placeholder="选择网络" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="BSC">Binance Smart Chain (BSC)</SelectItem>
                      <SelectItem value="TRON">Tron (TRX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address-coin-type" className="block text-sm">代币类型:</label>
                  <Select id="address-coin-type" defaultValue="STONKS">
                    <SelectTrigger className="bg-primary/50 border-accent">
                      <SelectValue placeholder="选择代币类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STONKS">STONKS</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="address-value" className="block text-sm">合约地址:</label>
                <Input 
                  id="address-value" 
                  className="bg-primary/50 border-accent font-mono text-sm"
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
                  disabled={loadingAddresses}
                >
                  {loadingAddresses ? (
                    <>
                      <span className="mr-2">处理中</span>
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </>
                  ) : (editingAddress ? "更新合约地址" : "添加合约地址")}
                </Button>
              </div>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>区块链网络</TableHead>
                  <TableHead>代币类型</TableHead>
                  <TableHead>合约地址</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractAddresses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {loadingAddresses ? (
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full"></div>
                          <span>加载合约地址中...</span>
                        </div>
                      ) : "尚未添加任何合约地址"}
                    </TableCell>
                  </TableRow>
                ) : (
                  contractAddresses.map((address) => (
                    <TableRow key={address.id}>
                      <TableCell>{address.id}</TableCell>
                      <TableCell>{address.network}</TableCell>
                      <TableCell>{address.coinType}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate user-select-all">
                        {address.address}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-accent"
                            onClick={() => handleEditAddress(address)}
                          >
                            ✎
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            ✕
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

      {/* 推文管理卡片 */}
      {activeTab === "tweets" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>推文管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 bg-primary/20 p-6 rounded-lg border border-accent/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl text-accent">加密货币推文</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    onClick={() => handleAddTestContractTweet()}
                    disabled={loadingTweets}
                  >
                    添加测试合约推文
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-accent text-accent"
                    onClick={handleSyncTweets}
                    disabled={loadingTweets}
                  >
                    {loadingTweets ? (
                      <>
                        <span className="mr-2">同步中</span>
                        <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full"></div>
                      </>
                    ) : "同步最新推文"}
                  </Button>
                </div>
              </div>
              
              {loadingTweets ? (
                <div className="flex justify-center my-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tweets.length === 0 ? (
                    <div className="text-center py-12 bg-primary/40 rounded-md">
                      <p>暂无推文数据</p>
                      <Button 
                        variant="ghost" 
                        className="mt-2 text-accent hover:text-white"
                        onClick={handleSyncTweets}
                      >
                        点击同步推文
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {tweets.map((tweet: any) => (
                        <div key={tweet.id} className="p-4 bg-primary/40 rounded-md border border-accent/20">
                          <div className="flex items-start gap-3">
                            {tweet.authorProfileImage && (
                              <img 
                                src={tweet.authorProfileImage} 
                                alt={tweet.authorName}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">{tweet.authorName}</p>
                                  <p className="text-sm text-gray-400">@{tweet.authorUsername}</p>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(tweet.createdAt).toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <p className="mb-1">原文:</p>
                                <div className="p-2 bg-primary/50 rounded border border-accent/10 text-white">
                                  {tweet.text}
                                </div>
                                
                                <div className="mt-3">
                                  <p className="mb-1">翻译:</p>
                                  <div className="p-2 bg-primary/50 rounded border border-accent/10 text-white">
                                    {tweet.translatedText ? (
                                      tweet.translatedText
                                    ) : (
                                      <span className="text-gray-400">暂无翻译</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-accent border-accent"
                                    onClick={() => handleTranslateTweet(tweet.id)}
                                    disabled={loadingTweets}
                                  >
                                    {tweet.translatedText ? "重新翻译" : "手动翻译"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
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