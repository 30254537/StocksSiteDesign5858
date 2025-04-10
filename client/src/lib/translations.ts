import { useState, useEffect, useCallback } from 'react';

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
    "nav.products": "Merchandise",
    "nav.manage": "Management",
    "nav.about": "About Us",
    "nav.community": "Community",
    
    // Hero Section
    "hero.title": "Trade Decentralized, Wear the Future",
    "hero.subtitle": "Explore STONKS DEX exclusive merchandise",
    "hero.cta": "Shop with $STONKS",
    
    // Products Section
    "products.title": "Featured Products",
    "products.all": "All",
    "products.clothing": "Clothing",
    "products.digital": "Digital Items",
    "products.accessories": "Accessories",
    "products.loadMore": "Load More",
    "products.price": "Price:",
    "products.quickView": "Quick View",
    "products.viewDetails": "View Details",
    
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
    "checkout.cryptocurrency": "Cryptocurrency (STONKS)",
    "checkout.placeOrder": "Place Order",
    "checkout.payNow": "Pay Now",
    "checkout.confirmPayment": "Confirm Payment",
    "checkout.processing": "Processing...",
    "checkout.backToCart": "Back to Cart",
    "checkout.subtotal": "Subtotal",
    "checkout.shipping": "Shipping",
    "checkout.free": "Free",
    "checkout.total": "Total",
    "checkout.orEthereum": "Or pay with STONKS",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.enterShippingAddress": "Enter your shipping address",
    "checkout.sendEthToAddress": "Send STONKS to address",
    "checkout.amountToSend": "Amount to send",
    "checkout.transactionHash": "Transaction Hash",
    "checkout.enterTransactionHash": "Enter the transaction hash after sending STONKS",
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
    "footer.tradingPlatform": "STONKS DEX",
    "footer.nftMarketplace": "MY STONKS",
    "footer.community": "Community Forum",
    "footer.faq": "FAQ",
    "footer.contactUs": "Contact Us",
    "footer.subscribeTitle": "Subscribe to Updates",
    "footer.subscribeDescription": "Subscribe to our newsletter to receive the latest product and promotional information.",
    "footer.email": "Your Email",
    "footer.subscribe": "Subscribe",
    "footer.copyright": "© 2025 STONKS DEX SHOP. All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Use",
    "footer.refund": "Refund Policy",
    
    // Audio
    "audio.play": "Play background music",
    "audio.pause": "Pause background music",
    "audio.notSupported": "Your browser does not support the audio element.",
    "audio.settings": "Music settings",
    "audio.settingsTitle": "Music Settings",
    "audio.settingsDescription": "Choose music source or enter a YouTube link to customize background music.",
    "audio.linkFormats": "Supported YouTube link formats: youtu.be/ID or youtube.com/watch?v=ID",
    "audio.cancel": "Cancel",
    "audio.save": "Save",
    "audio.localMusic": "Local Music (Default)",
    "audio.youtubeMusic": "YouTube Music",
    "cart.itemsInCart": "Items in your cart",
    
    // Music Page
    "music.title": "STONKS Music Hub",
    "music.subtitle": "Discover the rhythm of blockchain",
    "music.uploadTitle": "Upload Your Tracks",
    "music.dragDrop": "Drag and drop audio files here",
    "music.browse": "Browse Files",
    "music.uploading": "Uploading...",
    "music.upload": "Upload",
    "music.cancel": "Cancel",
    "music.tracksTitle": "Featured Tracks",
    "music.allTracks": "All Tracks",
    "music.newReleases": "New Releases",
    "music.trending": "Trending",
    "music.adminTitle": "Music Management",
    "music.fileName": "File Name",
    "music.trackTitle": "Track Title",
    "music.artist": "Artist",
    "music.duration": "Duration",
    "music.actions": "Actions",
    "music.delete": "Delete",
    "music.edit": "Edit",
    "music.save": "Save Changes",
    "music.uploadSuccess": "Music uploaded successfully",
    "music.uploadError": "Failed to upload music",
    "music.defaultTitle": "STONKS Music",
    "music.defaultArtist": "DEX Music Lab"
  },
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.products": "周边产品",
    "nav.manage": "后台管理",
    "nav.about": "关于我们",
    "nav.community": "社区",
    
    // Hero Section
    "hero.title": "Trade Decentralized, Wear the Future",
    "hero.subtitle": "探索 STONKS DEX SHOP 独家周边产品",
    "hero.cta": "用 $STONKS 代币购物",
    
    // Products Section
    "products.title": "精选周边",
    "products.all": "全部",
    "products.clothing": "服饰",
    "products.digital": "数字藏品",
    "products.accessories": "配件",
    "products.loadMore": "加载更多",
    "products.price": "价格:",
    "products.quickView": "快速查看",
    "products.viewDetails": "查看详情",
    
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
    "checkout.cryptocurrency": "加密货币 (STONKS)",
    "checkout.placeOrder": "提交订单",
    "checkout.payNow": "立即支付",
    "checkout.confirmPayment": "确认支付",
    "checkout.processing": "处理中...",
    "checkout.backToCart": "返回购物车",
    "checkout.subtotal": "小计",
    "checkout.shipping": "运费",
    "checkout.free": "免费",
    "checkout.total": "总计",
    "checkout.orEthereum": "或使用STONKS支付",
    "checkout.shippingAddress": "收货地址",
    "checkout.enterShippingAddress": "请输入您的收货地址",
    "checkout.sendEthToAddress": "发送STONKS到地址",
    "checkout.amountToSend": "发送金额",
    "checkout.transactionHash": "交易哈希",
    "checkout.enterTransactionHash": "发送STONKS后输入交易哈希",
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
    "footer.tradingPlatform": "STONKS DEX",
    "footer.nftMarketplace": "MY STONKS",
    "footer.community": "社区论坛",
    "footer.faq": "常见问题",
    "footer.contactUs": "联系我们",
    "footer.subscribeTitle": "订阅更新",
    "footer.subscribeDescription": "订阅我们的通讯，了解最新产品和促销信息。",
    "footer.email": "您的邮箱",
    "footer.subscribe": "订阅",
    "footer.copyright": "© 2025 STONKS DEX SHOP. 保留所有权利。",
    "footer.privacy": "隐私政策",
    "footer.terms": "使用条款",
    "footer.refund": "退款政策",
    
    // Audio
    "audio.play": "播放背景音乐",
    "audio.pause": "暂停背景音乐",
    "audio.notSupported": "您的浏览器不支持音频元素。",
    "audio.settings": "音乐设置",
    "audio.settingsTitle": "音乐设置",
    "audio.settingsDescription": "选择音乐来源或输入YouTube链接来自定义背景音乐。",
    "audio.linkFormats": "支持 YouTube 链接格式: youtu.be/ID 或 youtube.com/watch?v=ID",
    "audio.cancel": "取消",
    "audio.save": "保存",
    "audio.localMusic": "本地音乐 (默认)",
    "audio.youtubeMusic": "YouTube 音乐",
    "cart.itemsInCart": "购物车中的商品",
    
    // Music Page
    "music.title": "STONKS 音乐中心",
    "music.subtitle": "探索区块链的节奏",
    "music.uploadTitle": "上传你的音乐",
    "music.dragDrop": "拖放音频文件至此",
    "music.browse": "浏览文件",
    "music.uploading": "上传中...",
    "music.upload": "上传",
    "music.cancel": "取消",
    "music.tracksTitle": "精选歌曲",
    "music.allTracks": "全部歌曲",
    "music.newReleases": "最新发布",
    "music.trending": "热门趋势",
    "music.adminTitle": "音乐管理",
    "music.fileName": "文件名",
    "music.trackTitle": "歌曲名称",
    "music.artist": "艺术家",
    "music.duration": "时长",
    "music.actions": "操作",
    "music.delete": "删除",
    "music.edit": "编辑",
    "music.save": "保存更改",
    "music.uploadSuccess": "音乐上传成功",
    "music.uploadError": "音乐上传失败",
    "music.defaultTitle": "STONKS 音乐",
    "music.defaultArtist": "DEX 音乐实验室"
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

// 获取用户首选语言，默认使用中文
export function getUserLanguage(): string {
  const storedLanguage = localStorage.getItem('language');
  if (storedLanguage && ['en', 'zh'].includes(storedLanguage)) {
    return storedLanguage;
  }
  return defaultLanguage;
}

// 设置用户语言选择
export function setUserLanguage(language: string): void {
  if (['en', 'zh'].includes(language)) {
    localStorage.setItem('language', language);
  }
}

// 翻译Hook

export function useTranslation() {
  const [language, setLanguage] = useState(getUserLanguage());

  // 加载时读取用户语言设置
  useEffect(() => {
    setLanguage(getUserLanguage());
  }, []);

  // 切换语言
  const changeLanguage = useCallback((newLanguage: string) => {
    if (['en', 'zh'].includes(newLanguage)) {
      setUserLanguage(newLanguage);
      setLanguage(newLanguage);
    }
  }, []);

  // 翻译函数
  const t = useCallback((key: TranslationKey) => {
    return getTranslation(key, language);
  }, [language]);

  return { t, language, changeLanguage };
}
