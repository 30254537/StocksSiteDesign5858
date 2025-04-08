import { Product } from "@shared/schema";

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  ethPrice: number;
  imageUrl: string;
  quantity: number;
  size?: string | null;
}

export function getCartItems(): CartItem[] {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error parsing cart data:', error);
    return [];
  }
}

export function getCartItemCount(): number {
  return getCartItems().length;
}

export function addToCart(product: Product, quantity: number = 1, size?: string): void {
  try {
    const cart = getCartItems();
    const existingItemIndex = cart.findIndex(item => 
      item.productId === product.id && (size === undefined || item.size === size)
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        id: Date.now(), // Generate a temporary ID
        productId: product.id,
        name: product.name,
        price: product.price,
        ethPrice: product.ethPrice,
        imageUrl: product.imageUrl,
        quantity,
        size: size || null,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
}

export function updateCartItemQuantity(itemId: number, quantity: number): void {
  try {
    const cart = getCartItems();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        cart.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart[itemIndex].quantity = quantity;
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
  }
}

export function removeFromCart(itemId: number): void {
  try {
    const cart = getCartItems();
    const updatedCart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  } catch (error) {
    console.error('Error removing item from cart:', error);
  }
}

export function clearCart(): void {
  localStorage.setItem('cart', JSON.stringify([]));
}

export function calculateCartTotal(): { totalPrice: number; totalEthPrice: number } {
  const cart = getCartItems();
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalEthPrice = cart.reduce((sum, item) => sum + (item.ethPrice * item.quantity), 0);
  
  return { totalPrice, totalEthPrice };
}