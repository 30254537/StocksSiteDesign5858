import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Product, ContractAddress, AboutContent, CommunityActivity, TeamMember, CommunityFeature } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import OrderManagement from "@/components/OrderManagement";
import { X, Plus } from "lucide-react";

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
  
  // 关于我们内容管理状态
  const [aboutContents, setAboutContents] = useState<AboutContent[]>([]);
  const [loadingAboutContents, setLoadingAboutContents] = useState(false);
  const [editingAboutContent, setEditingAboutContent] = useState<AboutContent | null>(null);
  
  // 社区活动管理状态
  const [communityActivities, setCommunityActivities] = useState<CommunityActivity[]>([]);
  const [loadingCommunityActivities, setLoadingCommunityActivities] = useState(false);
  const [editingCommunityActivity, setEditingCommunityActivity] = useState<CommunityActivity | null>(null);
  
  // 团队成员管理状态
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  
  // 社区特点管理状态
  const [communityFeatures, setCommunityFeatures] = useState<CommunityFeature[]>([]);
  const [loadingCommunityFeatures, setLoadingCommunityFeatures] = useState(false);
  const [editingCommunityFeature, setEditingCommunityFeature] = useState<CommunityFeature | null>(null);
  
  // 获取商品列表
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // 添加时间戳参数避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/products?t=${timestamp}`);
      const productData = await response.json();
      console.log("刷新获取的产品数据:", productData);
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

  // 获取关于我们内容
  const fetchAboutContents = async () => {
    setLoadingAboutContents(true);
    try {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/about?t=${timestamp}`);
      const data = await response.json();
      setAboutContents(data);
    } catch (error) {
      console.error("获取关于我们内容失败:", error);
      toast({
        title: "获取关于我们内容失败",
        description: "无法获取关于我们内容，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingAboutContents(false);
    }
  };
  
  // 获取社区活动
  const fetchCommunityActivities = async () => {
    setLoadingCommunityActivities(true);
    try {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/community?t=${timestamp}`);
      const data = await response.json();
      setCommunityActivities(data);
    } catch (error) {
      console.error("获取社区活动失败:", error);
      toast({
        title: "获取社区活动失败",
        description: "无法获取社区活动，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingCommunityActivities(false);
    }
  };
  
  // 获取团队成员
  const fetchTeamMembers = async () => {
    setLoadingTeamMembers(true);
    try {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/team-members?t=${timestamp}`);
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error("获取团队成员失败:", error);
      toast({
        title: "获取团队成员失败",
        description: "无法获取团队成员信息，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingTeamMembers(false);
    }
  };
  
  // 获取社区特点
  const fetchCommunityFeatures = async () => {
    setLoadingCommunityFeatures(true);
    try {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/community-features?t=${timestamp}`);
      const data = await response.json();
      setCommunityFeatures(data);
    } catch (error) {
      console.error("获取社区特点失败:", error);
      toast({
        title: "获取社区特点失败",
        description: "无法获取社区特点信息，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingCommunityFeatures(false);
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
          fetchAboutContents();
          fetchCommunityActivities();
          fetchTeamMembers();
          fetchCommunityFeatures();
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
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/contact-info?t=${timestamp}`);
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
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/contract-addresses?t=${timestamp}`);
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
  
  // 处理编辑关于我们内容
  const handleEditAboutContent = (content: AboutContent) => {
    setEditingAboutContent(content);
    
    // 填充表单
    document.getElementById("about-id")?.setAttribute("value", content.id.toString());
    
    const sectionInput = document.getElementById("about-section") as HTMLInputElement;
    if (sectionInput) sectionInput.value = content.section;
    
    const titleInput = document.getElementById("about-title") as HTMLInputElement;
    if (titleInput) titleInput.value = content.title || "";
    
    const contentInput = document.getElementById("about-content") as HTMLTextAreaElement;
    if (contentInput) contentInput.value = content.content || "";
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("about-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑关于我们内容",
      description: `正在编辑: ${content.section}`,
    });
  };
  
  // 处理删除关于我们内容
  const handleDeleteAboutContent = async (contentId: number) => {
    if (window.confirm("确定要删除此关于我们内容吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/about/${contentId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除关于我们内容失败');
        }
        
        toast({
          title: "删除成功",
          description: "关于我们内容已成功删除",
        });
        
        // 重新获取内容列表以更新UI
        await fetchAboutContents();
      } catch (error) {
        console.error("删除关于我们内容错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除关于我们内容，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };
  
  // 处理编辑社区活动
  const handleEditCommunityActivity = (activity: CommunityActivity) => {
    setEditingCommunityActivity(activity);
    
    // 填充表单
    document.getElementById("activity-id")?.setAttribute("value", activity.id.toString());
    
    const titleInput = document.getElementById("activity-title") as HTMLInputElement;
    if (titleInput) titleInput.value = activity.title;
    
    // 使用 content 而不是 description（根据schema定义）
    const contentInput = document.getElementById("activity-content") as HTMLTextAreaElement;
    if (contentInput) contentInput.value = activity.content || "";
    
    const locationInput = document.getElementById("activity-location") as HTMLInputElement;
    if (locationInput) locationInput.value = activity.location || "";
    
    const startDateInput = document.getElementById("activity-startDate") as HTMLInputElement;
    if (startDateInput && activity.startDate) {
      const date = new Date(activity.startDate);
      const formattedDate = date.toISOString().split('T')[0];
      startDateInput.value = formattedDate;
    }
    
    const endDateInput = document.getElementById("activity-endDate") as HTMLInputElement;
    if (endDateInput && activity.endDate) {
      const date = new Date(activity.endDate);
      const formattedDate = date.toISOString().split('T')[0];
      endDateInput.value = formattedDate;
    }
    
    const imageUrlInput = document.getElementById("activity-imageUrl") as HTMLInputElement;
    if (imageUrlInput) imageUrlInput.value = activity.imageUrl || "";
    
    const activeCheckbox = document.getElementById("activity-active") as HTMLInputElement;
    if (activeCheckbox) activeCheckbox.checked = Boolean(activity.isActive); // 使用 isActive 而不是 active
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("activity-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑社区活动",
      description: `正在编辑: ${activity.title}`,
    });
  };
  
  // 处理删除社区活动
  const handleDeleteCommunityActivity = async (activityId: number) => {
    if (window.confirm("确定要删除此社区活动吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/community/${activityId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除社区活动失败');
        }
        
        toast({
          title: "删除成功",
          description: "社区活动已成功删除",
        });
        
        // 重新获取活动列表以更新UI，确保使用最新数据
        await fetchCommunityActivities();
      } catch (error) {
        console.error("删除社区活动错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除社区活动，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };
  
  // 处理删除合约地址
  const handleDeleteAddress = async (addressId: number) => {
    if (window.confirm("确定要删除此合约地址吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/contract-addresses/${addressId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除合约地址失败');
        }
        
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
  
  // 处理编辑团队成员
  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    
    // 填充表单
    document.getElementById("member-id")?.setAttribute("value", member.id.toString());
    
    const codeInput = document.getElementById("member-code") as HTMLInputElement;
    if (codeInput) codeInput.value = member.code;
    
    const titleInput = document.getElementById("member-title") as HTMLInputElement;
    if (titleInput) titleInput.value = member.title;
    
    const descInput = document.getElementById("member-description") as HTMLTextAreaElement;
    if (descInput) descInput.value = member.description || "";
    
    const imageUrlInput = document.getElementById("member-imageUrl") as HTMLInputElement;
    if (imageUrlInput) imageUrlInput.value = member.imageUrl || "";
    
    const orderIndexInput = document.getElementById("member-orderIndex") as HTMLInputElement;
    if (orderIndexInput) orderIndexInput.value = member.orderIndex?.toString() || "0";
    
    const activeCheckbox = document.getElementById("member-active") as HTMLInputElement;
    if (activeCheckbox) activeCheckbox.checked = Boolean(member.isActive);
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("member-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑团队成员",
      description: `正在编辑: ${member.title}`,
    });
  };
  
  // 处理删除团队成员
  const handleDeleteTeamMember = async (memberId: number) => {
    if (window.confirm("确定要删除此团队成员吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/team-members/${memberId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除团队成员失败');
        }
        
        toast({
          title: "删除成功",
          description: "团队成员已成功删除",
        });
        
        // 重新获取成员列表以更新UI
        await fetchTeamMembers();
      } catch (error) {
        console.error("删除团队成员错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除团队成员，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };
  
  // 处理编辑社区特点
  const handleEditCommunityFeature = (feature: CommunityFeature) => {
    setEditingCommunityFeature(feature);
    
    // 填充表单
    document.getElementById("feature-id")?.setAttribute("value", feature.id.toString());
    
    const titleInput = document.getElementById("feature-title") as HTMLInputElement;
    if (titleInput) titleInput.value = feature.title;
    
    const descInput = document.getElementById("feature-description") as HTMLTextAreaElement;
    if (descInput) descInput.value = feature.description || "";
    
    const iconInput = document.getElementById("feature-icon") as HTMLInputElement;
    if (iconInput) iconInput.value = feature.icon || "";
    
    const orderIndexInput = document.getElementById("feature-orderIndex") as HTMLInputElement;
    if (orderIndexInput) orderIndexInput.value = feature.orderIndex?.toString() || "0";
    
    const activeCheckbox = document.getElementById("feature-active") as HTMLInputElement;
    if (activeCheckbox) activeCheckbox.checked = Boolean(feature.isActive);
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("feature-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑社区特点",
      description: `正在编辑: ${feature.title}`,
    });
  };
  
  // 处理删除社区特点
  const handleDeleteCommunityFeature = async (featureId: number) => {
    if (window.confirm("确定要删除此社区特点吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/community-features/${featureId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除社区特点失败');
        }
        
        toast({
          title: "删除成功",
          description: "社区特点已成功删除",
        });
        
        // 重新获取特点列表以更新UI
        await fetchCommunityFeatures();
      } catch (error) {
        console.error("删除社区特点错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除社区特点，请稍后再试",
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
    
    // 设置类别
    try {
      const categoryTrigger = document.querySelector('[data-id="product-category"]');
      if (categoryTrigger) {
        // 更新 data-value 属性
        categoryTrigger.setAttribute('data-value', product.category || 'clothing');
        
        // 更新显示文本
        const valueElement = categoryTrigger.querySelector('[data-radix-select-value-id]');
        if (valueElement) {
          const categoryMap: {[key: string]: string} = {
            'clothing': '服装',
            'accessories': '配件',
            'collectibles': '收藏品',
            'other': '其他'
          };
          valueElement.textContent = categoryMap[product.category] || '服装';
        }
      }
    } catch (e) {
      console.error("设置类别选择器失败:", e);
    }
    
    // 设置复选框
    const featuredCheckbox = document.getElementById("product-featured") as HTMLInputElement;
    if (featuredCheckbox) featuredCheckbox.checked = Boolean(product.featured);
    
    const hasSizesCheckbox = document.getElementById("product-hasSizes") as HTMLInputElement;
    if (hasSizesCheckbox) hasSizesCheckbox.checked = Boolean(product.hasSizes);
    
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
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/products/${productId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除产品失败');
        }
        
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
            activeTab === "about" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("about")}
        >
          关于我们管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "team" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("team")}
        >
          团队成员管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "features" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("features")}
        >
          社区特点管理
        </button>
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "community" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("community")}
        >
          社区活动管理
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
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "goldDogMonitor" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("goldDogMonitor")}
        >
          金狗监测管理
        </button>
      </div>
      
      {/* 关于我们内容管理 */}
      {activeTab === "about" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>关于我们内容管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 关于我们内容表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const aboutId = document.getElementById("about-id")?.getAttribute("value");
                const section = (document.getElementById("about-section") as HTMLInputElement).value;
                const title = (document.getElementById("about-title") as HTMLInputElement).value;
                const content = (document.getElementById("about-content") as HTMLTextAreaElement).value;
                
                // 基本验证
                if (!section || !content) {
                  toast({
                    title: "表单错误",
                    description: "请填写栏目名称和内容",
                    variant: "destructive",
                  });
                  return;
                }
                
                // 创建数据对象
                const aboutData = {
                  section,
                  title,
                  content
                };
                
                try {
                  // 发送请求
                  let response;
                  
                  if (aboutId) {
                    // 编辑模式
                    response = await apiRequest("PUT", `/api/about/${aboutId}`, aboutData);
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/about", aboutData);
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("about-form") as HTMLFormElement).reset();
                    document.getElementById("about-id")?.removeAttribute("value");
                    setEditingAboutContent(null);
                    
                    // 提示成功
                    toast({
                      title: aboutId ? "更新成功" : "添加成功",
                      description: aboutId ? "关于我们内容已成功更新" : "关于我们内容已成功添加",
                    });
                    
                    // 重新获取内容列表
                    await fetchAboutContents();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("提交关于我们内容表单错误:", error);
                  toast({
                    title: "提交失败",
                    description: "无法保存关于我们内容，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
              id="about-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="hidden" id="about-id" />
                
                <div className="space-y-2">
                  <label htmlFor="about-section" className="block text-sm font-medium">
                    栏目名称
                  </label>
                  <Input
                    id="about-section"
                    placeholder="输入栏目名称，例如：公司简介"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="about-title" className="block text-sm font-medium">
                    标题
                  </label>
                  <Input
                    id="about-title"
                    placeholder="输入标题（可选）"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="about-content" className="block text-sm font-medium">
                    内容
                  </label>
                  <Textarea
                    id="about-content"
                    placeholder="输入内容正文"
                    className="bg-primary/50 border-accent min-h-[150px]"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-accent text-accent"
                  onClick={() => {
                    // 重置表单
                    (document.getElementById("about-form") as HTMLFormElement).reset();
                    document.getElementById("about-id")?.removeAttribute("value");
                    setEditingAboutContent(null);
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-accent text-black hover:bg-accent/80">
                  {editingAboutContent ? "更新内容" : "添加内容"}
                </Button>
              </div>
            </form>
            
            {/* 关于我们内容列表 */}
            <div>
              <h3 className="text-xl font-medium mb-4">现有内容</h3>
              
              {loadingAboutContents ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : aboutContents.length === 0 ? (
                <div className="text-center text-gray-400 p-6">
                  <p>暂无内容，请添加内容</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>栏目名称</TableHead>
                        <TableHead>标题</TableHead>
                        <TableHead>内容预览</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aboutContents.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.section}</TableCell>
                          <TableCell>{item.title || "-"}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{item.content}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-accent"
                              onClick={() => handleEditAboutContent(item)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAboutContent(item.id)}
                            >
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 团队成员管理 */}
      {activeTab === "team" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>团队成员管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 团队成员表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const memberId = document.getElementById("member-id")?.getAttribute("value");
                const code = (document.getElementById("member-code") as HTMLInputElement).value;
                const title = (document.getElementById("member-title") as HTMLInputElement).value;
                const description = (document.getElementById("member-description") as HTMLTextAreaElement).value;
                const imageUrl = (document.getElementById("member-imageUrl") as HTMLInputElement).value;
                const orderIndex = parseInt((document.getElementById("member-orderIndex") as HTMLInputElement).value || "0", 10);
                const isActive = (document.getElementById("member-active") as HTMLInputElement).checked;
                
                // 基本验证
                if (!code || !title || !description) {
                  toast({
                    title: "表单错误",
                    description: "请填写成员代码、名称和介绍",
                    variant: "destructive",
                  });
                  return;
                }
                
                // 创建数据对象
                const memberData = {
                  code,
                  title,
                  description,
                  imageUrl,
                  orderIndex,
                  isActive // Boolean 值, 后端会处理转换
                };
                
                try {
                  // 发送请求
                  let response;
                  
                  if (memberId) {
                    // 编辑模式
                    response = await apiRequest("PUT", `/api/team-members/${memberId}`, memberData);
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/team-members", memberData);
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("member-form") as HTMLFormElement).reset();
                    document.getElementById("member-id")?.removeAttribute("value");
                    setEditingTeamMember(null);
                    
                    // 提示成功
                    toast({
                      title: memberId ? "更新成功" : "添加成功",
                      description: memberId ? "团队成员已成功更新" : "团队成员已成功添加",
                    });
                    
                    // 重新获取成员列表
                    await fetchTeamMembers();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("提交团队成员表单错误:", error);
                  toast({
                    title: "提交失败",
                    description: "无法保存团队成员，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
              id="member-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="hidden" id="member-id" />
                
                <div className="space-y-2">
                  <label htmlFor="member-code" className="block text-sm font-medium">
                    成员代码
                  </label>
                  <Input
                    id="member-code"
                    placeholder="输入成员代码，例如：CEO, CTO"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="member-title" className="block text-sm font-medium">
                    成员名称
                  </label>
                  <Input
                    id="member-title"
                    placeholder="输入成员名称"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="member-imageUrl" className="block text-sm font-medium">
                    头像图片URL
                  </label>
                  <Input
                    id="member-imageUrl"
                    placeholder="输入图片URL"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="member-orderIndex" className="block text-sm font-medium">
                    排序索引
                  </label>
                  <Input
                    id="member-orderIndex"
                    type="number"
                    placeholder="输入排序索引，数字越小越靠前"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="member-description" className="block text-sm font-medium">
                    成员介绍
                  </label>
                  <Textarea
                    id="member-description"
                    placeholder="输入成员介绍"
                    className="bg-primary/50 border-accent min-h-[120px]"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="member-active" defaultChecked />
                    <label htmlFor="member-active" className="text-sm font-medium leading-none">
                      是否激活
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-accent text-accent"
                  onClick={() => {
                    // 重置表单
                    (document.getElementById("member-form") as HTMLFormElement).reset();
                    document.getElementById("member-id")?.removeAttribute("value");
                    setEditingTeamMember(null);
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-accent text-black hover:bg-accent/80">
                  {editingTeamMember ? "更新成员" : "添加成员"}
                </Button>
              </div>
            </form>
            
            {/* 团队成员列表 */}
            <div>
              <h3 className="text-xl font-medium mb-4">现有团队成员</h3>
              
              {loadingTeamMembers ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center text-gray-400 p-6">
                  <p>暂无团队成员，请添加成员</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排序</TableHead>
                        <TableHead>代码</TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead>头像</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.orderIndex}</TableCell>
                          <TableCell className="font-medium">{item.code}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>
                            {item.imageUrl ? (
                              <div className="w-10 h-10 overflow-hidden rounded-full">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-xs">无图片</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? "success" : "secondary"}>{item.isActive ? "激活" : "未激活"}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-accent"
                              onClick={() => handleEditTeamMember(item)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTeamMember(item.id)}
                            >
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 社区特点管理 */}
      {activeTab === "features" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>社区特点管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 社区特点表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const featureId = document.getElementById("feature-id")?.getAttribute("value");
                const title = (document.getElementById("feature-title") as HTMLInputElement).value;
                const description = (document.getElementById("feature-description") as HTMLTextAreaElement).value;
                const icon = (document.getElementById("feature-icon") as HTMLInputElement).value;
                const orderIndex = parseInt((document.getElementById("feature-orderIndex") as HTMLInputElement).value || "0", 10);
                const isActive = (document.getElementById("feature-active") as HTMLInputElement).checked;
                
                // 基本验证
                if (!title || !description) {
                  toast({
                    title: "表单错误",
                    description: "请填写特点标题和描述",
                    variant: "destructive",
                  });
                  return;
                }
                
                // 创建数据对象
                const featureData = {
                  title,
                  description,
                  icon,
                  orderIndex,
                  isActive // Boolean 值, 后端会处理转换
                };
                
                try {
                  // 发送请求
                  let response;
                  
                  if (featureId) {
                    // 编辑模式
                    response = await apiRequest("PUT", `/api/community-features/${featureId}`, featureData);
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/community-features", featureData);
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("feature-form") as HTMLFormElement).reset();
                    document.getElementById("feature-id")?.removeAttribute("value");
                    setEditingCommunityFeature(null);
                    
                    // 提示成功
                    toast({
                      title: featureId ? "更新成功" : "添加成功",
                      description: featureId ? "社区特点已成功更新" : "社区特点已成功添加",
                    });
                    
                    // 重新获取特点列表
                    await fetchCommunityFeatures();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("提交社区特点表单错误:", error);
                  toast({
                    title: "提交失败",
                    description: "无法保存社区特点，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
              id="feature-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="hidden" id="feature-id" />
                
                <div className="space-y-2">
                  <label htmlFor="feature-title" className="block text-sm font-medium">
                    特点标题
                  </label>
                  <Input
                    id="feature-title"
                    placeholder="输入特点标题"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="feature-icon" className="block text-sm font-medium">
                    图标名称
                  </label>
                  <Input
                    id="feature-icon"
                    placeholder="输入图标名称，例如：star, check, shield"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="feature-orderIndex" className="block text-sm font-medium">
                    排序索引
                  </label>
                  <Input
                    id="feature-orderIndex"
                    type="number"
                    placeholder="输入排序索引，数字越小越靠前"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="feature-active" defaultChecked />
                    <label htmlFor="feature-active" className="text-sm font-medium leading-none">
                      是否激活
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="feature-description" className="block text-sm font-medium">
                    特点描述
                  </label>
                  <Textarea
                    id="feature-description"
                    placeholder="输入特点描述"
                    className="bg-primary/50 border-accent min-h-[120px]"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-accent text-accent"
                  onClick={() => {
                    // 重置表单
                    (document.getElementById("feature-form") as HTMLFormElement).reset();
                    document.getElementById("feature-id")?.removeAttribute("value");
                    setEditingCommunityFeature(null);
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-accent text-black hover:bg-accent/80">
                  {editingCommunityFeature ? "更新特点" : "添加特点"}
                </Button>
              </div>
            </form>
            
            {/* 社区特点列表 */}
            <div>
              <h3 className="text-xl font-medium mb-4">现有社区特点</h3>
              
              {loadingCommunityFeatures ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : communityFeatures.length === 0 ? (
                <div className="text-center text-gray-400 p-6">
                  <p>暂无社区特点，请添加特点</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排序</TableHead>
                        <TableHead>标题</TableHead>
                        <TableHead>图标</TableHead>
                        <TableHead>描述预览</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communityFeatures.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.orderIndex}</TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.icon || "-"}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{item.description}</TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? "success" : "secondary"}>{item.isActive ? "激活" : "未激活"}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-accent"
                              onClick={() => handleEditCommunityFeature(item)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCommunityFeature(item.id)}
                            >
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 社区活动管理 */}
      {activeTab === "community" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>社区活动管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 社区活动表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const activityId = document.getElementById("activity-id")?.getAttribute("value");
                const title = (document.getElementById("activity-title") as HTMLInputElement).value;
                const content = (document.getElementById("activity-content") as HTMLTextAreaElement).value;
                const location = (document.getElementById("activity-location") as HTMLInputElement).value;
                const startDate = (document.getElementById("activity-startDate") as HTMLInputElement).value;
                const endDate = (document.getElementById("activity-endDate") as HTMLInputElement).value;
                const imageUrl = (document.getElementById("activity-imageUrl") as HTMLInputElement).value;
                const isActive = (document.getElementById("activity-active") as HTMLInputElement).checked;
                
                // 基本验证
                if (!title || !content) {
                  toast({
                    title: "表单错误",
                    description: "请填写活动标题和内容",
                    variant: "destructive",
                  });
                  return;
                }
                
                // 创建数据对象
                const activityData = {
                  title,
                  content,
                  location,
                  startDate: startDate || null,
                  endDate: endDate || null,
                  imageUrl,
                  isActive // Boolean 值, 后端会处理转换
                };
                
                try {
                  // 发送请求
                  let response;
                  
                  if (activityId) {
                    // 编辑模式
                    response = await apiRequest("PUT", `/api/community/${activityId}`, activityData);
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/community", activityData);
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("activity-form") as HTMLFormElement).reset();
                    document.getElementById("activity-id")?.removeAttribute("value");
                    setEditingCommunityActivity(null);
                    
                    // 提示成功
                    toast({
                      title: activityId ? "更新成功" : "添加成功",
                      description: activityId ? "社区活动已成功更新" : "社区活动已成功添加",
                    });
                    
                    // 重新获取活动列表
                    await fetchCommunityActivities();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("提交社区活动表单错误:", error);
                  toast({
                    title: "提交失败",
                    description: "无法保存社区活动，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
              id="activity-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input type="hidden" id="activity-id" />
                
                <div className="space-y-2">
                  <label htmlFor="activity-title" className="block text-sm font-medium">
                    活动标题
                  </label>
                  <Input
                    id="activity-title"
                    placeholder="输入活动标题"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="activity-location" className="block text-sm font-medium">
                    活动地点
                  </label>
                  <Input
                    id="activity-location"
                    placeholder="输入活动地点"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="activity-startDate" className="block text-sm font-medium">
                    开始日期
                  </label>
                  <Input
                    id="activity-startDate"
                    type="date"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="activity-endDate" className="block text-sm font-medium">
                    结束日期
                  </label>
                  <Input
                    id="activity-endDate"
                    type="date"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="activity-content" className="block text-sm font-medium">
                    活动内容
                  </label>
                  <Textarea
                    id="activity-content"
                    placeholder="输入活动详细内容"
                    className="bg-primary/50 border-accent min-h-[150px]"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="activity-imageUrl" className="block text-sm font-medium">
                    图片URL
                  </label>
                  <Input
                    id="activity-imageUrl"
                    placeholder="输入图片URL（可选）"
                    className="bg-primary/50 border-accent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activity-active"
                    className="w-4 h-4 mr-2 accent-accent"
                    defaultChecked={true}
                  />
                  <label htmlFor="activity-active" className="text-sm font-medium">
                    显示活动（设为激活状态）
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-accent text-accent"
                  onClick={() => {
                    // 重置表单
                    (document.getElementById("activity-form") as HTMLFormElement).reset();
                    document.getElementById("activity-id")?.removeAttribute("value");
                    setEditingCommunityActivity(null);
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-accent text-black hover:bg-accent/80">
                  {editingCommunityActivity ? "更新活动" : "添加活动"}
                </Button>
              </div>
            </form>
            
            {/* 社区活动列表 */}
            <div>
              <h3 className="text-xl font-medium mb-4">现有社区活动</h3>
              
              {loadingCommunityActivities ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : communityActivities.length === 0 ? (
                <div className="text-center text-gray-400 p-6">
                  <p>暂无活动，请添加活动</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>活动标题</TableHead>
                        <TableHead>开始日期</TableHead>
                        <TableHead>结束日期</TableHead>
                        <TableHead>地点</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communityActivities.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            {item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>{item.location || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={item.isActive ? "default" : "outline"}
                              className={item.isActive ? "bg-green-600" : ""}
                            >
                              {item.isActive ? "激活" : "未激活"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-accent"
                              onClick={() => handleEditCommunityActivity(item)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCommunityActivity(item.id)}
                            >
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
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
                const categoryElement = document.querySelector('[data-id="product-category"]');
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
                
                // 创建产品数据对象并作为JSON字符串添加到表单
                const productData: any = {
                  name,
                  price,
                  description,
                  stock: isNaN(stock) ? 0 : stock,
                  featured: featured ? 1 : 0,  // 转换为整数
                  category,
                  hasSizes: hasSizes ? 1 : 0   // 转换为整数
                };
                
                // 添加现有图片信息 (编辑模式需要)
                if (editingProduct) {
                  // 保留现有图片信息
                  productData.existingImages = editingProduct.imageUrls || [];
                  if (editingProduct.imageUrl && !productData.existingImages.includes(editingProduct.imageUrl)) {
                    productData.existingImages.unshift(editingProduct.imageUrl);
                  }
                }
                
                // 将产品数据作为JSON字符串添加
                formData.append("productData", JSON.stringify(productData));
                
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
                    // 新增模式，确保至少有一个图片
                    if (selectedFilesObjects.length === 0) {
                      toast({
                        title: "缺少图片",
                        description: "请至少上传一张商品图片",
                        variant: "destructive",
                      });
                      return;
                    }
                    console.log("提交新产品表单数据:", formData);
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
                        {/* 主图 */}
                        <div className="relative w-24 h-24 bg-primary/30 rounded overflow-hidden group">
                          <img
                            src={editingProduct.imageUrl}
                            alt={editingProduct.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                            onClick={() => {
                              // 确认删除
                              if (!window.confirm('确定要删除此图片吗？这将影响产品展示')) return;
                              
                              const newImages = editingProduct.imageUrls?.filter(img => img !== editingProduct.imageUrl) || [];
                              
                              // 更新编辑中的产品
                              setEditingProduct({
                                ...editingProduct,
                                imageUrl: newImages.length > 0 ? newImages[0] : '',
                                imageUrls: newImages
                              });
                            }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        
                        {/* 其他图片 */}
                        {editingProduct.imageUrls && editingProduct.imageUrls
                          .filter(img => img !== editingProduct.imageUrl) 
                          .map((img: string, idx: number) => (
                            <div key={idx} className="relative w-24 h-24 bg-primary/30 rounded overflow-hidden group">
                              <img
                                src={img}
                                alt={`${editingProduct.name} ${idx + 2}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                                onClick={() => {
                                  // 确认删除
                                  if (!window.confirm('确定要删除此图片吗？')) return;
                                  
                                  // 从图片列表中移除该图片
                                  const newImages = editingProduct.imageUrls?.filter(image => image !== img) || [];
                                  
                                  // 更新编辑中的产品
                                  setEditingProduct({
                                    ...editingProduct,
                                    imageUrls: newImages
                                  });
                                }}
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))
                        }
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
      
      {/* 金狗监测管理 */}
      {activeTab === "goldDogMonitor" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>金狗监测管理</CardTitle>
            <CardDescription>添加、编辑和管理金狗监测内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-accent text-black hover:bg-accent/80"
                onClick={() => setLocation("/manage-gold-dog-monitor")}
              >
                <Plus className="mr-2 h-4 w-4" />
                管理金狗监测内容
              </Button>
            </div>
            <p className="text-center text-muted-foreground">
              点击上方按钮进入金狗监测专用管理界面，在那里您可以添加、编辑和管理所有金狗监测内容。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}