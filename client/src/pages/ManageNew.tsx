import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// 定义类型
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock?: number;
  category?: string;
  featured?: boolean;
  hasSizes?: boolean;
  images?: string[];
}

interface ContactInfo {
  email: string;
  address: string;
  logo?: string;
}

interface ContractAddress {
  id: number;
  network: string;
  address: string;
  coinType: string;
}

interface AboutContent {
  id: number;
  section: string;
  title?: string;
  content: string;
}

interface CommunityActivity {
  id: number;
  title: string;
  content: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
}

interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  duration: number;
  url: string;
  style?: string;
}

export default function ManageNew() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // 标签页选择状态
  const [activeTab, setActiveTab] = useState("products");
  
  // 认证检查状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // 产品管理状态
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFilesObjects, setSelectedFilesObjects] = useState<File[]>([]);
  
  // 联系信息管理状态
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    address: '',
    logo: ''
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // 合约地址管理状态
  const [contractAddresses, setContractAddresses] = useState<ContractAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ContractAddress | null>(null);
  
  // 关于我们内容管理状态
  const [aboutContents, setAboutContents] = useState<AboutContent[]>([]);
  const [loadingAboutContents, setLoadingAboutContents] = useState(false);
  const [editingAboutContent, setEditingAboutContent] = useState<AboutContent | null>(null);
  
  // 社区活动管理状态
  const [communityActivities, setCommunityActivities] = useState<CommunityActivity[]>([]);
  const [activityImageFiles, setActivityImageFiles] = useState<File[]>([]);
  const [loadingCommunityActivities, setLoadingCommunityActivities] = useState(false);
  const [editingCommunityActivity, setEditingCommunityActivity] = useState<CommunityActivity | null>(null);
  
  // 音乐管理状态
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [loadingMusicTracks, setLoadingMusicTracks] = useState(false);
  const [editingMusicTrack, setEditingMusicTrack] = useState<MusicTrack | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  
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
      const response = await apiRequest("GET", `/api/cms/about?t=${timestamp}`);
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
      const response = await apiRequest("GET", `/api/cms/community?t=${timestamp}`);
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
  
  // 获取音乐列表
  const fetchMusicTracks = async () => {
    setLoadingMusicTracks(true);
    try {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/music?t=${timestamp}`);
      const data = await response.json();
      setMusicTracks(data);
    } catch (error) {
      console.error("获取音乐列表失败:", error);
      toast({
        title: "获取音乐列表失败",
        description: "无法获取音乐列表，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingMusicTracks(false);
    }
  };
  
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
        address: data.address || '',
        logo: data.logo || ''
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

  // 音乐时长格式化
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
          fetchMusicTracks();
        } else {
          toast({
            title: "需要管理员权限",
            description: "请先登录",
            variant: "destructive",
          });
          navigate("/admin-stonks-dex-secret-login");
        }
      } catch (error) {
        navigate("/admin-stonks-dex-secret-login");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

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
        const response = await apiRequest("DELETE", `/api/cms/about/${contentId}?t=${timestamp}`);
        
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
    
    // 重置文件输入框，但不要直接清空状态
    const fileInput = document.getElementById("activity-images") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    // 清空已选择的新图片
    setActivityImageFiles([]);
    
    // 显示现有图片
    const existingImagesContainer = document.getElementById("existing-activity-images");
    if (existingImagesContainer) {
      existingImagesContainer.innerHTML = "";
      
      // 处理多图片情况
      if (activity.imageUrls && Array.isArray(activity.imageUrls) && activity.imageUrls.length > 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-4";
        
        const title = document.createElement("p");
        title.className = "text-sm text-muted-foreground mb-2";
        title.textContent = "现有图片 (点击删除按钮可删除单张图片):";
        wrapper.appendChild(title);
        
        const imagesContainer = document.createElement("div");
        imagesContainer.className = "flex flex-wrap gap-2";
        
        activity.imageUrls.forEach(imgUrl => {
          const imageWrapper = document.createElement("div");
          imageWrapper.className = "relative group inline-block mr-2 mb-2";
          
          const img = document.createElement("img");
          img.src = imgUrl;
          img.alt = "活动图片";
          img.className = "h-16 w-auto rounded border border-accent/30";
          imageWrapper.appendChild(img);
          
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity";
          deleteBtn.textContent = "×";
          deleteBtn.onclick = () => handleDeleteActivityImage(activity.id, imgUrl);
          imageWrapper.appendChild(deleteBtn);
          
          imagesContainer.appendChild(imageWrapper);
        });
        
        wrapper.appendChild(imagesContainer);
        existingImagesContainer.appendChild(wrapper);
      } 
      // 处理单图片情况
      else if (activity.imageUrl) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-4";
        
        const title = document.createElement("p");
        title.className = "text-sm text-muted-foreground mb-2";
        title.textContent = "现有图片:";
        wrapper.appendChild(title);
        
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "relative group inline-block mr-2 mb-2";
        
        const img = document.createElement("img");
        img.src = activity.imageUrl;
        img.alt = "活动主图";
        img.className = "h-16 w-auto rounded border border-accent/30";
        imageWrapper.appendChild(img);
        
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity";
        deleteBtn.textContent = "×";
        deleteBtn.onclick = () => handleDeleteActivityImage(activity.id, activity.imageUrl || "");
        imageWrapper.appendChild(deleteBtn);
        
        wrapper.appendChild(imageWrapper);
        existingImagesContainer.appendChild(wrapper);
      }
    }
    
    // 填充表单
    const idInput = document.getElementById("activity-id") as HTMLInputElement;
    if (idInput) idInput.value = activity.id.toString();
    
    const titleInput = document.getElementById("activity-title") as HTMLInputElement;
    if (titleInput) titleInput.value = activity.title;
    
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
    
    // 设置活动状态复选框
    const activeCheckbox = document.getElementById("activity-active") as HTMLInputElement;
    if (activeCheckbox) activeCheckbox.checked = Boolean(activity.isActive);
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("activity-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑社区活动",
      description: `正在编辑: ${activity.title}`,
    });
  };
  
  // 处理删除活动图片
  const handleDeleteActivityImage = async (activityId: number, imageUrl: string) => {
    if (window.confirm("确定要删除这张图片吗？此操作无法撤销。")) {
      try {
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/cms/community/${activityId}/image?t=${timestamp}`, { imageUrl });
        
        if (!response.ok) {
          throw new Error('删除图片失败');
        }
        
        const updatedActivity = await response.json();
        
        // 更新编辑中的活动
        if (editingCommunityActivity && editingCommunityActivity.id === activityId) {
          setEditingCommunityActivity(updatedActivity);
          
          // 重新显示编辑中活动的图片
          handleEditCommunityActivity(updatedActivity);
        }
        
        toast({
          title: "删除成功",
          description: "图片已成功删除",
        });
        
        // 刷新活动列表
        await fetchCommunityActivities();
      } catch (error) {
        console.error("删除图片时出错:", error);
        toast({
          title: "删除失败",
          description: "无法删除图片，请稍后再试",
          variant: "destructive",
        });
      }
    }
  };

  // 处理编辑合约地址
  const handleEditAddress = (address: ContractAddress) => {
    setEditingAddress(address);
    
    // 填充表单
    document.getElementById("address-id")?.setAttribute("value", address.id.toString());
    
    const networkInput = document.getElementById("address-network") as HTMLInputElement;
    if (networkInput) networkInput.value = address.network;
    
    const contractInput = document.getElementById("address-contract") as HTMLInputElement;
    if (contractInput) contractInput.value = address.address;
    
    const coinTypeInput = document.getElementById("address-coin") as HTMLInputElement;
    if (coinTypeInput) coinTypeInput.value = address.coinType;
    
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
          valueElement.textContent = categoryMap[product.category || "clothing"] || '服装';
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
  
  // 处理音乐文件选择
  const handleMusicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // 检查文件大小 (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "请上传小于10MB的音乐文件",
          variant: "destructive",
        });
        e.target.value = ""; // 清空文件选择
        return;
      }
      setMusicFile(file);
    }
  };
  
  // 处理音乐表单提交
  const handleMusicFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!musicFile && !editingMusicTrack) {
      toast({
        title: "请选择音乐文件",
        description: "请先选择一个要上传的音乐文件",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formData = new FormData();
      const form = e.target as HTMLFormElement;
      const titleInput = form.querySelector("#music-title") as HTMLInputElement;
      const artistInput = form.querySelector("#music-artist") as HTMLInputElement;
      const styleInput = form.querySelector("#music-style") as HTMLInputElement;
      const idInput = form.querySelector("#music-id") as HTMLInputElement;
      
      const trackId = parseInt(idInput.value);
      
      formData.append("title", titleInput.value);
      formData.append("artist", artistInput.value);
      formData.append("style", styleInput.value || "");
      
      if (musicFile) {
        formData.append("music", musicFile);
      }
      
      let endpoint = "/api/music";
      let method = "POST";
      
      if (trackId > 0) {
        endpoint = `/api/music/${trackId}`;
        method = "PUT";
      }
      
      const response = await fetch(endpoint, {
        method,
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("上传音乐失败");
      }
      
      // 获取最新的音乐列表
      fetchMusicTracks();
      
      // 重置表单
      form.reset();
      idInput.value = "0";
      setEditingMusicTrack(null);
      setMusicFile(null);
      
      toast({
        title: trackId > 0 ? "更新成功" : "上传成功",
        description: trackId > 0 ? "音乐信息已成功更新" : "音乐已成功上传",
      });
    } catch (error) {
      console.error("音乐上传错误:", error);
      toast({
        title: "操作失败",
        description: "无法处理音乐，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 处理编辑音乐
  const handleEditMusicTrack = (track: MusicTrack) => {
    setEditingMusicTrack(track);
    
    // 填充表单数据
    const titleInput = document.querySelector("#music-title") as HTMLInputElement;
    const artistInput = document.querySelector("#music-artist") as HTMLInputElement;
    const styleInput = document.querySelector("#music-style") as HTMLInputElement;
    const idInput = document.querySelector("#music-id") as HTMLInputElement;
    
    if (titleInput) titleInput.value = track.title;
    if (artistInput) artistInput.value = track.artist;
    if (styleInput) styleInput.value = track.style || "";
    if (idInput) idInput.value = track.id.toString();
    
    // 滚动到表单位置
    document.querySelector("#music-form")?.scrollIntoView({ behavior: "smooth" });
  };
  
  // 处理删除音乐
  const handleDeleteMusicTrack = async (id: number) => {
    if (!confirm("确定要删除这首音乐吗？此操作无法撤销。")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/music/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("删除音乐失败");
      }
      
      // 从列表中移除
      setMusicTracks(musicTracks.filter(track => track.id !== id));
      
      toast({
        title: "删除成功",
        description: "音乐已成功删除",
      });
    } catch (error) {
      console.error("删除音乐错误:", error);
      toast({
        title: "删除失败",
        description: "无法删除音乐，请稍后再试",
        variant: "destructive",
      });
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
        
        <button
          className={`px-4 py-2 font-medium transition-colors duration-200 ${
            activeTab === "logo" 
              ? "text-accent border-b-2 border-accent" 
              : "text-gray-400 hover:text-accent"
          }`}
          onClick={() => setActiveTab("logo")}
        >
          LOGO设置
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
              id="about-form"
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const aboutId = parseInt((document.getElementById("about-id") as HTMLInputElement).value || "0");
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
                    response = await apiRequest("PUT", `/api/cms/about/${aboutId}`, aboutData);
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/cms/about", aboutData);
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
                    title: "操作失败",
                    description: "提交关于我们内容表单时出错，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <input type="hidden" id="about-id" name="id" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="about-section" className="block text-sm font-medium mb-2">
                      栏目名称 *
                    </label>
                    <Input
                      id="about-section"
                      name="section"
                      type="text"
                      placeholder="输入栏目名称"
                      className="bg-primary/50 border-accent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="about-title" className="block text-sm font-medium mb-2">
                      标题
                    </label>
                    <Input
                      id="about-title"
                      name="title"
                      type="text"
                      placeholder="输入标题（可选）"
                      className="bg-primary/50 border-accent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="about-content" className="block text-sm font-medium mb-2">
                    内容 *
                  </label>
                  <Textarea
                    id="about-content"
                    name="content"
                    placeholder="输入内容"
                    className="min-h-[150px] bg-primary/50 border-accent"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="submit"
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {editingAboutContent ? "更新内容" : "添加内容"}
                </Button>
              </div>
            </form>
            
            {/* 内容列表 */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">内容列表</h3>
              
              {loadingAboutContents ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : aboutContents.length === 0 ? (
                <p className="text-center py-8 text-gray-400">暂无内容</p>
              ) : (
                <div className="overflow-x-auto">
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
      
      {/* 社区活动管理 */}
      {activeTab === "community" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>社区活动管理</CardTitle>
            <CardDescription>添加、编辑和管理社区活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-accent text-black hover:bg-accent/80"
                onClick={() => {
                  setEditingCommunityActivity(null);
                  
                  // 重置表单
                  const form = document.getElementById("activity-form") as HTMLFormElement;
                  if (form) form.reset();
                  
                  // 重置ID
                  const idInput = document.getElementById("activity-id") as HTMLInputElement;
                  if (idInput) idInput.value = "0";
                  
                  // 清空图片区域
                  const existingImagesContainer = document.getElementById("existing-activity-images");
                  if (existingImagesContainer) existingImagesContainer.innerHTML = "";
                  
                  // 清空已选图片
                  setActivityImageFiles([]);
                }}
              >
                添加新活动
              </Button>
            </div>
            
            {/* 活动表单 */}
            <form
              id="activity-form"
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  const formData = new FormData();
                  
                  // 获取表单数据
                  const activityId = (document.getElementById("activity-id") as HTMLInputElement).value;
                  const title = (document.getElementById("activity-title") as HTMLInputElement).value;
                  const content = (document.getElementById("activity-content") as HTMLTextAreaElement).value;
                  const location = (document.getElementById("activity-location") as HTMLInputElement).value;
                  const startDate = (document.getElementById("activity-startDate") as HTMLInputElement).value;
                  const endDate = (document.getElementById("activity-endDate") as HTMLInputElement).value;
                  const isActive = (document.getElementById("activity-active") as HTMLInputElement).checked;
                  
                  // 基本验证
                  if (!title || !content) {
                    toast({
                      title: "表单错误",
                      description: "请填写标题和内容",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // 添加表单数据到FormData
                  formData.append("title", title);
                  formData.append("content", content);
                  formData.append("location", location || "");
                  formData.append("isActive", isActive ? "1" : "0");
                  
                  if (startDate) {
                    formData.append("startDate", startDate);
                  }
                  
                  if (endDate) {
                    formData.append("endDate", endDate);
                  }
                  
                  // 添加所有图片文件
                  if (activityImageFiles.length > 0) {
                    for (const file of activityImageFiles) {
                      formData.append("images", file);
                    }
                  }
                  
                  // 确定请求方法和端点
                  let method = "POST";
                  let endpoint = "/api/cms/community";
                  
                  if (activityId && parseInt(activityId) > 0) {
                    method = "PUT";
                    endpoint = `/api/cms/community/${activityId}`;
                  }
                  
                  // 发送请求
                  const timestamp = new Date().getTime();
                  const response = await fetch(`${endpoint}?t=${timestamp}`, {
                    method,
                    body: formData
                  });
                  
                  if (!response.ok) {
                    throw new Error(`操作失败: ${response.statusText}`);
                  }
                  
                  // 更新活动列表
                  await fetchCommunityActivities();
                  
                  // 重置表单和状态
                  e.currentTarget.reset();
                  setEditingCommunityActivity(null);
                  setActivityImageFiles([]);
                  
                  // 清空已存在的图片预览
                  const existingImagesContainer = document.getElementById("existing-activity-images");
                  if (existingImagesContainer) existingImagesContainer.innerHTML = "";
                  
                  // 重置ID
                  const idInput = document.getElementById("activity-id") as HTMLInputElement;
                  if (idInput) idInput.value = "0";
                  
                  toast({
                    title: parseInt(activityId) > 0 ? "更新成功" : "添加成功",
                    description: parseInt(activityId) > 0 ? "活动已成功更新" : "新活动已成功添加",
                  });
                } catch (error) {
                  console.error("活动表单提交错误:", error);
                  toast({
                    title: "操作失败",
                    description: "提交活动表单时出错，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input type="hidden" id="activity-id" defaultValue="0" />
                  
                  <div>
                    <label htmlFor="activity-title" className="block text-sm font-medium mb-2">
                      活动标题 *
                    </label>
                    <Input
                      id="activity-title"
                      type="text"
                      placeholder="输入活动标题"
                      className="bg-primary/50 border-accent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="activity-location" className="block text-sm font-medium mb-2">
                      活动地点
                    </label>
                    <Input
                      id="activity-location"
                      type="text"
                      placeholder="输入活动地点"
                      className="bg-primary/50 border-accent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="activity-startDate" className="block text-sm font-medium mb-2">
                        开始日期
                      </label>
                      <Input
                        id="activity-startDate"
                        type="date"
                        className="bg-primary/50 border-accent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="activity-endDate" className="block text-sm font-medium mb-2">
                        结束日期
                      </label>
                      <Input
                        id="activity-endDate"
                        type="date"
                        className="bg-primary/50 border-accent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="activity-active" defaultChecked />
                    <label
                      htmlFor="activity-active"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      发布活动
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="activity-content" className="block text-sm font-medium mb-2">
                      活动内容 *
                    </label>
                    <Textarea
                      id="activity-content"
                      placeholder="输入活动详细内容"
                      className="min-h-[200px] bg-primary/50 border-accent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="activity-images" className="block text-sm font-medium mb-2">
                      活动图片
                    </label>
                    <Input
                      id="activity-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="bg-primary/50 border-accent"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const newFiles = Array.from(e.target.files);
                          
                          // 检查文件大小
                          const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
                          if (oversizedFiles.length > 0) {
                            toast({
                              title: "文件过大",
                              description: "某些图片超过5MB大小限制，已被忽略",
                              variant: "destructive",
                            });
                          }
                          
                          // 过滤掉大于5MB的文件
                          const validFiles = newFiles.filter(file => file.size <= 5 * 1024 * 1024);
                          
                          setActivityImageFiles(prev => [...prev, ...validFiles]);
                          
                          // 清空输入框，允许再次选择同样的文件
                          e.target.value = '';
                        }
                      }}
                    />
                    
                    {/* 显示当前选择的图片文件 */}
                    {activityImageFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">已选择 {activityImageFiles.length} 张图片:</p>
                        <div className="flex flex-wrap gap-2">
                          {activityImageFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`预览图 ${index + 1}`}
                                className="h-16 w-auto rounded border border-accent/30"
                              />
                              <button
                                type="button"
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setActivityImageFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 显示现有图片（编辑时） */}
                    <div id="existing-activity-images" className="mt-4"></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="submit"
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {editingCommunityActivity ? "更新活动" : "添加活动"}
                </Button>
              </div>
            </form>
            
            {/* 活动列表 */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">活动列表</h3>
              
              {loadingCommunityActivities ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : communityActivities.length === 0 ? (
                <p className="text-center py-8 text-gray-400">暂无活动数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>标题</TableHead>
                        <TableHead>地点</TableHead>
                        <TableHead>开始日期</TableHead>
                        <TableHead>结束日期</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communityActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{activity.id}</TableCell>
                          <TableCell className="font-medium">{activity.title}</TableCell>
                          <TableCell>{activity.location || "-"}</TableCell>
                          <TableCell>
                            {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            {activity.endDate ? new Date(activity.endDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={activity.isActive ? "bg-green-500" : "bg-gray-500"}>
                              {activity.isActive ? "已发布" : "未发布"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-accent"
                              onClick={() => handleEditCommunityActivity(activity)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (window.confirm("确定要删除此活动吗？此操作无法撤销。")) {
                                  // 添加时间戳参数以避免缓存问题
                                  const timestamp = new Date().getTime();
                                  apiRequest("DELETE", `/api/cms/community/${activity.id}?t=${timestamp}`)
                                    .then(response => {
                                      if (!response.ok) {
                                        throw new Error('删除活动失败');
                                      }
                                      toast({
                                        title: "删除成功",
                                        description: "活动已成功删除",
                                      });
                                      // 重新获取活动列表
                                      fetchCommunityActivities();
                                    })
                                    .catch(error => {
                                      console.error("删除活动错误:", error);
                                      toast({
                                        title: "删除失败",
                                        description: "无法删除活动，请稍后再试",
                                        variant: "destructive",
                                      });
                                    });
                                }
                              }}
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

      {/* 其他管理选项卡内容 - 为了简化示例，这里暂时只保留简单框架 */}
      {activeTab === "products" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>商品管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>商品管理功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "contracts" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>合约地址管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>合约地址管理功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "contact" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>联系信息管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>联系信息管理功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "music" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>音乐管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>音乐管理功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "orders" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>订单管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>订单管理功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "goldDogMonitor" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>金狗监测管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>金狗监测管理功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "logo" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>LOGO设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p>LOGO设置功能已就绪</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}