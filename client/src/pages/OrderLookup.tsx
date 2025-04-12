import React, { useState } from 'react';
import { useTranslation } from '@/lib/translations';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// 订单查询表单验证模式
const orderLookupSchema = z.object({
  orderId: z.string().min(1, "请输入订单号"),
  email: z.string().email("请输入有效的邮箱地址"),
});

type OrderLookupForm = z.infer<typeof orderLookupSchema>;

// 订单项类型
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  ethPrice: number;
  size: string | null;
  createdAt: string;
}

// 订单类型
interface Order {
  id: number;
  userId: number | null;
  sessionId: string;
  total: number;
  ethTotal: number;
  paymentMethod: string;
  status: string;
  shippingAddress: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const OrderLookup: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<OrderLookupForm>({
    resolver: zodResolver(orderLookupSchema),
    defaultValues: {
      orderId: "",
      email: "",
    },
  });
  
  const onSubmit = async (data: OrderLookupForm) => {
    setIsLoading(true);
    setError(null);
    setOrder(null);
    
    try {
      const response = await apiRequest("POST", "/api/lookup-order", data);
      const result = await response.json();
      
      if (response.ok) {
        setOrder(result.order);
      } else {
        setError(result.error || "查询订单失败，请稍后再试");
        toast({
          variant: "destructive",
          title: "查询失败",
          description: result.error || "查询订单失败，请稍后再试",
        });
      }
    } catch (err) {
      console.error("查询订单出错:", err);
      setError("查询订单失败，请稍后再试");
      toast({
        variant: "destructive",
        title: "查询失败",
        description: "网络错误，请稍后再试",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 获取订单状态显示文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待付款',
      'processing': '处理中',
      'shipped': '已发货',
      'delivered': '已送达',
      'completed': '已完成',
      'cancelled': '已取消',
      'refunded': '已退款'
    };
    
    return statusMap[status] || status;
  };
  
  // 获取订单状态显示颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'text-yellow-500 bg-yellow-100',
      'processing': 'text-blue-500 bg-blue-100',
      'shipped': 'text-purple-500 bg-purple-100',
      'delivered': 'text-green-500 bg-green-100',
      'completed': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-500 bg-red-100',
      'refunded': 'text-gray-500 bg-gray-100'
    };
    
    return colorMap[status] || 'text-gray-500 bg-gray-100';
  };
  
  // 获取支付方式显示文本
  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      'usdt': 'USDT',
      'credit_card': '信用卡',
      'paypal': 'PayPal',
      'crypto': '加密货币',
      'bank_transfer': '银行转账',
      'alipay': '支付宝',
      'wechat': '微信支付'
    };
    
    return methodMap[method] || method;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl text-white font-bold mb-6">订单查询</h1>
      
      <div className="bg-primary-900 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-primary-700">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">订单号</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入订单号" 
                        {...field} 
                        className="bg-primary-800 border-primary-700 text-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">邮箱地址</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入下单时使用的邮箱地址" 
                        {...field} 
                        className="bg-primary-800 border-primary-700 text-white" 
                      />
                    </FormControl>
                    <FormDescription className="text-primary-300">
                      输入您下单时填写的邮箱地址
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-primary-900"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    查询中...
                  </>
                ) : (
                  "查询订单"
                )}
              </Button>
            </form>
          </Form>
        </div>
        
        {error && (
          <div className="p-6 bg-red-900/20 border-t border-primary-700">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {order && (
          <div className="p-6 bg-primary-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white font-medium">订单详情</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-primary-300 mb-1">订单号</p>
                <p className="text-white font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">下单日期</p>
                <p className="text-white font-medium">{formatDate(new Date(order.createdAt))}</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">支付方式</p>
                <p className="text-white font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">总金额</p>
                <p className="text-white font-medium">
                  {formatCurrency(order.total)} / ⊙ {order.ethTotal.toFixed(6)} $STONKS
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-primary-300 mb-1">联系邮箱/配送地址</p>
              <p className="text-white font-medium break-words">{order.shippingAddress}</p>
            </div>
            
            {order.trackingNumber && (
              <div className="mb-6">
                <p className="text-primary-300 mb-1">物流单号</p>
                <p className="text-white font-medium">{order.trackingNumber}</p>
              </div>
            )}
            
            <h3 className="text-lg text-white font-medium mb-4">订单商品</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center bg-primary-900 p-4 rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 mr-4">
                    <img 
                      src={item.productImage} 
                      alt={item.productName} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-white font-medium">{item.productName}</h4>
                    <div className="flex mt-1">
                      <p className="text-primary-300 text-sm mr-4">
                        数量: {item.quantity}
                      </p>
                      {item.size && (
                        <p className="text-primary-300 text-sm">
                          尺码: {item.size}
                        </p>
                      )}
                    </div>
                    <p className="text-accent mt-1">
                      {formatCurrency(item.price)} / ⊙ {item.ethPrice.toFixed(6)} $STONKS
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between">
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-primary-600 text-white hover:bg-primary-700"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  继续购物
                </Button>
              </Link>
              
              <Link href="/order-lookup">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-primary-600 text-white hover:bg-primary-700"
                  onClick={() => {
                    setOrder(null);
                    form.reset();
                  }}
                >
                  查询其他订单
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderLookup;