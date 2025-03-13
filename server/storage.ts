import { 
  products, type Product, type InsertProduct,
  cartItems, type CartItem, type InsertCartItem,
  type CartItemWithProduct
} from "@shared/schema";

export interface IStorage {
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart operations
  getCartItems(sessionId: string): Promise<CartItemWithProduct[]>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  getCartItemByProductAndSession(productId: number, sessionId: string): Promise<CartItem | undefined>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, size?: string): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private productId: number;
  private cartItemId: number;

  constructor() {
    this.products = new Map();
    this.cartItems = new Map();
    this.productId = 1;
    this.cartItemId = 1;
    
    // Initialize with some products
    this.initializeProducts();
  }

  // Initialize default products
  private initializeProducts() {
    const defaultProducts: InsertProduct[] = [
      {
        name: "STONKS T恤",
        description: "独家设计的STONKS DEX T恤，采用100%有机棉制作，舒适透气。正面印有标志性的STONKS图案和品牌logo。",
        price: 25,
        ethPrice: 0.01,
        category: "clothing",
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 50
      },
      {
        name: "DEX 棒球帽",
        description: "经典棒球帽设计，前面绣有DEX标志，可调节大小，适合各种场合佩戴。",
        price: 20,
        ethPrice: 0.008,
        category: "clothing",
        imageUrl: "https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 30
      },
      {
        name: "限量 NFT",
        description: "STONKS DEX限量版NFT，独特的数字艺术品，存储在以太坊区块链上，拥有永久所有权证明。",
        price: 50,
        ethPrice: 0.02,
        category: "digital",
        imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 10
      },
      {
        name: "STONKS 马克杯",
        description: "高质量陶瓷马克杯，印有STONKS DEX标志，容量350ml，微波炉和洗碗机安全。",
        price: 15,
        ethPrice: 0.006,
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1577155436706-6dc10102977f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 40
      },
      {
        name: "STONKS 连帽衫",
        description: "高品质连帽卫衣，保暖舒适，前胸印有STONKS DEX标志，袖口和下摆采用罗纹设计。",
        price: 45,
        ethPrice: 0.018,
        category: "clothing",
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 25
      },
      {
        name: "DEX 贴纸套装",
        description: "一套10张高品质乙烯基贴纸，包含各种STONKS DEX相关设计，防水耐用。",
        price: 10,
        ethPrice: 0.004,
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 100
      },
      {
        name: "STONKS 海报",
        description: "高清印刷海报，采用优质纸张，展示STONKS DEX标志性图像和品牌元素。",
        price: 18,
        ethPrice: 0.007,
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1561059544-105d204c2913?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 60
      },
      {
        name: "DEX 数字壁纸",
        description: "高分辨率数字壁纸套装，包含5张不同设计，适用于各种设备的屏幕。",
        price: 5,
        ethPrice: 0.002,
        category: "digital",
        imageUrl: "https://images.unsplash.com/photo-1640390939772-bd12aa7cb160?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 999
      }
    ];

    defaultProducts.forEach(product => this.createProduct(product));
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.category === category
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  // Cart methods
  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const items = Array.from(this.cartItems.values()).filter(
      item => item.sessionId === sessionId
    );
    
    // Join with products
    return items.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }
      return { ...item, product };
    });
  }

  async getCartItem(id: number): Promise<CartItem | undefined> {
    return this.cartItems.get(id);
  }

  async getCartItemByProductAndSession(productId: number, sessionId: string): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values()).find(
      item => item.productId === productId && item.sessionId === sessionId
    );
  }

  async createCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemId++;
    const newCartItem: CartItem = { ...cartItem, id };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }

  async updateCartItem(id: number, quantity: number, size?: string): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) {
      return undefined;
    }
    
    const updatedCartItem: CartItem = { 
      ...cartItem, 
      quantity,
      size: size || cartItem.size
    };
    
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const itemsToDelete = Array.from(this.cartItems.values())
      .filter(item => item.sessionId === sessionId)
      .map(item => item.id);
    
    itemsToDelete.forEach(id => this.cartItems.delete(id));
    return true;
  }
}

export const storage = new MemStorage();
