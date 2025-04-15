import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Pencil, Trash2, Plus, Eye, MoreHorizontal, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

// 金狗监测类型定义
interface GoldDogMonitor {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  coinName: string | null;
  network: string | null;
  contractAddress: string | null;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// 表单验证模式
const monitorFormSchema = z.object({
  title: z.string().min(2, { message: '标题不能少于2个字符' }).max(100, { message: '标题不能超过100个字符' }),
  content: z.string().min(10, { message: '内容不能少于10个字符' }),
  coinName: z.string().nullable().optional(),
  network: z.string().nullable().optional(),
  contractAddress: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
});

type MonitorFormValues = z.infer<typeof monitorFormSchema>;

export default function ManageGoldDogMonitor() {
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // 对话框状态管理
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<GoldDogMonitor | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 获取所有金狗监测记录（包括未发布的）
  const { data: monitors, isLoading, error } = useQuery<GoldDogMonitor[]>({
    queryKey: ['/api/gold-dog-monitors', { publishedOnly: false }],
    queryFn: async () => {
      // 添加一个时间戳参数来避免缓存
      const timestamp = new Date().getTime();
      const res = await apiRequest('GET', `/api/gold-dog-monitors?publishedOnly=false&t=${timestamp}`);
      return res.json();
    },
  });
  
  // 创建表单
  const createForm = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    defaultValues: {
      title: '',
      content: '',
      coinName: '',
      network: '',
      contractAddress: '',
      isPublished: false,
    },
  });
  
  // 编辑表单
  const editForm = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    defaultValues: {
      title: '',
      content: '',
      coinName: '',
      network: '',
      contractAddress: '',
      isPublished: false,
    },
  });
  
  // 重置创建表单
  const resetCreateForm = () => {
    createForm.reset();
    setImageFile(null);
    setImagePreview(null);
  };
  
  // 设置编辑表单值
  useEffect(() => {
    if (selectedMonitor && isEditDialogOpen) {
      editForm.reset({
        title: selectedMonitor.title,
        content: selectedMonitor.content,
        coinName: selectedMonitor.coinName || '',
        network: selectedMonitor.network || '',
        contractAddress: selectedMonitor.contractAddress || '',
        isPublished: selectedMonitor.isPublished,
      });
      setImagePreview(selectedMonitor.imageUrl);
    }
  }, [selectedMonitor, isEditDialogOpen, editForm]);
  
  // 创建金狗监测
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest('POST', `/api/gold-dog-monitors?t=${timestamp}`, formData);
      
      // 先尝试获取响应数据，不管成功或失败
      const responseData = await response.json().catch(() => null);
      console.log("金狗监测API响应:", response.status, responseData);
      
      if (!response.ok) {
        throw new Error(responseData?.message || '创建失败，请重试');
      }
      
      return responseData; // 已经解析过的JSON响应
    },
    onSuccess: (data) => {
      console.log('金狗监测创建成功返回数据:', data);
      
      // 使用更新的invalidateQueries方法，并确保完全失效相关查询
      queryClient.invalidateQueries({ queryKey: ['/api/gold-dog-monitors'] });
      // 额外触发强制刷新
      queryClient.refetchQueries({ queryKey: ['/api/gold-dog-monitors'] });
      
      setIsCreateDialogOpen(false);
      resetCreateForm();
      
      toast({
        title: '创建成功',
        description: '金狗监测创建成功',
      });
    },
    onError: (error: any) => {
      console.error('创建金狗监测失败:', error);
      toast({
        title: '创建失败',
        description: error.message || '无法创建金狗监测，请重试',
        variant: 'destructive',
      });
    },
  });
  
  // 更新金狗监测
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest('PUT', `/api/gold-dog-monitors/${id}?t=${timestamp}`, formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新失败，请重试');
      }
      return response.json();
    },
    onSuccess: () => {
      // 使用更新的invalidateQueries方法，并确保完全失效相关查询
      queryClient.invalidateQueries({ queryKey: ['/api/gold-dog-monitors'] });
      // 额外触发强制刷新
      queryClient.refetchQueries({ queryKey: ['/api/gold-dog-monitors'] });
      
      toast({
        title: '更新成功',
        description: '金狗监测更新成功',
      });
      setIsEditDialogOpen(false);
      setSelectedMonitor(null);
    },
    onError: (error: any) => {
      console.error('更新金狗监测失败:', error);
      toast({
        title: '更新失败',
        description: error.message || '无法更新金狗监测，请重试',
        variant: 'destructive',
      });
    },
  });
  
  // 删除金狗监测
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // 添加时间戳参数以避免缓存问题
      const timestamp = new Date().getTime();
      const response = await apiRequest('DELETE', `/api/gold-dog-monitors/${id}?t=${timestamp}`);
      if (!response.ok) {
        throw new Error('删除失败，请重试');
      }
      return id;
    },
    onSuccess: () => {
      // 使用更新的invalidateQueries方法，并确保完全失效相关查询
      queryClient.invalidateQueries({ queryKey: ['/api/gold-dog-monitors'] });
      // 额外触发强制刷新
      queryClient.refetchQueries({ queryKey: ['/api/gold-dog-monitors'] });
      
      toast({
        title: '删除成功',
        description: '金狗监测已删除',
      });
      setIsDeleteAlertOpen(false);
      setSelectedMonitor(null);
    },
    onError: (error: any) => {
      console.error('删除金狗监测失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '无法删除金狗监测，请重试',
        variant: 'destructive',
      });
    },
  });
  
  // 处理图片更改
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: '文件类型错误',
          description: '请上传图片文件',
          variant: 'destructive',
        });
        return;
      }
      
      // 验证文件大小（5MB 限制）
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: '文件大小不能超过5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理创建表单提交
  const onCreateSubmit = (values: MonitorFormValues) => {
    console.log("开始创建金狗监测", values);
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('isPublished', values.isPublished.toString());
    
    if (values.coinName) formData.append('coinName', values.coinName);
    if (values.network) formData.append('network', values.network);
    if (values.contractAddress) formData.append('contractAddress', values.contractAddress);
    if (imageFile) formData.append('image', imageFile);
    
    // 添加时间戳字段，确保创建时间被正确设置
    formData.append('createdAt', new Date().toISOString());
    formData.append('updatedAt', new Date().toISOString());
    
    // 添加客户端时间戳，防止缓存问题
    formData.append('_timestamp', Date.now().toString());
    
    createMutation.mutate(formData);
  };
  
  // 处理编辑表单提交
  const onEditSubmit = (values: MonitorFormValues) => {
    if (!selectedMonitor) return;
    
    console.log("开始更新金狗监测", values);
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('isPublished', values.isPublished.toString());
    
    if (values.coinName) formData.append('coinName', values.coinName);
    if (values.network) formData.append('network', values.network);
    if (values.contractAddress) formData.append('contractAddress', values.contractAddress);
    if (imageFile) formData.append('image', imageFile);
    
    // 添加updatedAt时间戳
    formData.append('updatedAt', new Date().toISOString());
    
    // 添加客户端时间戳，防止缓存问题
    formData.append('_timestamp', Date.now().toString());
    
    updateMutation.mutate({ id: selectedMonitor.id, formData });
  };
  
  // 处理删除确认
  const handleDeleteConfirm = () => {
    if (!selectedMonitor) return;
    deleteMutation.mutate(selectedMonitor.id);
  };
  
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#00ffcc]">管理金狗监测</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80">
          <Plus className="mr-2 h-4 w-4" />
          添加监测
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !monitors || monitors.length === 0 ? (
        <Card className="bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">暂无金狗监测内容</p>
          <p className="text-sm text-muted-foreground mt-2">点击"添加监测"按钮创建内容</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {monitors.map((monitor) => (
            <Card key={monitor.id} className={`bg-card border-l-4 ${monitor.isPublished ? 'border-l-green-500' : 'border-l-amber-500'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{monitor.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1 gap-2">
                      <span>{formatDate(new Date(monitor.createdAt))}</span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {monitor.views}
                      </span>
                      {!monitor.isPublished && (
                        <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded">未发布</span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation(`/gold-dog-monitor/${monitor.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        查看
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedMonitor(monitor);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500 focus:text-red-500"
                        onClick={() => {
                          setSelectedMonitor(monitor);
                          setIsDeleteAlertOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {monitor.imageUrl ? (
                    <img 
                      src={monitor.imageUrl} 
                      alt={monitor.title}
                      className="w-20 h-20 object-cover rounded-md" 
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      无图片
                    </div>
                  )}
                  <div>
                    <p className="text-sm line-clamp-3">{monitor.content}</p>
                    {monitor.contractAddress && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">合约: </span>
                        <span className="font-mono">{monitor.contractAddress.substring(0, 20)}...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 创建金狗监测对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加金狗监测</DialogTitle>
            <DialogDescription>
              创建新的金狗监测内容，完成后点击保存。
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="输入监测标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 图片上传 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">图片</label>
                <div className="flex flex-col gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'create')}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <FormField
                control={createForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="输入监测内容" rows={8} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">合约信息（可选）</h3>
                
                <FormField
                  control={createForm.control}
                  name="coinName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代币名称</FormLabel>
                      <FormControl>
                        <Input placeholder="输入代币名称" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>网络</FormLabel>
                      <FormControl>
                        <Input placeholder="如 Ethereum、BSC、Solana 等" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>合约地址</FormLabel>
                      <FormControl>
                        <Input placeholder="输入合约地址" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">立即发布</FormLabel>
                      <FormDescription>
                        开启后内容将立即在网站上展示
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80"
                >
                  {createMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* 编辑金狗监测对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑金狗监测</DialogTitle>
            <DialogDescription>
              编辑金狗监测内容，完成后点击保存。
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="输入监测标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 图片上传 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">图片</label>
                <div className="flex flex-col gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'edit')}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(selectedMonitor?.imageUrl || null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="输入监测内容" rows={8} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">合约信息（可选）</h3>
                
                <FormField
                  control={editForm.control}
                  name="coinName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代币名称</FormLabel>
                      <FormControl>
                        <Input placeholder="输入代币名称" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>网络</FormLabel>
                      <FormControl>
                        <Input placeholder="如 Ethereum、BSC、Solana 等" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>合约地址</FormLabel>
                      <FormControl>
                        <Input placeholder="输入合约地址" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {field.value ? '已发布' : '未发布'}
                      </FormLabel>
                      <FormDescription>
                        {field.value 
                          ? '内容当前可在网站上查看' 
                          : '内容当前不会在网站上展示'}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedMonitor(null);
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80"
                >
                  {updateMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除"{selectedMonitor?.title}"吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}