import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, formatEth } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems, totalPrice, totalEthPrice, clearCart } = useCart();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Redirect to home if cart is empty
  if (cartItems.length === 0 && !orderComplete) {
    setLocation("/");
    return null;
  }

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      
      const response = await apiRequest("POST", "/api/checkout", {
        paymentMethod
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderId(data.orderId);
        setOrderComplete(true);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "There was a problem processing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {orderComplete ? (
        <Card className="max-w-xl mx-auto bg-secondary border border-accent/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 text-accent">
              <i className="fas fa-check-circle text-6xl"></i>
            </div>
            <CardTitle className="text-2xl font-orbitron">{t("checkout.successTitle")}</CardTitle>
            <CardDescription>{t("checkout.successMessage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="mb-2">{t("checkout.orderNumber")}</p>
              <div className="bg-accent/10 border border-accent/30 rounded-md py-2 px-4 font-mono text-accent">
                {orderId}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button className="bg-accent text-primary hover:bg-white">
                {t("checkout.continueShopping")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="bg-secondary border border-accent/30">
              <CardHeader>
                <CardTitle className="font-orbitron">{t("checkout.summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center py-3 border-b border-gray-800">
                    <div className="w-16 h-16 bg-primary/50 rounded-md overflow-hidden">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">{item.product.name}</h3>
                      {item.size && (
                        <span className="text-sm text-gray-400">Size: {item.size}</span>
                      )}
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">
                          {item.quantity} x {formatCurrency(item.product.price)}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("cart.total")} (USD)</span>
                    <span className="font-medium">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-accent">
                    <span>{t("cart.total")} (ETH)</span>
                    <span className="font-medium">{formatEth(totalEthPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method */}
          <div className="lg:col-span-1">
            <Card className="bg-secondary border border-accent/30">
              <CardHeader>
                <CardTitle className="font-orbitron">{t("checkout.paymentMethod")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 border border-gray-800 p-3 rounded-md">
                    <RadioGroupItem 
                      value="credit" 
                      id="credit" 
                      className="border-accent text-accent"
                    />
                    <Label htmlFor="credit" className="flex items-center">
                      <i className="far fa-credit-card mr-2 text-accent"></i>
                      {t("checkout.creditCard")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border border-gray-800 p-3 rounded-md">
                    <RadioGroupItem 
                      value="crypto" 
                      id="crypto"
                      className="border-accent text-accent"
                    />
                    <Label htmlFor="crypto" className="flex items-center">
                      <i className="fab fa-ethereum mr-2 text-accent"></i>
                      {t("checkout.crypto")}
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-8">
                  <Button 
                    className="w-full bg-accent text-primary hover:bg-white font-medium py-5"
                    disabled={isProcessing}
                    onClick={handleCheckout}
                  >
                    {isProcessing ? (
                      <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</>
                    ) : (
                      t("checkout.placeOrder")
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3 border-accent text-accent hover:bg-accent/10"
                    onClick={() => setLocation("/")}
                    disabled={isProcessing}
                  >
                    {t("checkout.backToCart")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
