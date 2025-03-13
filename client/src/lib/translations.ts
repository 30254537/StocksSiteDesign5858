type TranslationKey = string;

interface Translations {
  [key: string]: {
    [key in TranslationKey]: string;
  };
}

export const translations: Translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.about": "About Us",
    "nav.community": "Community",
    
    // Hero Section
    "hero.title": "Trade Decentralized, Wear the Future",
    "hero.subtitle": "Explore STONKS DEX exclusive merchandise",
    "hero.cta": "Shop Now",
    
    // Products Section
    "products.title": "Featured Products",
    "products.all": "All",
    "products.clothing": "Clothing",
    "products.digital": "Digital Items",
    "products.accessories": "Accessories",
    "products.loadMore": "Load More",
    "products.price": "Price:",
    "products.quickView": "Quick View",
    
    // Product Details
    "product.description": "Description:",
    "product.size": "Size:",
    "product.quantity": "Quantity:",
    "product.addToCart": "Add to Cart",
    "product.globalShipping": "Global Shipping",
    "product.returnPolicy": "30-Day Return Policy",
    "product.cryptoPayment": "Cryptocurrency Payment",
    "product.secureTransaction": "Secure Transaction",
    
    // Cart
    "cart.title": "Shopping Cart",
    "cart.total": "Total:",
    "cart.checkout": "Checkout",
    "cart.continueShopping": "Continue Shopping",
    "cart.emptyCart": "Your cart is empty",
    "cart.startShopping": "Start Shopping",
    
    // Checkout
    "checkout.title": "Checkout",
    "checkout.summary": "Order Summary",
    "checkout.paymentMethod": "Payment Method",
    "checkout.creditCard": "Credit Card",
    "checkout.crypto": "Cryptocurrency (ETH)",
    "checkout.placeOrder": "Place Order",
    "checkout.backToCart": "Back to Cart",
    "checkout.successTitle": "Order Successful!",
    "checkout.successMessage": "Thank you for your purchase. Your order has been placed successfully.",
    "checkout.orderNumber": "Order Number:",
    "checkout.continueShopping": "Continue Shopping",
    
    // Footer
    "footer.about": "A blockchain-based decentralized trading platform offering exclusive limited merchandise for cryptocurrency enthusiasts.",
    "footer.quickLinks": "Quick Links",
    "footer.tradingPlatform": "Trading Platform",
    "footer.nftMarketplace": "NFT Marketplace",
    "footer.community": "Community Forum",
    "footer.faq": "FAQ",
    "footer.contactUs": "Contact Us",
    "footer.subscribeTitle": "Subscribe to Updates",
    "footer.subscribeDescription": "Subscribe to our newsletter to receive the latest product and promotional information.",
    "footer.email": "Your Email",
    "footer.subscribe": "Subscribe",
    "footer.copyright": "© 2023 STONKS DEX. All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Use",
    "footer.refund": "Refund Policy",
    
    // Audio
    "audio.play": "Play background music",
    "audio.pause": "Pause background music",
    "audio.notSupported": "Your browser does not support the audio element.",
    "cart.itemsInCart": "Items in your cart"
  },
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.products": "产品",
    "nav.about": "关于我们",
    "nav.community": "社区",
    
    // Hero Section
    "hero.title": "Trade Decentralized, Wear the Future",
    "hero.subtitle": "探索 STONKS DEX 独家周边产品",
    "hero.cta": "立即购买",
    
    // Products Section
    "products.title": "精选周边",
    "products.all": "全部",
    "products.clothing": "服饰",
    "products.digital": "数字藏品",
    "products.accessories": "配件",
    "products.loadMore": "加载更多",
    "products.price": "价格:",
    "products.quickView": "快速查看",
    
    // Product Details
    "product.description": "描述:",
    "product.size": "尺寸:",
    "product.quantity": "数量:",
    "product.addToCart": "加入购物车",
    "product.globalShipping": "全球配送",
    "product.returnPolicy": "30天退换政策",
    "product.cryptoPayment": "加密货币支付",
    "product.secureTransaction": "安全交易",
    
    // Cart
    "cart.title": "购物车",
    "cart.total": "总计:",
    "cart.checkout": "结账",
    "cart.continueShopping": "继续购物",
    "cart.emptyCart": "您的购物车是空的",
    "cart.startShopping": "开始购物",
    
    // Checkout
    "checkout.title": "结账",
    "checkout.summary": "订单摘要",
    "checkout.paymentMethod": "支付方式",
    "checkout.creditCard": "信用卡",
    "checkout.crypto": "加密货币 (ETH)",
    "checkout.placeOrder": "提交订单",
    "checkout.backToCart": "返回购物车",
    "checkout.successTitle": "订单成功！",
    "checkout.successMessage": "感谢您的购买。您的订单已成功提交。",
    "checkout.orderNumber": "订单号:",
    "checkout.continueShopping": "继续购物",
    
    // Footer
    "footer.about": "基于区块链技术的去中心化交易平台，为加密货币爱好者提供独家限量周边产品。",
    "footer.quickLinks": "快速链接",
    "footer.tradingPlatform": "交易平台",
    "footer.nftMarketplace": "NFT 市场",
    "footer.community": "社区论坛",
    "footer.faq": "常见问题",
    "footer.contactUs": "联系我们",
    "footer.subscribeTitle": "订阅更新",
    "footer.subscribeDescription": "订阅我们的通讯，了解最新产品和促销信息。",
    "footer.email": "您的邮箱",
    "footer.subscribe": "订阅",
    "footer.copyright": "© 2023 STONKS DEX. 保留所有权利。",
    "footer.privacy": "隐私政策",
    "footer.terms": "使用条款",
    "footer.refund": "退款政策",
    
    // Audio
    "audio.play": "播放背景音乐",
    "audio.pause": "暂停背景音乐",
    "audio.notSupported": "您的浏览器不支持音频元素。",
    "cart.itemsInCart": "购物车中的商品"
  }
};

export const defaultLanguage = 'zh';

export function getTranslation(key: TranslationKey, language: string): string {
  if (!translations[language] || !translations[language][key]) {
    // Fallback to the default language
    if (translations[defaultLanguage] && translations[defaultLanguage][key]) {
      return translations[defaultLanguage][key];
    }
    // Return the key if translation is not found
    return key;
  }
  return translations[language][key];
}
