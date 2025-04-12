import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { WebsiteContent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManageNew() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // 管理选项卡切换状态
  const [activeTab, setActiveTab] = useState<string>("website-content");
  
  // 通用状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // 网站内容管理状态
  const [websiteContents, setWebsiteContents] = useState<WebsiteContent[]>([]);
  const [loadingWebsiteContents, setLoadingWebsiteContents] = useState(false);
  const [editingContent, setEditingContent] = useState<WebsiteContent | null>(null);
  
  // 检查管理员身份验证
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      try {
        const response = await apiRequest("GET", "/api/check-admin-auth");
        if (response.ok) {
          setIsAuthenticated(true);
          fetchWebsiteContents();
        } else {
          toast({
            title: "需要管理员权限",
            description: "请先登录",
            variant: "destructive",
          });
          setLocation("/admin-stonks-dex-secret-login");
        }
      } catch (error) {
        toast({
          title: "检查权限失败",
          description: "无法验证管理员状态，请刷新页面重试",
          variant: "destructive",
        });
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [toast, setLocation]);

  // 获取网站内容列表
  const fetchWebsiteContents = async () => {
    setLoadingWebsiteContents(true);
    try {
      const timestamp = new Date().getTime();
      const response = await apiRequest("GET", `/api/website-contents?t=${timestamp}`);
      const contentData = await response.json();
      setWebsiteContents(contentData);
    } catch (error) {
      console.error("获取网站内容错误:", error);
      toast({
        title: "加载失败",
        description: "无法获取网站内容数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingWebsiteContents(false);
    }
  };

  // 如果正在检查权限，显示加载中
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 如果未通过身份验证，不显示任何内容（用户应该已经被重定向）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        <span className="bg-gradient-to-r from-accent to-violet-500 bg-clip-text text-transparent">
          STONKS DEX SHOP 管理控制台
        </span>
      </h1>
      
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={() => setActiveTab("website-content")}
            variant={activeTab === "website-content" ? "default" : "outline"}
            className={
              activeTab === "website-content"
                ? "bg-accent hover:bg-accent/80 text-black"
                : "border-accent text-accent hover:bg-accent hover:text-black"
            }
          >
            网站内容管理
          </Button>
        </div>
      </div>
      
      {activeTab === "website-content" && (
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>网站内容管理</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 网站内容表单 */}
            <form
              className="mb-8 border-b border-accent/30 pb-8"
              id="website-content-form"
              onSubmit={async (e) => {
                e.preventDefault();
                
                const contentId = document.getElementById("content-id")?.getAttribute("value");
                const key = (document.getElementById("content-key") as HTMLInputElement).value.trim();
                const value = (document.getElementById("content-value") as HTMLTextAreaElement).value.trim();
                
                // 获取Radix UI Select组件的选中值
                const typeElement = document.querySelector('[data-id="content-type"]');
                const languageElement = document.querySelector('[data-id="content-language"]');
                
                // 获取当前设置的data-value属性
                const type = typeElement?.getAttribute('data-value') || "text";
                const language = languageElement?.getAttribute('data-value') || "zh";
                const section = key.split('.')[0] || "other"; // 根据key提取section
                
                console.log("表单提交信息:", {
                  contentId: contentId || "新内容",
                  key,
                  valueLength: value.length,
                  type,
                  language,
                  section
                });
                
                if (!key || !value) {
                  toast({
                    title: "表单错误",
                    description: "内容标识符和内容文本都不能为空",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  let response;
                  
                  if (contentId) {
                    // 编辑模式
                    response = await apiRequest("PUT", `/api/website-contents/${contentId}`, {
                      key,
                      value,
                      type,
                      language,
                      section,
                      isActive: true
                    });
                  } else {
                    // 新增模式
                    response = await apiRequest("POST", "/api/website-contents", {
                      key,
                      value,
                      type,
                      language,
                      section,
                      isActive: true
                    });
                  }
                  
                  if (response.ok) {
                    // 重置表单
                    (document.getElementById("website-content-form") as HTMLFormElement).reset();
                    document.getElementById("content-id")?.removeAttribute("value");
                    setEditingContent(null);
                    
                    toast({
                      title: contentId ? "更新成功" : "添加成功",
                      description: contentId ? "网站内容已成功更新" : "新网站内容已成功添加",
                    });
                    
                    // 重新获取内容列表
                    await fetchWebsiteContents();
                  } else {
                    throw new Error(await response.text());
                  }
                } catch (error) {
                  console.error("保存网站内容错误:", error);
                  toast({
                    title: "保存失败",
                    description: "无法保存网站内容，请稍后再试",
                    variant: "destructive",
                  });
                }
              }}>
                <input type="hidden" id="content-id" />
                
                <div className="space-y-2">
                  <label htmlFor="content-key" className="block text-sm font-medium">
                    内容标识符
                  </label>
                  <Input
                    id="content-key"
                    placeholder="例如: footer.description, about.team.title, about.community.description"
                    className="bg-primary/50 border-accent"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    推荐的内容标识符格式：
                    <br />
                    - 关于我们/团队内容: <span className="text-accent">about.team.title</span> 和 <span className="text-accent">about.team.description</span>
                    <br />
                    - 社区内容: <span className="text-accent">about.community.title</span> 和 <span className="text-accent">about.community.description</span>
                    <br />
                    - 页脚公司描述: <span className="text-accent">footer.description</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="content-language" className="block text-sm font-medium">
                      内容语言
                    </label>
                    <Select 
                      value={editingContent?.language || "zh"}
                      onValueChange={(value) => {
                        // 更新data-value属性以便后续访问
                        const trigger = document.querySelector('[data-id="content-language"]');
                        if (trigger) {
                          trigger.setAttribute('data-value', value);
                        }
                        // 如果处于编辑模式，更新编辑中的内容
                        if (editingContent) {
                          setEditingContent({
                            ...editingContent,
                            language: value
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-primary/50 border-accent" data-id="content-language" data-value={editingContent?.language || "zh"}>
                        <SelectValue placeholder="选择语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="en">英文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="content-type" className="block text-sm font-medium">
                      内容类型
                    </label>
                    <Select 
                      value={editingContent?.type || "text"}
                      onValueChange={(value) => {
                        // 更新data-value属性以便后续访问
                        const trigger = document.querySelector('[data-id="content-type"]');
                        if (trigger) {
                          trigger.setAttribute('data-value', value);
                        }
                        // 如果处于编辑模式，更新编辑中的内容
                        if (editingContent) {
                          setEditingContent({
                            ...editingContent,
                            type: value
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-primary/50 border-accent" data-id="content-type" data-value={editingContent?.type || "text"}>
                        <SelectValue placeholder="选择内容类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">文本</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <label htmlFor="content-value" className="block text-sm font-medium">
                    内容文本
                  </label>
                  <Textarea
                    id="content-value"
                    placeholder="输入网站内容文本"
                    className="bg-primary/50 border-accent min-h-[150px]"
                    required
                  />
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Button type="submit" className="bg-accent hover:bg-accent/80 text-black">
                    {editingContent ? "更新内容" : "保存内容"}
                  </Button>
                  
                  {editingContent && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        document.getElementById("content-id")?.removeAttribute("value");
                        (document.getElementById("website-content-form") as HTMLFormElement).reset();
                        setEditingContent(null);
                        toast({
                          title: "已取消编辑",
                          description: "已退出编辑模式",
                        });
                      }}
                    >
                      取消编辑
                    </Button>
                  )}
                </div>
              </form>
              
              <div className="mt-8 border-t border-accent/30 pt-6">
                <h3 className="text-lg font-medium mb-4">现有网站内容</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>内容标识符</TableHead>
                        <TableHead>内容文本</TableHead>
                        <TableHead className="w-[120px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingWebsiteContents ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <div className="flex justify-center">
                              <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : websiteContents.length > 0 ? (
                        websiteContents.map((content) => (
                          <TableRow key={content.id}>
                            <TableCell className="font-medium">{content.key}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="max-h-20 overflow-y-auto">
                                {content.value}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 border-accent text-accent hover:bg-accent hover:text-black"
                                  onClick={() => {
                                    // 设置编辑的内容
                                    setEditingContent(content);
                                    // 将内容填充到表单中
                                    document.getElementById("content-id")?.setAttribute("value", content.id.toString());
                                    (document.getElementById("content-key") as HTMLInputElement).value = content.key;
                                    (document.getElementById("content-value") as HTMLTextAreaElement).value = content.value;
                                    
                                    // 设置语言和类型选择器
                                    try {
                                      // 设置语言和类型
                                      console.log("编辑选择器初始化:", {
                                        contentId: content.id,
                                        language: content.language || 'zh',
                                        type: content.type || 'text'
                                      });
                                      
                                      // 设置语言
                                      const languageTrigger = document.querySelector('[data-id="content-language"]');
                                      if (languageTrigger) {
                                        // 设置data-value属性
                                        languageTrigger.setAttribute('data-value', content.language || 'zh');
                                        
                                        // 尝试更新显示值
                                        const languageValue = languageTrigger.querySelector('[data-radix-select-value-id]');
                                        if (languageValue) {
                                          languageValue.textContent = content.language === 'en' ? '英文' : '中文';
                                        }
                                        
                                        // 确保界面反映正确的选项状态
                                        const languageEvent = new CustomEvent('custom-language-change', { 
                                          detail: { value: content.language || 'zh' } 
                                        });
                                        document.dispatchEvent(languageEvent);
                                      }
                                      
                                      // 设置内容类型
                                      const typeTrigger = document.querySelector('[data-id="content-type"]');
                                      if (typeTrigger) {
                                        // 设置data-value属性
                                        typeTrigger.setAttribute('data-value', content.type || 'text');
                                        
                                        // 尝试更新显示值
                                        const typeValue = typeTrigger.querySelector('[data-radix-select-value-id]');
                                        if (typeValue) {
                                          const typeMap: {[key: string]: string} = {
                                            'text': '文本',
                                            'html': 'HTML',
                                            'markdown': 'Markdown'
                                          };
                                          typeValue.textContent = typeMap[content.type] || '文本';
                                        }
                                        
                                        // 确保界面反映正确的选项状态
                                        const typeEvent = new CustomEvent('custom-type-change', { 
                                          detail: { value: content.type || 'text' } 
                                        });
                                        document.dispatchEvent(typeEvent);
                                      }
                                    } catch (e) {
                                      console.error("设置选择器失败:", e);
                                    }
                                    
                                    // 滚动到表单
                                    document.getElementById("website-content-form")?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                >
                                  编辑
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={async () => {
                                    if (window.confirm(`确定要删除 "${content.key}" 吗?`)) {
                                      try {
                                        const response = await apiRequest("DELETE", `/api/website-contents/${content.id}`);
                                        
                                        if (response.ok) {
                                          toast({
                                            title: "删除成功",
                                            description: "网站内容已成功删除",
                                          });
                                          
                                          // 重新获取内容列表
                                          await fetchWebsiteContents();
                                        } else {
                                          throw new Error(await response.text());
                                        }
                                      } catch (error) {
                                        console.error("删除网站内容错误:", error);
                                        toast({
                                          title: "删除失败",
                                          description: "无法删除网站内容，请稍后再试",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}
                                >
                                  删除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                            暂无网站内容，请添加新内容
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}