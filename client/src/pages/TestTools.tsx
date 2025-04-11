import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocation } from 'wouter';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function TestTools() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  
  // 查询合约地址推文数量
  const { data: contractTweets, refetch } = useQuery({
    queryKey: ['/api/contract-tweets'],
    queryFn: async () => {
      const response = await fetch('/api/contract-tweets');
      const data = await response.json();
      return data.data || [];
    }
  });

  const addTestContractTweet = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/test/add-contract-tweet');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '成功添加测试推文',
          description: '一条新的测试合约地址推文已成功添加',
          variant: 'default',
        });
        
        // 刷新合约推文数据
        refetch();
      } else {
        throw new Error(data.error || '添加失败');
      }
    } catch (error: any) {
      toast({
        title: '添加测试推文失败',
        description: error.message || '发生未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Button variant="outline" className="mb-6" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
      </Button>
      
      <h1 className="text-3xl font-bold mb-8 text-center">测试工具</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>合约地址推文工具</CardTitle>
            <CardDescription>添加测试合约地址推文用于前端开发和测试</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>提示</AlertTitle>
              <AlertDescription>
                目前已有 {contractTweets?.length || 0} 条合约地址推文，点击下方按钮添加新的测试推文。
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={addTestContractTweet} 
              className="w-full"
              disabled={loading}
            >
              {loading ? '添加中...' : '添加测试合约地址推文'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}