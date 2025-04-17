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
import { X, ImageIcon, ExternalLink, PlayCircle, TrashIcon, Pencil } from "lucide-react";

// 定义类型
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stonks_price: number;
  inventory: number;
  is_active: boolean;
  image_urls?: string[];
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
  // style字段在数据库中不存在，已从接口中移除
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
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFilesObjects, setSelectedFilesObjects] = useState<File[]>([]);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  
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
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [editingMusic, setEditingMusic] = useState<MusicTrack | null>(null);
  
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
    setLoadingMusic(true);
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
      setLoadingMusic(false);
    }
  };
  
  // 处理编辑音乐
  const handleEditMusic = (track: MusicTrack) => {
    setEditingMusic(track);
    
    // 填充表单
    const idInput = document.getElementById("music-id") as HTMLInputElement;
    if (idInput) idInput.value = track.id.toString();
    
    const titleInput = document.getElementById("music-title") as HTMLInputElement;
    if (titleInput) titleInput.value = track.title;
    
    const artistInput = document.getElementById("music-artist") as HTMLInputElement;
    if (artistInput) artistInput.value = track.artist;
    
    // style字段不存在于数据库中，已移除
    // const styleInput = document.getElementById("music-style") as HTMLInputElement;
    // if (styleInput) styleInput.value = track.style || "";
    
    const urlInput = document.getElementById("music-url") as HTMLInputElement;
    if (urlInput) urlInput.value = track.url;
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("music-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑音乐",
      description: `正在编辑: ${track.title}`,
    });
  };
  
  // 处理删除音乐
  const handleDeleteMusic = async (trackId: number) => {
    if (window.confirm("确定要删除此音乐吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/music/${trackId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除音乐失败');
        }
        
        toast({
          title: "删除成功",
          description: "音乐已成功删除",
        });
        
        // 重新获取音乐列表以更新UI
        await fetchMusicTracks();
      } catch (error) {
        console.error("删除音乐时出错:", error);
        toast({
          title: "删除失败",
          description: "无法删除音乐，请稍后再试",
          variant: "destructive",
        });
      }
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
  
  // 处理编辑商品
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    
    // 重置文件输入框，但不要直接清空状态
    const fileInput = document.getElementById("product-images") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    // 清空已选图片
    setProductImageFiles([]);
    
    // 填充表单
    const idInput = document.getElementById("product-id") as HTMLInputElement;
    if (idInput) idInput.value = product.id.toString();
    
    const nameInput = document.getElementById("product-name") as HTMLInputElement;
    if (nameInput) nameInput.value = product.name;
    
    const descriptionInput = document.getElementById("product-description") as HTMLTextAreaElement;
    if (descriptionInput) descriptionInput.value = product.description || "";
    
    const priceInput = document.getElementById("product-price") as HTMLInputElement;
    if (priceInput) priceInput.value = product.price.toString();
    
    const stonksPriceInput = document.getElementById("product-stonks-price") as HTMLInputElement;
    if (stonksPriceInput) stonksPriceInput.value = product.stonks_price.toString();
    
    const inventoryInput = document.getElementById("product-inventory") as HTMLInputElement;
    if (inventoryInput) inventoryInput.value = product.inventory.toString();
    
    const activeCheckbox = document.getElementById("product-active") as HTMLInputElement;
    if (activeCheckbox) activeCheckbox.checked = product.is_active;
    
    // 滚动到表单
    window.scrollTo({ top: document.getElementById("product-form")?.offsetTop || 0, behavior: "smooth" });
    
    toast({
      title: "编辑商品",
      description: `正在编辑: ${product.name}`,
    });
  };
  
  // 处理删除商品
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("确定要删除此商品吗？此操作无法撤销。")) {
      try {
        // 添加时间戳参数以避免缓存问题
        const timestamp = new Date().getTime();
        const response = await apiRequest("DELETE", `/api/cms/products/${productId}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('删除商品失败');
        }
        
        toast({
          title: "删除成功",
          description: "商品已成功删除",
        });
        
        // 重新获取商品列表以更新UI
        await fetchProducts();
      } catch (error) {
        console.error("删除商品错误:", error);
        toast({
          title: "删除失败",
          description: "无法删除商品，请稍后再试",
          variant: "destructive",
        });
      }
    }
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
        <Button onClick={() => navigate("/admin-stonks-dex-secret-login")}>前往登录</Button>
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
              navigate("/");
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

      {/* 商品管理 */}
      {activeTab === "products" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>商品管理</CardTitle>
            <CardDescription>添加、编辑和管理商品信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-accent text-black hover:bg-accent/80"
                onClick={() => {
                  setEditingProduct(null);
                  // 重置表单
                  const form = document.getElementById("product-form") as HTMLFormElement;
                  if (form) form.reset();
                  // 重置ID
                  const idInput = document.getElementById("product-id") as HTMLInputElement;
                  if (idInput) idInput.value = "0";
                  // 清空已选图片
                  setProductImageFiles([]);
                }}
              >
                添加新商品
              </Button>
            </div>
            
            {/* 商品表单 */}
            <form
              id="product-form"
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  const formData = new FormData();
                  
                  // 获取表单数据
                  const productId = (document.getElementById("product-id") as HTMLInputElement).value;
                  const name = (document.getElementById("product-name") as HTMLInputElement).value;
                  const description = (document.getElementById("product-description") as HTMLTextAreaElement).value;
                  const price = (document.getElementById("product-price") as HTMLInputElement).value;
                  const stonksPrice = (document.getElementById("product-stonks-price") as HTMLInputElement).value;
                  const inventory = (document.getElementById("product-inventory") as HTMLInputElement).value;
                  const active = (document.getElementById("product-active") as HTMLInputElement).checked;
                  
                  // 基本验证
                  if (!name || !price || !stonksPrice) {
                    toast({
                      title: "表单错误",
                      description: "请填写商品名称、价格和STONKS价格",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // 添加表单数据到FormData
                  formData.append("name", name);
                  formData.append("description", description || "");
                  formData.append("price", price);
                  formData.append("stonksPrice", stonksPrice);
                  formData.append("inventory", inventory || "999");
                  formData.append("isActive", active ? "1" : "0");
                  
                  // 添加所有图片文件
                  if (productImageFiles.length > 0) {
                    for (const file of productImageFiles) {
                      formData.append("images", file);
                    }
                  }
                  
                  // 确定请求方法和端点
                  let method = "POST";
                  let endpoint = "/api/cms/products";
                  
                  if (productId && parseInt(productId) > 0) {
                    method = "PUT";
                    endpoint = `/api/cms/products/${productId}`;
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
                  
                  // 更新产品列表
                  await fetchProducts();
                  
                  // 重置表单和状态
                  e.currentTarget.reset();
                  setEditingProduct(null);
                  setProductImageFiles([]);
                  
                  toast({
                    title: parseInt(productId) > 0 ? "更新成功" : "添加成功",
                    description: parseInt(productId) > 0 ? "商品已成功更新" : "商品已成功添加",
                  });
                } catch (error) {
                  console.error("提交商品表单错误:", error);
                  toast({
                    title: "操作失败",
                    description: "提交商品表单时出错，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <input type="hidden" id="product-id" name="id" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="product-name" className="block text-sm font-medium mb-2">
                      商品名称 *
                    </label>
                    <Input
                      id="product-name"
                      name="name"
                      type="text"
                      placeholder="输入商品名称"
                      className="bg-primary/50 border-accent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-price" className="block text-sm font-medium mb-2">
                        价格 (USDT) *
                      </label>
                      <Input
                        id="product-price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="USDT价格"
                        className="bg-primary/50 border-accent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="product-stonks-price" className="block text-sm font-medium mb-2">
                        价格 (STONKS) *
                      </label>
                      <Input
                        id="product-stonks-price"
                        name="stonksPrice"
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="STONKS价格"
                        className="bg-primary/50 border-accent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="product-inventory" className="block text-sm font-medium mb-2">
                      库存数量
                    </label>
                    <Input
                      id="product-inventory"
                      name="inventory"
                      type="number"
                      min="0"
                      placeholder="库存数量"
                      className="bg-primary/50 border-accent"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="product-active" name="active" defaultChecked />
                    <label
                      htmlFor="product-active"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      上架商品（对外显示）
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="product-description" className="block text-sm font-medium mb-2">
                      商品描述
                    </label>
                    <Textarea
                      id="product-description"
                      name="description"
                      placeholder="输入商品描述"
                      className="min-h-[150px] bg-primary/50 border-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      商品图片
                    </label>
                    <div className="border-2 border-dashed border-accent/40 rounded-lg p-4 bg-primary/30">
                      <Input
                        id="product-images"
                        name="images"
                        type="file"
                        className="mb-2"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const filesArray = Array.from(files);
                            setProductImageFiles(prev => [...prev, ...filesArray]);
                          }
                        }}
                      />
                      
                      {/* 预览已选择的图片 */}
                      {productImageFiles.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {productImageFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`预览 ${index + 1}`}
                                className="w-full h-24 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setProductImageFiles(files => files.filter((_, i) => i !== index));
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 显示已有图片 */}
                      {editingProduct && editingProduct.image_urls && editingProduct.image_urls.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">已有图片:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {editingProduct.image_urls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`产品图片 ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-md"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="submit"
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {editingProduct ? "更新商品" : "添加商品"}
                </Button>
              </div>
            </form>
            
            {/* 商品列表 */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">商品列表</h3>
              
              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : products.length === 0 ? (
                <p className="text-center py-8 text-gray-400">暂无商品</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">图片</TableHead>
                        <TableHead>商品名称</TableHead>
                        <TableHead>价格(USDT)</TableHead>
                        <TableHead>价格(STONKS)</TableHead>
                        <TableHead>库存</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_urls && product.image_urls.length > 0 ? (
                              <img
                                src={product.image_urls[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-800 rounded-md flex items-center justify-center">
                                <ImageIcon size={16} className="text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>${product.price !== undefined ? Number(product.price).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>⊙ {product.stonks_price !== undefined ? Number(product.stonks_price).toFixed(6) : '0.000000'}</TableCell>
                          <TableCell>{product.inventory}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "上架中" : "已下架"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-accent"
                              onClick={() => handleEditProduct(product)}
                            >
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product.id)}
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

      {activeTab === "contracts" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>合约地址管理</CardTitle>
            <CardDescription>添加和管理STONKS代币合约地址</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-accent text-black hover:bg-accent/80"
                onClick={() => {
                  setEditingAddress(null);
                  // 重置表单
                  const form = document.getElementById("address-form") as HTMLFormElement;
                  if (form) form.reset();
                  // 重置ID
                  const idInput = document.getElementById("address-id") as HTMLInputElement;
                  if (idInput) idInput.value = "0";
                }}
              >
                添加新合约地址
              </Button>
            </div>
            
            {/* 合约地址表单 */}
            <form
              id="address-form"
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  // 获取表单数据
                  const addressId = parseInt((document.getElementById("address-id") as HTMLInputElement).value);
                  const network = (document.getElementById("address-network") as HTMLInputElement).value;
                  const address = (document.getElementById("address-contract") as HTMLInputElement).value;
                  const coinType = (document.getElementById("address-coin") as HTMLInputElement).value;
                  
                  // 基本验证
                  if (!network || !address || !coinType) {
                    toast({
                      title: "表单不完整",
                      description: "请填写所有必填字段",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // 准备数据
                  const contractData = {
                    id: addressId || undefined,
                    network,
                    address,
                    coinType
                  };
                  
                  // 确定API端点和方法
                  const method = addressId > 0 ? "PUT" : "POST";
                  const endpoint = addressId > 0 
                    ? `/api/contract-addresses/${addressId}` 
                    : "/api/contract-addresses";
                  
                  // 发送请求
                  const response = await apiRequest(method, endpoint, contractData);
                  
                  if (!response.ok) {
                    throw new Error("保存失败");
                  }
                  
                  // 获取最新的合约地址列表
                  fetchContractAddresses();
                  
                  // 重置表单
                  (e.target as HTMLFormElement).reset();
                  (document.getElementById("address-id") as HTMLInputElement).value = "0";
                  setEditingAddress(null);
                  
                  toast({
                    title: addressId > 0 ? "更新成功" : "添加成功",
                    description: addressId > 0 
                      ? `合约地址 ${network} - ${coinType} 已更新` 
                      : `新合约地址 ${network} - ${coinType} 已添加`,
                  });
                } catch (error) {
                  console.error("保存合约地址错误:", error);
                  toast({
                    title: "操作失败",
                    description: "无法保存合约地址，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <input type="hidden" id="address-id" name="id" value="0" />
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="address-network" className="block text-sm font-medium mb-2">
                      区块链网络 *
                    </label>
                    <Input
                      id="address-network"
                      name="network"
                      placeholder="如: Ethereum, Solana, BSC"
                      className="bg-primary/50 border-accent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address-coin" className="block text-sm font-medium mb-2">
                      代币符号 *
                    </label>
                    <Input
                      id="address-coin"
                      name="coinType"
                      placeholder="如: STONKS, USDT"
                      className="bg-primary/50 border-accent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="address-contract" className="block text-sm font-medium mb-2">
                    合约地址 *
                  </label>
                  <Input
                    id="address-contract"
                    name="address"
                    placeholder="输入完整的合约地址"
                    className="bg-primary/50 border-accent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    // 重置表单
                    const form = document.getElementById("address-form") as HTMLFormElement;
                    if (form) form.reset();
                    // 重置ID
                    const idInput = document.getElementById("address-id") as HTMLInputElement;
                    if (idInput) idInput.value = "0";
                    setEditingAddress(null);
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {editingAddress ? "保存修改" : "添加地址"}
                </Button>
              </div>
            </form>
            
            {/* 合约地址列表 */}
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-4">当前合约地址列表</h3>
              
              {loadingAddresses ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : contractAddresses.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-accent/30 rounded-md">
                  <p className="text-gray-400">暂无合约地址记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>区块链网络</TableHead>
                        <TableHead>代币符号</TableHead>
                        <TableHead>合约地址</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractAddresses.map((address) => (
                        <TableRow key={address.id}>
                          <TableCell>{address.network}</TableCell>
                          <TableCell>{address.coinType}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center">
                              <span className="truncate max-w-[200px]">{address.address}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-1" 
                                onClick={() => {
                                  navigator.clipboard.writeText(address.address);
                                  toast({
                                    title: "已复制",
                                    description: "合约地址已复制到剪贴板"
                                  });
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 4h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path>
                                  <path d="M8 14h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"></path>
                                  <path d="M10 14V8a2 2 0 0 1 2-2h2"></path>
                                </svg>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                  window.open(`https://${address.network.toLowerCase() === 'ethereum' ? 'etherscan.io' : 
                                    address.network.toLowerCase() === 'solana' ? 'solscan.io' : 
                                    address.network.toLowerCase() === 'bsc' ? 'bscscan.com' : 
                                    'explorer.solana.com'}/address/${address.address}`, '_blank' as any);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-accent" 
                                onClick={() => handleEditAddress(address)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500" 
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
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
            <CardDescription>添加和管理音乐曲目</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 添加音乐按钮 */}
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-accent text-black hover:bg-accent/80"
                onClick={() => {
                  setEditingMusic(null);
                  // 重置表单
                  const form = document.getElementById("music-form") as HTMLFormElement;
                  if (form) form.reset();
                  // 重置ID
                  const idInput = document.getElementById("music-id") as HTMLInputElement;
                  if (idInput) idInput.value = "0";
                }}
              >
                添加新音乐
              </Button>
            </div>
            
            {/* 音乐表单 */}
            <form
              id="music-form"
              className="mb-8 border-b border-accent/30 pb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  // 获取表单数据
                  const musicId = parseInt((document.getElementById("music-id") as HTMLInputElement).value);
                  const title = (document.getElementById("music-title") as HTMLInputElement).value;
                  const artist = (document.getElementById("music-artist") as HTMLInputElement).value;
                  const style = (document.getElementById("music-style") as HTMLInputElement).value;
                  const url = (document.getElementById("music-url") as HTMLInputElement).value;
                  const filename = url.split('/').pop() || `music-${Date.now()}.mp3`;
                  
                  // 基本验证
                  if (!title || !artist || !url) {
                    toast({
                      title: "表单不完整",
                      description: "请填写所有必填字段",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // 准备数据
                  const musicData = {
                    id: musicId || undefined,
                    title,
                    artist,
                    style,
                    url,
                    filename,
                    isPublic: 1, // 默认公开
                    duration: 0, // 持续时间将在服务器端处理
                  };
                  
                  // 确定API端点和方法
                  const method = musicId > 0 ? "PUT" : "POST";
                  const endpoint = musicId > 0 
                    ? `/api/music/${musicId}` 
                    : "/api/music";
                  
                  // 发送请求
                  const response = await apiRequest(method, endpoint, musicData);
                  
                  if (!response.ok) {
                    throw new Error("保存失败");
                  }
                  
                  // 获取最新的音乐列表
                  fetchMusicTracks();
                  
                  // 重置表单
                  (e.target as HTMLFormElement).reset();
                  (document.getElementById("music-id") as HTMLInputElement).value = "0";
                  setEditingMusic(null);
                  
                  toast({
                    title: musicId > 0 ? "更新成功" : "添加成功",
                    description: musicId > 0 
                      ? `音乐 ${title} 已更新` 
                      : `新音乐 ${title} 已添加`,
                  });
                } catch (error) {
                  console.error("保存音乐曲目错误:", error);
                  toast({
                    title: "操作失败",
                    description: "无法保存音乐曲目，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <input type="hidden" id="music-id" name="id" value="0" />
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="music-title" className="block text-sm font-medium mb-2">
                      音乐标题 *
                    </label>
                    <Input
                      id="music-title"
                      name="title"
                      placeholder="输入音乐标题"
                      className="bg-primary/50 border-accent"
                      required
                      defaultValue={editingMusic?.title || ""}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="music-artist" className="block text-sm font-medium mb-2">
                      艺术家 *
                    </label>
                    <Input
                      id="music-artist"
                      name="artist"
                      placeholder="输入艺术家名称"
                      className="bg-primary/50 border-accent"
                      required
                      defaultValue={editingMusic?.artist || ""}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="music-style" className="block text-sm font-medium mb-2">
                    音乐风格
                  </label>
                  <Input
                    id="music-style"
                    name="style"
                    placeholder="如: Rock, Electronic, Classical等"
                    className="bg-primary/50 border-accent"
                    defaultValue={editingMusic?.style || ""}
                  />
                </div>
                
                <div>
                  <label htmlFor="music-url" className="block text-sm font-medium mb-2">
                    音乐URL *
                  </label>
                  <Input
                    id="music-url"
                    name="url"
                    placeholder="输入音乐文件URL"
                    className="bg-primary/50 border-accent"
                    required
                    defaultValue={editingMusic?.url || ""}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    // 重置表单
                    const form = document.getElementById("music-form") as HTMLFormElement;
                    if (form) form.reset();
                    // 重置ID
                    const idInput = document.getElementById("music-id") as HTMLInputElement;
                    if (idInput) idInput.value = "0";
                    setEditingMusic(null);
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {editingMusic ? "保存修改" : "添加音乐"}
                </Button>
              </div>
            </form>
            
            {/* 音乐列表 */}
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-4">当前音乐列表</h3>
              
              {loadingMusic ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : musicTracks.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-accent/30 rounded-md">
                  <p className="text-gray-400">暂无音乐曲目记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>标题</TableHead>
                        <TableHead>艺术家</TableHead>
                        <TableHead>风格</TableHead>
                        <TableHead>试听</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {musicTracks.map((track) => (
                        <TableRow key={track.id}>
                          <TableCell>{track.id}</TableCell>
                          <TableCell className="font-medium">{track.title}</TableCell>
                          <TableCell>{track.artist}</TableCell>
                          <TableCell>{track.style || "-"}</TableCell>
                          <TableCell>
                            <audio controls className="w-48 h-10">
                              <source src={track.url} type="audio/mpeg" />
                              您的浏览器不支持音频播放
                            </audio>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-accent" 
                                onClick={() => handleEditMusic(track)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500" 
                                onClick={() => handleDeleteMusic(track.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
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