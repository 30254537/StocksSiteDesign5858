import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Textarea } from '@/components/ui/textarea';

// 确保在组件渲染外加载Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// 支付表单组件
function CheckoutForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    // 保存运输地址到本地存储，以便支付成功后在payment-callback页面中使用
    localStorage.setItem('shippingAddress', shippingAddress);
  }, [shippingAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!shippingAddress) {
      setError(t('checkout.shippingAddressRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 使用Stripe确认支付意图
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // 支付成功后重定向到payment-callback页面
          return_url: `${window.location.origin}/payment-callback`,
        },
      });

      // 如果有立即发生的错误
      if (error) {
        setError(error.message || t('checkout.paymentError'));
        toast({
          title: t('checkout.paymentError'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(t('checkout.paymentError'));
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 space-y-4">
        <div>
          <PaymentElement />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-accent">
            {t('checkout.shippingAddress')}:
          </label>
          <Textarea
            placeholder={t('checkout.enterShippingAddress')}
            className="mb-4 border-gray-700 bg-slate-800"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/20 rounded-md border border-red-800">
            {error}
          </div>
        )}

        <Button disabled={isLoading || !stripe} className="w-full" type="submit">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('checkout.processing')}
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {t('checkout.payNow')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// 主要的Stripe支付表单包装器组件
export function StripePaymentForm() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { totalPrice } = useCart();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    // 在组件挂载时创建支付意图
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount: totalPrice
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: t('checkout.paymentError'),
          description: t('checkout.unableToCreatePayment'),
          variant: 'destructive',
        });
      }
    };

    createPaymentIntent();
  }, [totalPrice, toast, t]);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#00ffcc',
      colorBackground: '#1e293b',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '6px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  );
}