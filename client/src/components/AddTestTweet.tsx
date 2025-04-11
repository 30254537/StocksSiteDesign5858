import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const AddTestTweet: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('MoontokListing');
  const [authorUsername, setAuthorUsername] = useState('MoontokListing');
  const [isOpen, setIsOpen] = useState(false);
  
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tweets-test", data);
      return response.json();
    },
    onSuccess: () => {
      // 重置表单
      setText('');
      // 刷新推文列表
      queryClient.invalidateQueries({ queryKey: ['/api/tweets'] });
      
      toast({
        title: language === 'zh' ? "添加成功" : "Added successfully",
        description: language === 'zh' ? "测试推文已添加" : "Test tweet has been added",
      });
      
      // 关闭表单
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'zh' ? "添加失败" : "Failed to add",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text) {
      toast({
        title: language === 'zh' ? "请输入内容" : "Please enter content",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate({
      text,
      authorName,
      authorUsername
    });
  };
  
  if (!isOpen) {
    return (
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm"
          className="w-full border-dashed border-gray-500 hover:border-teal-400 bg-gray-800/50"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'zh' ? '添加测试推文' : 'Add Test Tweet'}
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="mb-4 bg-gray-800/50 border border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-md text-teal-400">
          {language === 'zh' ? '添加测试推文' : 'Add Test Tweet'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="text">{language === 'zh' ? '推文内容' : 'Tweet Content'}</Label>
            <Textarea
              id="text"
              placeholder={language === 'zh' ? '在此输入推文内容...' : 'Enter tweet content here...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-gray-900 border-gray-700"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="authorName">{language === 'zh' ? '作者名称' : 'Author Name'}</Label>
              <Input
                id="authorName"
                placeholder="MoontokListing"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="authorUsername">{language === 'zh' ? '用户名' : 'Username'}</Label>
              <Input
                id="authorUsername"
                placeholder="MoontokListing"
                value={authorUsername}
                onChange={(e) => setAuthorUsername(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={mutation.isPending}
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button 
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'zh' ? '添加中...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'zh' ? '添加' : 'Add'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTestTweet;