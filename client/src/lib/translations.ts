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
    "checkout.creditCard": "USDT",
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
    "checkout.orCrypto": "",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.enterShippingAddress": "Enter your shipping address",
    "checkout.sendTokensToAddress": "Send STONKS to address",
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
    "music.defaultArtist": "DEX Music Lab",
    
    // STONKS Price
    "stonksPrice.loading": "Loading...",
    "stonksPrice.error": "Price unavailable",
    "stonksPrice.currentPrice": "Current Price",
    "stonksPrice.equivalentAmount": "Equivalent",
    "stonksPrice.converter": "USDT to STONKS Converter",
    "stonksPrice.contract": "Contract Address",
    
    // Crypto News
    "nav.cryptoNews": "Crypto News",
    
    // Crypto Tweets
    "cryptoTweets.title": "Trending Crypto Tweets",
    "cryptoTweets.trending": "Latest Tweets",
    "cryptoTweets.popular": "Popular",
    "cryptoTweets.contracts": "Contract Addresses",
    "cryptoTweets.noTweets": "No tweets found",
    "cryptoTweets.noContractTweets": "No contract address tweets found",
    "cryptoTweets.error": "Failed to load tweets",
    "cryptoTweets.viewAll": "View All Tweets",
    "cryptoTweets.translated": "Translated from English",
    "cryptoNews.title": "Cryptocurrency News",
    "cryptoNews.featured": "Featured",
    "cryptoNews.readMore": "Read More",
    "cryptoNews.allNews": "All News",
    "cryptoNews.error": "Error fetching news",
    "cryptoNews.noNews": "No news available",
    "cryptoNews.stayUpdated": "Follow us for more crypto updates",
    
    // Contact Info
    "contact.email": "support@stonksdex.io",
    "contact.address": "Singapore, Blockchain Tower #42-01",
    
    // Product Names
    "product.name.1": "KUBE Hoodie",
    "product.name.2": "DEX Baseball Cap",
    "product.name.3": "STONKS DEX T-shirt",
    "product.name.4": "DEX Sticker Set",
    "product.name.5": "STONKS BTC Hoodie",
    "product.name.6": "STONKS Poster",
    "product.name.7": "STONKS Poster",
    "product.name.8": "Limited NFT",
    "product.name.9": "STONKS Hoodie",
    "product.name.10": "STONKS DEX Custom Sneakers"
  },
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.products": "周边产品",
    "nav.manage": "后台管理",
    "nav.about": "关于我们",
    "nav.community": "社区",
    
    // Product Names
    "product.name.1": "KUBE 连帽衫",
    "product.name.2": "DEX 棒球帽",
    "product.name.3": "STONKS DEX T恤",
    "product.name.4": "DEX 贴纸套装",
    "product.name.5": "STONKS BTC 连帽衫",
    "product.name.6": "STONKS 海报",
    "product.name.7": "STONKS 海报",
    "product.name.8": "限量版 NFT",
    "product.name.9": "STONKS 连帽衫",
    "product.name.10": "STONKS DEX 定制运动鞋",
    
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
    "checkout.creditCard": "USDT",
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
    "checkout.orCrypto": "",
    "checkout.shippingAddress": "收货地址",
    "checkout.enterShippingAddress": "请输入您的收货地址",
    "checkout.sendTokensToAddress": "发送STONKS到地址",
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
    "music.title": "STONKS 音乐藏库",
    "music.subtitle": "探索区块链的节奏",
    "music.uploadTitle": "上传你的音乐",
    "music.dragDrop": "拖放音频文件至此",
    "music.browse": "浏览文件",
    "music.uploading": "上传中...",
    "music.upload": "上传",
    "music.cancel": "取消",
    "music.tracksTitle": "精选曲目",
    "music.allTracks": "全部歌曲",
    "music.newReleases": "最新发布",
    "music.trending": "热门音乐",
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
    "music.defaultArtist": "DEX 音乐实验室",
    
    // STONKS Price
    "stonksPrice.loading": "加载中...",
    "stonksPrice.error": "价格不可用",
    "stonksPrice.currentPrice": "当前价格",
    "stonksPrice.equivalentAmount": "等价金额",
    "stonksPrice.converter": "USDT转STONKS换算器",
    "stonksPrice.contract": "合约地址",
    
    // Crypto Tweets
    "cryptoTweets.title": "热门加密推文",
    "cryptoTweets.trending": "最新推文",
    "cryptoTweets.popular": "热门推文",
    "cryptoTweets.contracts": "合约地址",
    "cryptoTweets.noTweets": "暂无推文",
    "cryptoTweets.noContractTweets": "暂无合约地址推文",
    "cryptoTweets.error": "无法加载推文",
    "cryptoTweets.viewAll": "查看全部",
    "cryptoTweets.translated": "已从英文翻译",
    
    // Crypto News
    "nav.cryptoNews": "加密新闻",
    "cryptoNews.title": "加密货币新闻",
    "cryptoNews.featured": "置顶新闻",
    "cryptoNews.readMore": "阅读更多",
    "cryptoNews.allNews": "全部新闻",
    "cryptoNews.error": "获取新闻失败",
    "cryptoNews.noNews": "暂无可用新闻",
    "cryptoNews.stayUpdated": "关注我们以获取更多加密货币更新",
    
    // Contact Info
    "contact.email": "support@stonksdex.io",
    "contact.address": "新加坡, 区块链大厦 #42-01"
  }
};

export const defaultLanguage = 'zh';

// 本地缓存已加载的翻译，避免重复获取
const translationCache: { [key: string]: string } = {};

// 清除翻译缓存的函数，可以清除特定前缀的缓存或全部
export function clearTranslationCache(keyPrefix?: string): void {
  if (keyPrefix) {
    // 清除特定前缀的缓存
    Object.keys(translationCache).forEach(key => {
      if (key.includes(keyPrefix)) {
        delete translationCache[key];
        console.log(`清除翻译缓存: ${key}`);
      }
    });
  } else {
    // 清除所有缓存
    Object.keys(translationCache).forEach(key => {
      delete translationCache[key];
    });
    console.log('已清除所有翻译缓存');
  }
}

export function getTranslation(key: TranslationKey, language: string): string {
  // 添加调试信息
  console.log(`获取翻译, 键: ${key}, 语言: ${language}`);
  
  // 确保 language 是有效值
  const validLanguage = ['en', 'zh'].includes(language) ? language : defaultLanguage;
  
  // 生成缓存键
  const cacheKey = `${validLanguage}:${key}`;
  
  // 对于产品名称相关的键，始终跳过缓存
  if (key.startsWith('product.name.')) {
    // 对产品名称不使用缓存，始终获取最新数据
  } 
  // 其他键使用缓存
  else if (translationCache[cacheKey] !== undefined) {
    console.log(`翻译请求 - 键: ${key}, 语言: ${language}, 结果: ${translationCache[cacheKey]} (缓存)`);
    return translationCache[cacheKey];
  }
  
  // 如果当前语言有此翻译，则返回
  if (translations[validLanguage] && translations[validLanguage][key] !== undefined) {
    const translation = translations[validLanguage][key];
    // 只缓存非产品名称的翻译
    if (!key.startsWith('product.name.')) {
      translationCache[cacheKey] = translation;
    }
    console.log(`翻译请求 - 键: ${key}, 语言: ${language}, 结果: ${translation}`);
    return translation;
  }
  
  // 否则尝试使用默认语言
  if (translations[defaultLanguage] && translations[defaultLanguage][key] !== undefined) {
    const translation = translations[defaultLanguage][key];
    // 只缓存非产品名称的翻译
    if (!key.startsWith('product.name.')) {
      translationCache[cacheKey] = translation;
    }
    console.log(`翻译请求 - 键: ${key}, 语言: ${language}, 结果: ${translation} (默认语言)`);
    return translation;
  }
  
  // 如果都没有，返回键名
  console.log(`翻译请求 - 键: ${key}, 语言: ${language}, 结果: ${key} (未找到翻译)`);
  return key;
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
  const t = useCallback((key: TranslationKey, fallback?: string) => {
    return getTranslation(key, language);
  }, [language]);

  return { t, language, changeLanguage };
}
