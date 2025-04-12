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

// Order lookup form validation schema
const orderLookupSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().email(),
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
      case 'crypto':
        return t('checkout.cryptocurrency');
      default:
        return method;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-32 pt-40 max-w-6xl">
      <h1 className="text-3xl text-white font-bold mb-10">{t('orderLookup.title')}</h1>
      
      <div className="bg-primary-900 rounded-lg shadow-lg overflow-hidden">
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
                        className="bg-primary-800 border-primary-700 text-white h-11 relative z-20" 
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
                        className="bg-primary-800 border-primary-700 text-white h-11 relative z-20" 
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
          <div className="p-8 bg-primary-800">
            <div className="flex items-center justify-between mb-8 border-b border-primary-700 pb-6">
              <div>
                <h2 className="text-2xl text-white font-medium mb-3">{t('orders.viewDetails')}</h2>
                <div className="flex items-center mt-2">
                  <span className="text-accent mr-2 font-semibold">{t('orders.orderNumber')}:</span>
                  <span className="bg-primary-900 px-4 py-2 rounded-md font-mono text-white text-lg">#{order.id}</span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-primary-300 mb-1">{t('orders.date')}</p>
                <p className="text-white font-medium">{formatDate(new Date(order.createdAt))}</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">{t('orders.paymentMethod')}</p>
                <p className="text-white font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">{t('orders.total')}</p>
                <p className="text-white font-medium">
                  {formatCurrency(order.total)} / ⊙ {order.ethTotal.toFixed(6)} $STONKS
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-primary-300 mb-1">{t('orders.shipping')}</p>
              <p className="text-white font-medium break-words">{order.shippingAddress}</p>
            </div>
            
            {order.trackingNumber && (
              <div className="mb-6">
                <p className="text-primary-300 mb-1">{t('orders.trackingNumber')}</p>
                <p className="text-white font-medium">{order.trackingNumber}</p>
              </div>
            )}
            
            <h3 className="text-lg text-white font-medium mb-4">{t('orders.items')}</h3>
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
                        {t('orders.quantity')} {item.quantity}
                      </p>
                      {item.size && (
                        <p className="text-primary-300 text-sm">
                          {t('product.size')} {item.size}
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
                  {t('cart.continueShopping')}
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
                  {t('orderLookup.title')}
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