import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Truck, Calendar, CreditCard, Package, AlertCircle, Gift, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatTransactionHash } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";

// 订单类型定义
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  size?: string;
  productName: string;
  productImage: string;
}

interface Order {
  id: number;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  transactionHash?: string;
  trackingNumber?: string;
  shippingAddress: string;
  items: OrderItem[];
  network?: string;
}

export default function MyOrders() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // 获取用户订单
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/my-orders");
        const data = await response.json();
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error("获取订单失败:", err);
        setError("无法加载您的订单，请稍后再试");
        toast({
          title: "获取订单失败",
          description: "无法加载您的订单，请稍后再试",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  // 订单状态映射
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: language === 'zh' ? "待付款" : "Pending",
      paid: language === 'zh' ? "已付款" : "Paid",
      shipped: language === 'zh' ? "已发货" : "Shipped",
      completed: language === 'zh' ? "已完成" : "Completed",
      cancelled: language === 'zh' ? "已取消" : "Cancelled"
    };
    return statusMap[status] || status;
  };

  // 支付方式映射
  const getPaymentMethodDisplay = (method: string): string => {
    const methodMap: Record<string, string> = {
      stonks: "STONKS",
      usdt: "USDT",
      fiat: language === 'zh' ? "法币支付" : "Fiat"
    };
    return methodMap[method] || method;
  };

  // 获取USDT网络名称
  const getNetworkDisplay = (network?: string): string => {
    if (!network) return "";
    
    const networkMap: Record<string, string> = {
      trc20: "TRC20 (TRON)",
      erc20: "ERC20 (Ethereum)",
      bep20: "BEP20 (BSC)",
      sol: "Solana"
    };
    
    return networkMap[network] || network;
  };

  // No longer needed as the OrderStatusBadge component handles this

  // 订单详情展示
  const renderOrderDetails = (order: Order) => {
    return (
      <div className="space-y-6 mt-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">
              {t('orders.orderNumber')}: <span className="font-mono">#{order.id}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-primary-foreground/5 border border-border/50">
          {/* Order Summary Box */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <div>
                <p className="text-sm font-medium text-accent">{t('orders.paymentMethod')}</p>
                <p className="text-sm">
                  {getPaymentMethodDisplay(order.paymentMethod)}
                  {order.network && ` - ${getNetworkDisplay(order.network)}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-accent" />
              <div>
                <p className="text-sm font-medium text-accent">{t('orders.items')}</p>
                <p className="text-sm">{order.items.length} {order.items.length > 1 ? t('items') : t('item')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              <div>
                <p className="text-sm font-medium text-accent">{t('orders.total')}</p>
                <p className="text-sm">${Math.floor(order.total)}</p>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent">{t('orders.shipping')}</p>
                <p className="text-sm whitespace-pre-line">
                  {order.shippingAddress}
                </p>
                
                {order.trackingNumber && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-accent">{t('orders.trackingNumber')}</p>
                    <p className="text-sm font-mono">{order.trackingNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {order.transactionHash && (
          <div className="p-3 rounded-lg bg-primary-foreground/5 border border-border/50">
            <p className="text-sm font-medium text-accent mb-1">
              {language === 'zh' ? '交易哈希' : 'Transaction Hash'}
            </p>
            <p className="text-sm font-mono overflow-auto break-all">
              {formatTransactionHash(order.transactionHash, order.paymentMethod)}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-accent mb-2">
            {language === 'zh' ? '订单商品' : 'Order Items'}
          </p>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-primary-foreground/10 p-3 rounded">
                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm">USDT ${Math.floor(item.price)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <p>
                      {language === 'zh' ? '数量' : 'Qty'}: {item.quantity}
                      {item.size && ` / ${language === 'zh' ? '尺码' : 'Size'}: ${item.size}`}
                    </p>
                    <p>USDT ${Math.floor(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between font-medium">
          <p>{language === 'zh' ? '总计' : 'Total'}</p>
          <p>USDT ${Math.floor(order.total)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-32 pt-40 max-w-6xl">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-white">
          {language === 'zh' ? '我的订单' : 'My Orders'}
        </h1>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'zh' ? '返回首页' : 'Back to Home'}
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              {language === 'zh' ? '重试' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg">
              {language === 'zh' ? '您还没有任何订单' : 'You don\'t have any orders yet'}
            </p>
            <Button asChild className="mt-4">
              <Link href="/">
                {language === 'zh' ? '开始购物' : 'Start Shopping'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{language === 'zh' ? '订单列表' : 'Order List'}</CardTitle>
                <CardDescription>
                  {language === 'zh' 
                    ? `共 ${orders.length} 个订单` 
                    : `${orders.length} orders in total`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`p-3 rounded-md cursor-pointer border transition-all duration-200 ${
                        selectedOrderId === order.id 
                          ? 'border-accent bg-accent/10 text-white' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex justify-between">
                        <p className="font-medium">#{order.id}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <p>{formatDate(order.createdAt)}</p>
                        <p>USDT ${Math.floor(order.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-xl mb-2">
                  {language === 'zh' ? '订单详情' : 'Order Details'}
                </CardTitle>
                <CardDescription className="flex items-center">
                  {selectedOrderId ? (
                    <>
                      <span className="font-semibold text-accent mr-1">订单号:</span> 
                      <span className="font-mono">#{selectedOrderId}</span>
                    </>
                  ) : (
                    language === 'zh' 
                      ? '选择一个订单查看详情' 
                      : 'Select an order to view details'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {selectedOrderId ? (
                  renderOrderDetails(orders.find(o => o.id === selectedOrderId)!)
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p>
                      {language === 'zh' 
                        ? '请从左侧选择一个订单查看详情' 
                        : 'Please select an order from the list to view details'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}