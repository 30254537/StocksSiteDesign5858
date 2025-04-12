import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  ShoppingBag, 
  ArrowLeft,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccess() {
  const { t } = useLanguage();
  const { cartItems } = useCart();
  const [, setLocation] = useLocation();

  // Show confetti effect when the page loads
  useEffect(() => {
    // Redirect if the user navigates directly to this page without checkout
    if (document.referrer.includes('/checkout') === false && cartItems.length !== 0) {
      setLocation('/');
      return;
    }

    // Run confetti animation
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const runConfetti = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00ffcc', '#333333', '#ffffff']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00ffcc', '#333333', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(runConfetti);
      }
    };

    try {
      runConfetti();
    } catch (e) {
      console.error('Confetti error:', e);
    }
  }, []);

  return (
    <div className="container max-w-4xl mx-auto px-4 pt-48 pb-36">
      <div className="bg-card rounded-lg shadow-lg p-8 text-center relative z-10">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-24 w-24 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          {t('checkoutSuccess.orderComplete')}
        </h1>
        
        <p className="text-xl mb-8">
          {t('checkoutSuccess.thankYou')}
        </p>
        
        <div className="mb-8 p-4 bg-muted rounded-md">
          <h2 className="font-medium mb-2">
            {t('checkoutSuccess.whatsNext')}
          </h2>
          <ul className="text-sm text-left space-y-2">
            <li className="flex items-start">
              <Send className="h-4 w-4 mr-2 mt-1 text-primary" />
              {t('checkoutSuccess.emailConfirmation')}
            </li>
            <li className="flex items-start">
              <ShoppingBag className="h-4 w-4 mr-2 mt-1 text-primary" />
              {t('checkoutSuccess.shipmentInfo')}
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('checkoutSuccess.continueShopping')}
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/account/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              {t('checkoutSuccess.viewOrders')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}