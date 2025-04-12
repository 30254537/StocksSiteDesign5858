import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CartItemWithProduct } from '@shared/schema';
import { calculateCartTotals } from '@/lib/utils';

interface CartContextType {
  cartItems: CartItemWithProduct[];
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
  totalEthPrice: number;
  addToCart: (productId: number, quantity: number, size?: string) => Promise<void>;
  updateCart: (itemId: number, quantity: number, size?: string) => Promise<void>;
  removeCartItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalEthPrice, setTotalEthPrice] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cart', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Cart data:', data); // Debugging
        setCartItems(data);
        
        const { totalItems, totalPrice, totalEthPrice } = calculateCartTotals(data);
        setTotalItems(totalItems);
        setTotalPrice(totalPrice);
        setTotalEthPrice(totalEthPrice);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "Could not load your cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const refreshCart = async () => {
    await fetchCartItems();
  };

  const addToCart = async (productId: number, quantity: number, size?: string) => {
    try {
      setIsLoading(true);
      console.log('Adding to cart:', { productId, quantity, size }); // Debugging
      const response = await apiRequest('POST', '/api/cart', {
        productId,
        quantity,
        size
      });
      
      console.log('Add to cart response:', response.status); // Debugging
      
      if (response.ok) {
        // Removed toast notification as per user request
        
        // Force a delay before refreshing to ensure server has updated
        setTimeout(async () => {
          await refreshCart();
          // Open the cart to show the added item
          openCart();
        }, 500);
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: "Error",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCart = async (itemId: number, quantity: number, size?: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('PUT', `/api/cart/${itemId}`, {
        quantity,
        size
      });
      
      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast({
        title: "Error",
        description: "Could not update cart item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeCartItem = async (itemId: number) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('DELETE', `/api/cart/${itemId}`, undefined);
      
      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      toast({
        title: "Error",
        description: "Could not remove item from cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('DELETE', '/api/cart', undefined);
      
      if (response.ok) {
        setCartItems([]);
        setTotalItems(0);
        setTotalPrice(0);
        setTotalEthPrice(0);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Could not clear cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        totalItems,
        totalPrice,
        totalEthPrice,
        addToCart,
        updateCart,
        removeCartItem,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
