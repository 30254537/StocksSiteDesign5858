import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStonksPrice } from "@/contexts/StonksPriceContext";
import { formatCurrency, formatEth, formatPrice, formatUsdToStonks } from "@/lib/utils";

export default function CartModal() {
  const { cartItems, totalPrice, totalEthPrice, isCartOpen, closeCart, removeCartItem, updateCart } = useCart();
  const { t } = useLanguage();
  const { currentPrice } = useStonksPrice();

  const handleRemoveItem = (itemId: number) => {
    removeCartItem(itemId);
  };

  const handleUpdateQuantity = (itemId: number, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    updateCart(itemId, newQuantity);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent 
        side="right" 
        className="bg-secondary border-l border-accent/30 p-0 w-full md:max-w-md"
        aria-describedby="cart-description"
      >
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <SheetHeader className="p-4 border-b border-accent/30">
            <SheetTitle className="text-xl font-orbitron font-medium">
              {t("cart.title")}
            </SheetTitle>
            <SheetClose className="absolute right-4 top-4 text-gray-400 hover:text-white rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <i className="fas fa-times text-lg"></i>
              <span className="sr-only">Close</span>
            </SheetClose>
          </SheetHeader>
          
          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <i className="fas fa-shopping-cart text-4xl text-gray-500 mb-4"></i>
                <p id="cart-description" className="text-gray-300 mb-4">{t("cart.emptyCart")}</p>
                <Link href="/#products">
                  <Button 
                    variant="outline" 
                    className="border-accent text-accent hover:bg-accent hover:text-primary"
                    onClick={closeCart}
                  >
                    {t("cart.startShopping")}
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <span id="cart-description" className="sr-only">{t("cart.itemsInCart")}</span>
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center mb-4 pb-4 border-b border-gray-800"
                  >
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded" 
                    />
                    <div className="ml-4 flex-grow">
                      <h4 className="font-medium">{item.product.name}</h4>
                      {item.size && (
                        <span className="text-sm text-gray-400 mr-2">
                          Size: {item.size}
                        </span>
                      )}
                      <div className="flex items-center mt-1">
                        <button
                          className="text-xs text-gray-400 hover:text-accent"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <span className="text-sm text-gray-400 mx-2">
                          {item.quantity} x
                        </span>
                        <button
                          className="text-xs text-gray-400 hover:text-accent"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <div className="text-accent text-sm">
                        {formatUsdToStonks(item.product.price * item.quantity, currentPrice)}
                      </div>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-white ml-2"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
          
          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-accent/30">
              {/* Subtotal */}
              <div className="flex justify-between mb-4">
                <span className="font-medium">{t("cart.total")}</span>
                <div className="text-right">
                  <div className="font-medium text-accent">{formatUsdToStonks(totalPrice, currentPrice)}</div>
                </div>
              </div>
              
              {/* Checkout Button */}
              <Link href="/checkout">
                <Button 
                  className="w-full bg-accent text-primary py-3 rounded-lg font-medium hover:bg-white transition-colors duration-300"
                  onClick={closeCart}
                >
                  {t("cart.checkout")}
                </Button>
              </Link>
              
              {/* Continue Shopping */}
              <Button 
                variant="outline"
                className="w-full mt-3 border border-accent text-accent py-2 rounded-lg font-medium hover:bg-accent/10 transition-colors duration-300"
                onClick={closeCart}
              >
                {t("cart.continueShopping")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
