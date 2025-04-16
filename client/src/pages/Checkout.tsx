import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bitcoin, RefreshCw, DollarSign, User, Mail, Phone, MapPin } from 'lucide-react';
import { StonksPriceDisplay } from '@/components/ui/stonks-price-display';
import { CustomerInfoForm } from '@/components/ui/customer-info-form';

// USDT Direct Payment Form
const UsdtDirectForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { clearCart, totalPrice } = useCart();
  
  // Customer contact information
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  // Add USDT chain selection
  const [selectedUsdtChain, setSelectedUsdtChain] = useState('trc20');
  
  // USDT chain options
  const usdtChains = [
    { id: 'trc20', name: 'TRC20 (TRON)', logo: '⚡️', address: 'TNVaUw4sDHsVzsHx7ZQKGQQGbM12QyR4TF' },
    { id: 'erc20', name: 'ERC20 (Ethereum)', logo: '🔷', address: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e' },
    { id: 'bep20', name: 'BEP20 (BSC)', logo: '🟡', address: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e' },
    { id: 'sol', name: 'Solana', logo: '🟣', address: '6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump' }
  ];
  
  // Get the address for the currently selected chain
  const currentChainAddress = usdtChains.find(chain => chain.id === selectedUsdtChain)?.address || '';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionHash) {
      setError(t('checkout.transactionHashRequired'));
      return;
    }
    
    if (!customerEmail) {
      setError(t('checkout.emailRequired'));
      return;
    }
    
    if (!shippingAddress) {
      setError(t('checkout.shippingAddressRequired'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Submit USDT payment details
      const response = await apiRequest('POST', '/api/crypto-checkout', {
        paymentMethod: 'usdt',
        transactionHash,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        network: selectedUsdtChain
      });
      
      // 首先显示成功消息
      toast({
        title: t('checkout.paymentSuccessful'),
        description: t('checkout.orderPlacedSuccessfully'),
      });
      
      // 清空购物车
      await clearCart();
      
      // 使用setTimeout确保重定向发生在状态更新之后
      setTimeout(() => {
        // 重定向到成功页面
        setLocation('/checkout-success');
      }, 300); // 短暂延迟以确保状态已更新
    } catch (err) {
      console.error('Error processing USDT payment:', err);
      setError(t('checkout.cryptoPaymentError'));
      toast({
        title: t('checkout.paymentError'),
        description: t('checkout.unableToProcessPayment'),
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <p className="mb-4 text-sm">
          {t('checkout.sendUsdtTo')}
        </p>
        
        {/* USDT Chain Selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-accent">
            {t('checkout.selectUsdtNetwork')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {usdtChains.map(chain => (
              <div 
                key={chain.id}
                className={`p-3 rounded-md cursor-pointer border transition-all duration-200 ${
                  selectedUsdtChain === chain.id 
                    ? 'border-accent bg-accent/10 text-white' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => setSelectedUsdtChain(chain.id)}
              >
                <div className="flex items-center">
                  <span className="mr-2">{chain.logo}</span>
                  <span>{chain.name}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-slate-800 rounded-md font-mono text-sm break-all user-select-all">
            <p className="text-xs text-gray-400 mb-1">$USDT {t('checkout.receiveAddress')} ({usdtChains.find(c => c.id === selectedUsdtChain)?.name}):</p>
            {currentChainAddress}
          </div>
        </div>
        
        <p className="mt-6 mb-4 text-sm">
          {t('checkout.amountToSend')}: <strong className="text-accent font-mono">{formatCurrency(totalPrice)} $USDT</strong>
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-accent">
          {t('checkout.transactionHash')}
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-700 bg-slate-800 rounded-md"
          placeholder="0x..."
          value={transactionHash}
          onChange={(e) => setTransactionHash(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('checkout.enterTransactionHash')}
        </p>
      </div>
      
      <CustomerInfoForm
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        shippingAddress={shippingAddress}
        setShippingAddress={setShippingAddress}
      />
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/20 rounded-md border border-red-800">
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
            <DollarSign className="mr-2 h-4 w-4" />
            {t('checkout.confirmPayment')}
          </>
        )}
      </Button>
    </form>
  );
};

// USDT to STONKS Converter Component
const UsdtToStonksConverter = () => {
  const [usdtAmount, setUsdtAmount] = useState<string>('0.00900000000000000001');
  const { convertUsdToStonks } = useStonksPrice();
  const { t, language } = useLanguage();
  
  // Calculate equivalent STONKS amount
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

// Old Stripe-based USDT form has been removed
// Replaced with the new UsdtDirectForm component

// Crypto checkout form
const CryptoForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { cartItems, totalEthPrice, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { currentPrice, convertUsdToStonks } = useStonksPrice();
  
  // Customer contact information
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionHash) {
      setError(t('checkout.transactionHashRequired'));
      return;
    }
    
    if (!shippingAddress) {
      setError(t('checkout.shippingAddressRequired'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Submit crypto payment details
      const response = await apiRequest('POST', '/api/crypto-checkout', {
        paymentMethod: 'crypto',
        transactionHash,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress
      });
      
      // 首先显示成功消息
      toast({
        title: t('checkout.paymentSuccessful'),
        description: t('checkout.orderPlacedSuccessfully'),
      });
      
      // 清空购物车
      await clearCart();
      
      // 使用setTimeout确保重定向发生在状态更新之后
      setTimeout(() => {
        // 重定向到成功页面
        setLocation('/checkout-success');
      }, 300); // 短暂延迟以确保状态已更新
    } catch (err) {
      console.error('Error processing crypto payment:', err);
      setError(t('checkout.cryptoPaymentError'));
      toast({
        title: t('checkout.paymentError'),
        description: t('checkout.unableToProcessPayment'),
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <p className="mb-4 text-sm">
          {t('checkout.sendStonksToAddress')}
        </p>
        <div className="bg-slate-800 p-3 rounded-md font-mono text-sm mb-4 break-all user-select-all">
          0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        </div>
        <p className="mb-4 text-sm">
          {t('checkout.amountToSend')}: <strong className="text-accent font-mono">⊙ {convertUsdToStonks(totalPrice).toFixed(6)} $STONKS</strong>
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-accent">
          {t('checkout.transactionHash')}
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-700 bg-slate-800 rounded-md"
          placeholder="0x..."
          value={transactionHash}
          onChange={(e) => setTransactionHash(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('checkout.enterTransactionHash')}
        </p>
      </div>
      
      <CustomerInfoForm
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        shippingAddress={shippingAddress}
        setShippingAddress={setShippingAddress}
      />
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/20 rounded-md border border-red-800">
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
              <span className="font-medium">{item.quantity}x</span> {language === 'zh' ? item.product.name : (t(`product.name.${item.product.id}`, item.product.name))}
              {item.size && <span className="ml-1 text-sm text-gray-500">({item.size})</span>}
            </div>
            <div>
              {formatCurrency(item.product.price * item.quantity, 'USD', false)}
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between mb-2">
        <div>{t('checkout.subtotal')}:</div>
        <div>{formatCurrency(totalPrice, 'USD', false)}</div>
      </div>
      
      <div className="flex justify-between mb-4">
        <div>{t('checkout.shipping')}:</div>
        <div>{t('checkout.free')}</div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between font-bold mb-2">
        <div>{t('checkout.total')}:</div>
        <div>{formatCurrency(totalPrice, 'USD', false)}</div>
      </div>
      

      
      {/* Add STONKS real-time price conversion information */}
      <div className="mt-4 border-t border-gray-700 pt-4">
        <StonksPriceDisplay amount={totalPrice} showConverter={false} />
        
        {/* USDT to STONKS converter */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <h4 className="text-sm mb-2 text-center text-accent font-semibold">{t('stonksPrice.converter')}</h4>
          <div className="flex items-center space-x-2">
            <UsdtToStonksConverter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [isLoading, setIsLoading] = useState(false);
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
  }, [cartItems.length, setLocation, toast, t]);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('checkout.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card>
          <CardHeader className="pt-8 pb-6">
            <CardTitle className="mb-2">{t('checkout.orderSummary')}</CardTitle>
            <CardDescription>{`${cartItems.length} ${t('checkout.itemsInCart')}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummary />
          </CardContent>
        </Card>
        
        {/* Payment Methods */}
        <Card>
          <CardHeader className="pt-8 pb-6">
            <CardTitle className="mb-2">{t('checkout.payment')}</CardTitle>
            <CardDescription>{t('checkout.choosePaymentMethod')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="crypto">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="crypto">$STONKS</TabsTrigger>
                <TabsTrigger value="card">$USDT</TabsTrigger>
              </TabsList>
              <TabsContent value="crypto">
                <CryptoForm />
              </TabsContent>
              <TabsContent value="card">
                <UsdtDirectForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}