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
    "nav.manage": "Management",
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
    
    // About Us
    "about.title": "About Us",
    "about.content": "Welcome to the STONKS DEX merchandise universe—the ultimate decentralized gear station! STONKS DEX is a community-driven decentralized exchange platform that enables everyone to freely trade, hold $STONKS, and participate in the DeFi revolution. We launched this independent merchandise store to bring the STONKS spirit into the real world—from T-shirts to NFTs, every product is inspired and supported by the $STONKS community. There is no fiat currency here, only $STONKS—unlock exclusive merchandise with our native token and truly embrace the power of decentralization. Join our <a href='https://t.me/STONKSOPEN' target='_blank'>Telegram community</a>, get $STONKS, and wear gear that belongs to the future. STONKS TO THE MOON!",
    
    // Cart
    "cart.title": "Shopping Cart",
    "cart.total": "Total:",
    "cart.checkout": "Checkout",
    "cart.continueShopping": "Continue Shopping",
    "cart.emptyCart": "Your cart is empty",
    "cart.startShopping": "Start Shopping",
    
    // Checkout
    "checkout.title": "Checkout",
    "checkout.orderSummary": "Order Summary",
    "checkout.itemsInCart": "items in cart",
    "checkout.payment": "Payment",
    "checkout.choosePaymentMethod": "Choose your payment method",
    "checkout.paymentMethod": "Payment Method",
    "checkout.creditCard": "Credit Card",
    "checkout.cryptocurrency": "Cryptocurrency (ETH)",
    "checkout.placeOrder": "Place Order",
    "checkout.payNow": "Pay Now",
    "checkout.confirmPayment": "Confirm Payment",
    "checkout.processing": "Processing...",
    "checkout.backToCart": "Back to Cart",
    "checkout.subtotal": "Subtotal",
    "checkout.shipping": "Shipping",
    "checkout.free": "Free",
    "checkout.total": "Total",
    "checkout.orEthereum": "Or pay with Ethereum",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.enterShippingAddress": "Enter your shipping address",
    "checkout.sendEthToAddress": "Send ETH to address",
    "checkout.amountToSend": "Amount to send",
    "checkout.transactionHash": "Transaction Hash",
    "checkout.enterTransactionHash": "Enter the transaction hash after sending ETH",
    "checkout.securePayment": "All payments are secure and encrypted",
    "checkout.paymentError": "Payment Error",
    "checkout.transactionHashRequired": "Transaction hash is required",
    "checkout.cryptoPaymentError": "Error processing cryptocurrency payment",
    "checkout.unableToProcessPayment": "Unable to process your payment",
    "checkout.paymentSuccessful": "Payment Successful",
    "checkout.orderPlacedSuccessfully": "Your order has been placed successfully",
    "checkout.orderError": "Order Error",
    "checkout.paymentSuccessButOrderError": "Payment was successful but there was an error creating your order",
    "checkout.emptyCart": "Empty Cart",
    "checkout.pleaseAddItems": "Please add items to your cart before proceeding to checkout",
    "checkout.errorCreatingPayment": "Error Creating Payment",
    "checkout.pleaseTryAgainLater": "Please try again later",
    
    // Checkout Success
    "checkoutSuccess.orderComplete": "Order Complete!",
    "checkoutSuccess.thankYou": "Thank you for your purchase from STONKS DEX Merchandise Store",
    "checkoutSuccess.whatsNext": "What's Next?",
    "checkoutSuccess.emailConfirmation": "You will receive an email confirmation with your order details",
    "checkoutSuccess.shipmentInfo": "We will notify you when your order ships",
    "checkoutSuccess.continueShopping": "Continue Shopping",
    "checkoutSuccess.viewOrders": "View My Orders",
    
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
    "nav.manage": "后台管理",
    "nav.about": "关于我们",
    "nav.community": "社区",
    
    // Hero Section
    "hero.title": "Trade Decentralized, Wear the Future",
    "hero.subtitle": "探索 STONKS DEX SHOP 独家周边产品",
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
    
    // About Us
    "about.title": "关于我们",
    "about.content": "欢迎来到 STONKS DEX SHOP 的周边宇宙——去中心化的终极装备站！STONKS DEX 是一个由社区驱动的去中心化交易平台，让每个人都能自由交易、持有 $STONKS 并参与 DeFi 革命。我们推出这个独立销售网站，把 STONKS 的精神带到现实世界——从 T 恤到 NFT，每件产品都由 $STONKS 社区启发和支持。这里没有法币，只有 $STONKS——用我们的原生代币解锁独家周边，真正拥抱去中心化的力量。加入我们的 <a href='https://t.me/STONKSOPEN' target='_blank'>Telegram 社区</a>，获取 $STONKS，穿上属于未来的装备。STONKS TO THE MOON！",
    
    // Cart
    "cart.title": "购物车",
    "cart.total": "总计:",
    "cart.checkout": "结账",
    "cart.continueShopping": "继续购物",
    "cart.emptyCart": "您的购物车是空的",
    "cart.startShopping": "开始购物",
    
    // Checkout
    "checkout.title": "结账",
    "checkout.orderSummary": "订单摘要",
    "checkout.itemsInCart": "件商品",
    "checkout.payment": "支付",
    "checkout.choosePaymentMethod": "选择支付方式",
    "checkout.paymentMethod": "支付方式",
    "checkout.creditCard": "信用卡",
    "checkout.cryptocurrency": "加密货币 (ETH)",
    "checkout.placeOrder": "提交订单",
    "checkout.payNow": "立即支付",
    "checkout.confirmPayment": "确认支付",
    "checkout.processing": "处理中...",
    "checkout.backToCart": "返回购物车",
    "checkout.subtotal": "小计",
    "checkout.shipping": "运费",
    "checkout.free": "免费",
    "checkout.total": "总计",
    "checkout.orEthereum": "或使用以太坊支付",
    "checkout.shippingAddress": "收货地址",
    "checkout.enterShippingAddress": "请输入您的收货地址",
    "checkout.sendEthToAddress": "发送ETH到地址",
    "checkout.amountToSend": "发送金额",
    "checkout.transactionHash": "交易哈希",
    "checkout.enterTransactionHash": "发送ETH后输入交易哈希",
    "checkout.securePayment": "所有支付均安全加密",
    "checkout.paymentError": "支付错误",
    "checkout.transactionHashRequired": "需要交易哈希",
    "checkout.cryptoPaymentError": "处理加密货币支付时出错",
    "checkout.unableToProcessPayment": "无法处理您的支付",
    "checkout.paymentSuccessful": "支付成功",
    "checkout.orderPlacedSuccessfully": "您的订单已成功提交",
    "checkout.orderError": "订单错误",
    "checkout.paymentSuccessButOrderError": "支付成功但创建订单时出错",
    "checkout.emptyCart": "购物车为空",
    "checkout.pleaseAddItems": "请先添加商品到购物车",
    "checkout.errorCreatingPayment": "创建支付时出错",
    "checkout.pleaseTryAgainLater": "请稍后再试",
    
    // Checkout Success
    "checkoutSuccess.orderComplete": "订单完成！",
    "checkoutSuccess.thankYou": "感谢您在STONKS DEX周边商店的购买",
    "checkoutSuccess.whatsNext": "接下来会发生什么？",
    "checkoutSuccess.emailConfirmation": "您将收到订单确认邮件",
    "checkoutSuccess.shipmentInfo": "商品发货时我们会通知您",
    "checkoutSuccess.continueShopping": "继续购物",
    "checkoutSuccess.viewOrders": "查看我的订单",
    
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
