import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

// 提取URL中的支付意图ID和状态
function usePaymentStatus() {
  const [paymentStatus, setPaymentStatus] = useState<{
    success: boolean;
    paymentIntentId: string | null;
    error: string | null;
  }>({
    success: false,
    paymentIntentId: null,
    error: null
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const payment_intent = queryParams.get('payment_intent');
    const redirect_status = queryParams.get('redirect_status');
    const payment_intent_client_secret = queryParams.get('payment_intent_client_secret');
    
    // 设置支付状态
    setPaymentStatus({
      success: redirect_status === 'succeeded',
      paymentIntentId: payment_intent,
      error: redirect_status === 'failed' ? '支付失败' : null
    });
  }, []);

  return paymentStatus;
}

export default function PaymentCallback() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { paymentIntentId, success, error } = usePaymentStatus();
  const [isProcessing, setIsProcessing] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    const completeOrder = async () => {
      if (!paymentIntentId) {
        setIsProcessing(false);
        return;
      }

      if (!success) {
        toast({
          title: t('checkout.paymentError'),
          description: error || t('checkout.unableToProcessPayment'),
          variant: 'destructive',
        });
        setIsProcessing(false);
        setLocation('/checkout');
        return;
      }

      try {
        // 调用API完成订单处理
        const response = await apiRequest('POST', '/api/complete-order', {
          paymentIntentId,
          shippingAddress: localStorage.getItem('shippingAddress') || ''
        });

        // 清空购物车
        await clearCart();
        
        // 清除本地存储的运输地址
        localStorage.removeItem('shippingAddress');
        
        // 显示成功消息
        toast({
          title: t('checkout.paymentSuccessful'),
          description: t('checkout.orderPlacedSuccessfully'),
        });
        
        // 重定向到订单成功页面
        setLocation('/checkout-success');
      } catch (err) {
        console.error('Error completing order:', err);
        toast({
          title: t('checkout.paymentError'),
          description: t('checkout.unableToProcessPayment'),
          variant: 'destructive',
        });
        setIsProcessing(false);
      }
    };

    completeOrder();
  }, [paymentIntentId, success, error, t, toast, setLocation, clearCart]);

  // 显示加载状态
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="mb-4 flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <h1 className="text-2xl font-bold">{t('checkout.processingPayment')}</h1>
        <p className="text-md text-muted-foreground mt-2">
          {t('checkout.doNotCloseWindow')}
        </p>
      </div>
    </div>
  );
}