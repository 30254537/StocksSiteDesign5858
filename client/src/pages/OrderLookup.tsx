import React, { useState } from 'react';
import { useTranslation } from '@/lib/translations';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, formatCurrency, formatTransactionHash } from '@/lib/utils';
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

// Order lookup form validation schema
const orderLookupSchema = z.object({
  orderId: z.string().min(1, { message: "validation.required" }),
  email: z.string().email({ message: "validation.email" }),
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
        toast({
          variant: "default",
          title: t('orderLookup.success'),
          description: t('orders.viewDetails'),
        });
      } else {
        setError(result.error || t('orderLookup.error'));
        toast({
          variant: "destructive",
          title: t('checkout.orderError'),
          description: result.error || t('orderLookup.error'),
        });
      }
    } catch (err) {
      console.error("Error querying order:", err);
      setError(t('orderLookup.error'));
      toast({
        variant: "destructive",
        title: t('checkout.orderError'),
        description: t('checkout.pleaseTryAgainLater'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get text representation of order status
  const getStatusText = (status: string) => {
    const statusKey = `orders.status.${status}`;
    return t(statusKey, status); // Fallback to the status itself if no translation exists
  };
  
  // Get the appropriate color classes for order status
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
  
  // Get text representation of payment method
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'usdt':
        return 'USDT';
      case 'stonks':
        return 'STONKS';
      case 'crypto':
        return 'STONKS'; // 将crypto替换为具体币种STONKS
      default:
        return method;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-32 pt-40 max-w-6xl">
      <h1 className="text-3xl text-white font-bold mb-10 text-center">{t('orderLookup.title')}</h1>
      
      <div className="bg-primary-900 rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
        <div className="p-8 border-b border-primary-700">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem className="relative z-20">
                    <FormLabel className="text-white text-base mb-2 block">{t('orderLookup.orderNumber')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('orderLookup.orderNumberPlaceholder')} 
                        {...field} 
                        className="bg-primary-800 border-primary-700 text-black h-11 relative z-20" 
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
                  <FormItem className="relative z-20">
                    <FormLabel className="text-white text-base mb-2 block">{t('orderLookup.email')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('orderLookup.emailPlaceholder')} 
                        {...field} 
                        className="bg-primary-800 border-primary-700 text-black h-11 relative z-20" 
                      />
                    </FormControl>
                    <FormDescription className="text-primary-300 mt-2">
                      {t('orderLookup.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-primary-900 h-11 mt-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('checkout.processing')}
                  </>
                ) : (
                  t('orderLookup.submit')
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
          <div className="p-8 bg-primary-800 max-w-3xl mx-auto">
            <div className="mb-8 border-b border-accent/30 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-white font-bold tracking-tight">{t('orders.viewDetails')}</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex items-center bg-primary-900/70 p-4 rounded-lg border border-accent/50 shadow-lg">
                <span className="text-accent mr-3 font-bold text-base uppercase">{t('orders.orderNumber')}:</span>
                <span className="bg-primary-950 px-5 py-2 rounded-md font-mono text-white text-lg font-bold tracking-wider border border-accent/40">
                  #{order.id}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-accent/40 rounded-lg p-4 bg-primary-900/70 shadow-md">
                  <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">{t('orders.date')}：</p>
                  <p className="text-white font-semibold text-base">{formatDate(new Date(order.createdAt))}</p>
                </div>
                <div className="border-2 border-accent/40 rounded-lg p-4 bg-primary-900/70 shadow-md">
                  <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">{t('orders.paymentMethod')}：</p>
                  <p className="text-white font-semibold text-base">{getPaymentMethodText(order.paymentMethod)}</p>
                </div>
              </div>
              
              <div className="border-2 border-accent/40 rounded-lg p-4 bg-primary-900/70 shadow-md">
                <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">{t('orders.total')}:</p>
                <p className="text-white font-semibold text-lg">
                  USDT ${Math.floor(order.total)} / ⊙ {Math.floor(order.ethTotal)} $STONKS
                </p>
              </div>
              
              <div className="border-2 border-accent/40 rounded-lg p-4 bg-primary-900/70 shadow-md">
                <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">{t('orders.shipping')}：</p>
                <p className="text-white font-semibold text-base break-words">{order.shippingAddress}</p>
              </div>
            </div>
            
            {order.trackingNumber && (
              <div className="mb-6 border-2 border-accent/40 rounded-lg p-4 bg-primary-900/70 shadow-md">
                <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">{t('orders.trackingNumber')}：</p>
                <p className="text-white font-semibold text-base font-mono">{order.trackingNumber}</p>
              </div>
            )}
            
            {order.notes && (
              <div className="mb-6 border-2 border-accent/40 rounded-lg p-4 bg-primary-900/70 shadow-md">
                <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">{t('orders.transactionHash')}：</p>
                <p className="text-white font-semibold text-base font-mono">
                  {formatTransactionHash(order.notes, order.paymentMethod)}
                </p>
              </div>
            )}
            
            <div className="border-t-2 border-accent/40 pt-6 mt-6">
              <h3 className="text-xl text-accent font-bold uppercase tracking-wide mb-4">{t('orders.items')}：</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center bg-primary-900/80 p-4 rounded-lg border-2 border-accent/40 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-20 h-20 mr-5">
                      <img 
                        src={item.productImage} 
                        alt={item.productName} 
                        className="w-full h-full object-cover rounded-md border border-accent/30"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-white font-bold text-lg">{item.productName}</h4>
                      <div className="flex mt-2">
                        <div className="bg-primary-950 px-3 py-1 rounded mr-3 border border-accent/30">
                          <span className="text-accent font-bold uppercase text-xs mr-1">{t('orders.quantity')}:</span>
                          <span className="text-white font-semibold">{item.quantity}</span>
                        </div>
                        {item.size && (
                          <div className="bg-primary-950 px-3 py-1 rounded border border-accent/30">
                            <span className="text-accent font-bold uppercase text-xs mr-1">{t('product.size')}:</span>
                            <span className="text-white font-semibold">{item.size}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-accent/20">
                        <span className="text-accent font-bold">
                          USDT ${Math.floor(item.price)} / ⊙ {Math.floor(item.ethPrice)} $STONKS
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-2 border-accent/50 text-white hover:bg-primary-800 font-semibold shadow-md"
                >
                  <ShoppingBag className="mr-2 h-5 w-5 text-accent" />
                  {t('cart.continueShopping')}
                </Button>
              </Link>
              
              <Link href="/order-lookup">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-2 border-accent/50 text-white hover:bg-primary-800 font-semibold shadow-md"
                  onClick={() => {
                    setOrder(null);
                    form.reset();
                  }}
                >
                  {t('orderLookup.title')}
                  <ArrowRight className="ml-2 h-5 w-5 text-accent" />
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