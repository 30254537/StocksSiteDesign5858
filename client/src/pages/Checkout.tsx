import { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStonksPrice } from '@/contexts/StonksPriceContext';
import { formatCurrency, formatEth } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard, Bitcoin, RefreshCw } from 'lucide-react';
import { StonksPriceDisplay } from '@/components/ui/stonks-price-display';

// USDT到STONKS换算器组件
const UsdtToStonksConverter = () => {
  const [usdtAmount, setUsdtAmount] = useState<string>('0.00900000000000000001');
  const { convertUsdToStonks } = useStonksPrice();
  const { t, language } = useLanguage();
  
  // 计算等值的STONKS数量
  const stonksAmount = !isNaN(parseFloat(usdtAmount)) 
    ? convertUsdToStonks(parseFloat(usdtAmount)) 
    : 0;
    
  return (
    <div className="w-full flex items-center space-x-2">
      <div className="flex-1">
        <input
          type="text"
          value={usdtAmount}
          onChange={(e) => setUsdtAmount(e.target.value)}
          className="w-full p-2 bg-slate-900 rounded border border-gray-700 font-mono text-sm"
        />
      </div>
      <span className="text-gray-400">=</span>
      <div className="flex-1 relative">
        <div className="p-2 bg-slate-900 rounded border border-gray-700 font-mono text-sm flex items-center">
          <RefreshCw className="h-3 w-3 mr-2 text-accent" /> 
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            ⊙ {stonksAmount.toFixed(6)} $STONKS
          </span>
        </div>
      </div>
    </div>
  );
};

// Make sure to use environment variable to get public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Credit card checkout form
const CreditCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setError(null);

    // Confirm the payment
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout-success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || t('checkout.paymentError'));
      setIsLoading(false);
      return;
    }

    // If we get here, payment succeeded but didn't require redirect
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        // Record the order in our database
        await apiRequest('POST', '/api/complete-order', {
          paymentIntentId: paymentIntent.id,
          shippingAddress
        });

        toast({
          title: t('checkout.paymentSuccessful'),
          description: t('checkout.orderPlacedSuccessfully'),
        });

        // Clear cart and redirect to success page
        await clearCart();
        setLocation('/checkout-success');
      } catch (err) {
        console.error('Error completing order:', err);
        toast({
          title: t('checkout.orderError'),
          description: t('checkout.paymentSuccessButOrderError'),
          variant: 'destructive',
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          {t('checkout.shippingAddress')}
        </label>
        <Textarea
          placeholder={t('checkout.enterShippingAddress')}
          className="mb-4"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
        />
      </div>
      
      <PaymentElement className="mb-6" />
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
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
    </form>
  );
};

// Crypto checkout form
const CryptoForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { cartItems, totalEthPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { currentPrice, convertUsdToStonks } = useStonksPrice();
  const [shippingAddress, setShippingAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionHash) {
      setError(t('checkout.transactionHashRequired'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Submit crypto payment details
      await apiRequest('POST', '/api/crypto-checkout', {
        paymentMethod: 'crypto',
        transactionHash,
        shippingAddress
      });
      
      toast({
        title: t('checkout.paymentSuccessful'),
        description: t('checkout.orderPlacedSuccessfully'),
      });
      
      // Clear cart and redirect to success page
      await clearCart();
      setLocation('/checkout-success');
    } catch (err) {
      console.error('Error processing crypto payment:', err);
      setError(t('checkout.cryptoPaymentError'));
      toast({
        title: t('checkout.paymentError'),
        description: t('checkout.unableToProcessPayment'),
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <p className="mb-4 text-sm">
          {t('checkout.sendTokensToAddress')}:
        </p>
        <div className="bg-slate-800 p-3 rounded-md font-mono text-sm mb-4 break-all">
          0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        </div>
        <p className="mb-4 text-sm">
          {t('checkout.amountToSend')}: <strong>{formatEth(totalEthPrice)}</strong>
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          {t('checkout.transactionHash')}
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="0x..."
          value={transactionHash}
          onChange={(e) => setTransactionHash(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('checkout.enterTransactionHash')}
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          {t('checkout.shippingAddress')}
        </label>
        <Textarea
          placeholder={t('checkout.enterShippingAddress')}
          className="mb-4"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
        />
      </div>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <Button disabled={isLoading} className="w-full" type="submit">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('checkout.processing')}
          </>
        ) : (
          <>
            <Bitcoin className="mr-2 h-4 w-4" />
            {t('checkout.confirmPayment')}
          </>
        )}
      </Button>
    </form>
  );
};

// Order summary component
const OrderSummary = () => {
  const { cartItems, totalItems, totalPrice, totalEthPrice } = useCart();
  const { t, language } = useLanguage();
  const { currentPrice } = useStonksPrice();

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p>{t('cart.emptyCart')}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{t('checkout.orderSummary')}</h3>
      
      <div className="space-y-3 mb-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between">
            <div>
              <span className="font-medium">{item.quantity}x</span> {item.product.name}
              {item.size && <span className="ml-1 text-sm text-gray-500">({item.size})</span>}
            </div>
            <div>
              {formatCurrency(item.product.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between mb-2">
        <div>{t('checkout.subtotal')}</div>
        <div>{formatCurrency(totalPrice)}</div>
      </div>
      
      <div className="flex justify-between mb-4">
        <div>{t('checkout.shipping')}</div>
        <div>{t('checkout.free')}</div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between font-bold mb-2">
        <div>{t('checkout.total')}</div>
        <div>{formatCurrency(totalPrice)}</div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-500">
        <div>{t('checkout.orCrypto')}</div>
        <div>{formatEth(totalEthPrice)}</div>
      </div>
      
      {/* 添加STONKS实时价格转换信息 */}
      <div className="mt-4 border-t border-gray-700 pt-4">
        <StonksPriceDisplay amount={totalPrice} showConverter={false} />
        
        {/* USDT到STONKS换算器 */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <h4 className="text-sm mb-2">{t('stonksPrice.converter')}</h4>
          <div className="flex items-center space-x-2">
            <UsdtToStonksConverter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const { totalPrice, cartItems } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Redirect to cart if no items
    if (cartItems.length === 0) {
      toast({
        title: t('checkout.emptyCart'),
        description: t('checkout.pleaseAddItems'),
      });
      setLocation('/');
      return;
    }
    
    // Create payment intent when the page loads
    const getPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('POST', '/api/create-payment-intent');
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: t('checkout.errorCreatingPayment'),
          description: t('checkout.pleaseTryAgainLater'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    getPaymentIntent();
  }, [cartItems.length, setLocation, toast, t]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('checkout.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.orderSummary')}</CardTitle>
            <CardDescription>{`${cartItems.length} ${t('checkout.itemsInCart')}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummary />
          </CardContent>
        </Card>
        
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.payment')}</CardTitle>
            <CardDescription>{t('checkout.choosePaymentMethod')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="card">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="card">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('checkout.creditCard')}
                </TabsTrigger>
                <TabsTrigger value="crypto">
                  <Bitcoin className="mr-2 h-4 w-4" />
                  {t('checkout.cryptocurrency')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="card">
                {clientSecret ? (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: { 
                        theme: 'night',
                        variables: {
                          colorPrimary: '#00ffcc',
                        }
                      } 
                    }}
                  >
                    <CreditCardForm />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="crypto">
                <CryptoForm />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-xs text-gray-500">
              {t('checkout.securePayment')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}