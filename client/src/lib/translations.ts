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
    "nav.activities": "Community Activities",
    "nav.myOrders": "My Orders",
    "nav.orderLookup": "Order Lookup",
    
    // Order Lookup
    "orderLookup.title": "Order Lookup",
    "orderLookup.description": "Enter your order number and email to check your order status",
    "orderLookup.orderNumber": "Order Number",
    "orderLookup.orderNumberPlaceholder": "Enter your order number",
    "orderLookup.email": "Email",
    "orderLookup.emailPlaceholder": "Enter your email address",
    "orderLookup.submit": "Look Up Order",
    "orderLookup.error": "No order found with the provided information",
    "orderLookup.success": "Order found!",
    
    // Form Validation Errors
    "validation.required": "This field is required",
    "validation.email": "Invalid email address",
    "validation.minLength": "This field is too short",
    
    // Orders
    "orders.title": "My Orders",
    "orders.orderList": "Order List",
    "orders.totalOrders": "Total Orders",
    "orders.orderDetails": "Order Details",
    "orders.viewDetails": "Order Details",
    "orders.orderNumber": "Order Number",
    "orders.selectToView": "Select an order to view details",
    "orders.date": "Order Date",
    "orders.paymentMethod": "Payment Method",
    "orders.total": "Total Amount",
    "orders.totalAmount": "Total Amount",
    "orders.shipping": "Shipping Address",
    "orders.shippingAddress": "Shipping Address",
    "orders.trackingNumber": "Tracking Number",
    "orders.transactionHash": "Transaction Hash",
    "orders.items": "Order Items",
    "orders.orderItems": "Order Items",
    "orders.quantity": "Quantity:",
    "orders.status.pending": "Pending",
    "orders.status.processing": "Processing",
    "orders.status.shipped": "Shipped",
    "orders.backToHome": "Back to Home",
    "orders.status.delivered": "Delivered",
    "orders.status.completed": "Completed",
    "orders.status.cancelled": "Cancelled",
    "orders.status.refunded": "Refunded",
    "orders.status.paid": "Paid",
    
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
    "product.inStock": "In Stock",
    "product.onlyLeft": "Only {0} left",
    
    // About Us
    "about.title": "About Us",
    "about.content": "STONKS DEX SHOP is the pioneer and hub of blockchain community culture, committed to building a decentralized ecosystem for every user through technological innovation and cultural connection. We not only provide carefully designed merchandise but also create unlimited possibilities for users to explore the blockchain world through interactive experiences and community activities. We proudly announce that My STONKS, our community's decentralized trading platform, has officially launched in test mode! This marks a historic step for the STONKS DEX ecosystem. My STONKS is not just a trading platform but a symbol of community co-creation—every community member holding $STONKS tokens is a shareholder of My STONKS, participating in the platform's governance and development. We believe blockchain's true value lies in the united power of decentralization. Through My STONKS, we empower every user with the right to participate in decision-making and shape the platform's future together. This 'everyone is a shareholder' model demonstrates our firm commitment to community trust and collaboration, making us stand out in the blockchain space. At STONKS DEX SHOP, community has always been our core driving force. We connect global blockchain enthusiasts through online and offline activities, interactive platforms, and exclusive merchandise, encouraging users to participate in technological innovation and cultural exchange. We hope that every product and every interaction can become a bridge for users to connect more deeply with the blockchain world. Our team consists of members who love blockchain and are passionate about community building. We listen to users' voices, continuously optimize products and services, and bring you a better experience. Choosing STONKS DEX SHOP means not just buying a product but joining a vibrant community with possibilities, witnessing the co-building of My STONKS and exploring the future of blockchain with us. We firmly believe that through unity and collaboration, we can create community culture and value, opening a new chapter of decentralization. Let's join hands and write the next page of the blockchain world together! Join our <a href='https://t.me/STONKSOPEN' target='_blank'>Telegram Community</a>, acquire $STONKS, STONKS TO THE MOON!",
    
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
    "checkout.itemsInCart": "item(s) in cart",
    "checkout.payment": "Payment",
    "checkout.choosePaymentMethod": "Choose payment method",
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
    "checkout.sendUsdtTo": "Send USDT to this address:",
    "checkout.selectUsdtNetwork": "Select USDT Network:",
    "checkout.walletAddress": "Wallet Address:",
    "checkout.copy": "Copy",
    "checkout.copiedToClipboard": "Copied to clipboard",
    "checkout.sendTokensToAddress": "Send STONKS to address",
    "checkout.amountToSend": "Amount to send:",
    "checkout.transactionHash": "Transaction Hash",
    "checkout.transactionHashPlaceholder": "Enter the transaction hash after sending STONKS",
    "checkout.transactionHashHint": "Enter the transaction hash after sending",
    "checkout.shippingAddressRequired": "Shipping address is required",
    "checkout.emailRequired": "Email address is required for order notifications",
    "checkout.securePayment": "All payments are securely encrypted",
    "checkout.paymentError": "Payment Error",
    "checkout.transactionHashRequired": "Transaction hash is required",
    "checkout.cryptoPaymentError": "Error processing cryptocurrency payment",
    "checkout.unableToProcessPayment": "Unable to process your payment",
    "checkout.paymentSuccessful": "Payment Successful",
    "checkout.orderPlacedSuccessfully": "Your order has been successfully placed",
    "checkout.orderError": "Order Error",
    "checkout.paymentSuccessButOrderError": "Payment successful but there was an error creating your order",
    "checkout.emptyCart": "Your cart is empty",
    "checkout.pleaseAddItems": "Please add items to your cart first",
    "checkout.errorCreatingPayment": "Error creating payment",
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
    "footer.about": "A blockchain community hub and merchandise store connecting cryptocurrency enthusiasts worldwide through exclusive products and blockchain interactions.",
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
    
    // Community Activities 
    "nav.cryptoNews": "Community Activities",
    
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
    "cryptoNews.title": "Community Activities",
    "cryptoNews.featured": "Featured",
    "cryptoNews.readMore": "Read More",
    "cryptoNews.allNews": "All Activities",
    "cryptoNews.error": "Error fetching activities",
    "cryptoNews.noNews": "No activities available",
    "cryptoNews.stayUpdated": "Follow us for more community updates",
    
    // Team Section
    "about.teamTitle": "Team Members",
    "about.dev001Title": "DEV 001",
    "about.dev001Role": "Chief Developer",
    "about.dev001Description": "STONKS DEX core developer, responsible for the smart contracts and blockchain interactions of the decentralized STONKS DEX.",
    "about.trader025Title": "TRADER 025",
    "about.trader025Role": "Trading Strategist", 
    "about.trader025Description": "Capital market expert and DEX liquidity provider, designing optimal trading paths and strategies for STONKS DEX.",
    "about.artist108Title": "ARTIST 108",
    "about.artist108Role": "Creative Director",
    "about.artist108Description": "Responsible for all STONKS DEX merchandise design concepts, creating a unique decentralized brand image.",
    "about.communityTitle": "Community",
    "about.communityDescription": "STONKS DEX SHOP is community-driven, with members playing a crucial role in developing our blockchain community ecosystem.",
    "about.communityPoint1": "Participate in platform governance by holding $STONKS tokens",
    "about.communityPoint2": "Get discounts and early access to exclusive merchandise",
    "about.communityPoint3": "Join community events including airdrops, mining challenges, and merchandise design contests",
    "about.communityPoint4": "Provide feedback and suggestions for improving the STONKS DEX SHOP blockchain community ecosystem",
    "about.joinTelegram": "Join our Telegram Community",
    
    // Contact Info
    "contact.supportEmail": "support@stonksdexshop.com",
    "contact.companyAddress": "Singapore, Blockchain Tower #42-01",
    "contact.title": "Contact Information",
    "contact.name": "Name:",
    "contact.nameRequired": "Name:",
    "contact.namePlaceholder": "Enter your name",
    "contact.email": "Email:", 
    "contact.emailRequired": "Email: *",
    "contact.emailPlaceholder": "Enter your email address",
    "contact.emailHint": "Used for order confirmation and status updates",
    "contact.phone": "Phone:",
    "contact.phonePlaceholder": "Enter your phone number",
    "contact.address": "Shipping Address:",
    "contact.addressRequired": "Shipping Address: *",
    "contact.addressPlaceholder": "Enter your shipping address",
    
    
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
    "product.name.10": "STONKS DEX Custom Sneakers",
    "product.name.11": "STONKS DEX Beach Towel",
    "product.name.12": "STONKS DEX Water Bottle",
    "product.name.13": "STONKS DEX Phone Case",
    "product.name.14": "STONKS DEX Laptop Sleeve",
    "product.name.15": "STONKS DEX Mug",
    "product.name.16": "STONKS DEX Hoodie",
    "product.name.17": "STONKS DEX Trading Card Set",
    "product.name.18": "STONKS DEX Baseball Cap",
    "product.name.19": "STONKS DEX Custom Nike Shoes",
    "product.name.20": "STONKS DEX Limited Edition Jacket",
    "product.backToProducts": "Back to Products",
    
    // Product Descriptions
    "product.description.1": "Premium hoodie featuring the KUBE logo. Made with high-quality materials for comfort and style.",
    "product.description.2": "Classic baseball cap design with the DEX logo embroidered on the front. Adjustable size suits all occasions.",
    "product.description.3": "STONKS DEX official T-shirt made from 100% organic cotton. Features DEX logo on front.",
    "product.description.5": "Premium Bitcoin-themed STONKS hoodie with high-quality fabric. Features STONKS and BTC graphics on front and back.",
    "product.description.6": "High-quality STONKS collectible poster featuring iconic crypto art perfect for your wall.",
    "product.description.7": "High-resolution printed poster featuring STONKS DEX branded imagery and logo elements.",
    "product.description.8": "Limited Edition NFT collectible. Digital asset with provable scarcity on the blockchain.",
    "product.description.15": "STONKS DEX branded ceramic mug. Perfect for your morning coffee while checking crypto prices.",
    "product.description.16": "Premium quality hoodie with STONKS DEX logo. Warm and comfortable for crypto trading in any weather.",
    "product.description.17": "Collectible trading card set featuring STONKS DEX characters and crypto themes.",
    "product.description.18": "Adjustable baseball cap with embroidered STONKS DEX logo. Perfect for casual wear.",
    "product.description.19": "Custom Nike shoes with STONKS DEX branding. Limited edition collaboration with Nike.",
    "product.description.20": "Limited edition jacket featuring STONKS DEX premium design. Water-resistant with inner pockets."
  },
  zh: {
    // Product Descriptions
    "product.description.5": "高品质比特币主题STONKS连帽衫，采用优质面料。前后印有STONKS和BTC图案。",
    // Navigation
    "nav.home": "首页",
    "nav.products": "周边产品",
    "nav.manage": "后台管理",
    "nav.about": "关于我们",
    "nav.activities": "社区活动",
    "nav.myOrders": "我的订单",
    "nav.orderLookup": "订单查询",
    
    // Order Lookup
    "orderLookup.title": "订单查询",
    "orderLookup.description": "输入您的订单号和邮箱查询订单状态",
    "orderLookup.orderNumber": "订单号",
    "orderLookup.orderNumberPlaceholder": "输入您的订单号",
    "orderLookup.email": "邮箱",
    "orderLookup.emailPlaceholder": "输入您的邮箱地址",
    "orderLookup.submit": "查询订单",
    "orderLookup.error": "未找到符合提供信息的订单",
    "orderLookup.success": "已找到订单!",
    
    // Form Validation Errors
    "validation.required": "此字段为必填项",
    "validation.email": "无效的邮箱地址",
    "validation.minLength": "此字段太短",
    
    // Orders
    "orders.title": "我的订单",
    "orders.orderList": "订单列表",
    "orders.totalOrders": "订单总数",
    "orders.orderDetails": "订单详情",
    "orders.viewDetails": "订单详情",
    "orders.orderNumber": "订单号",
    "orders.selectToView": "选择一个订单查看详情",
    "orders.date": "下单日期",
    "orders.paymentMethod": "支付方式",
    "orders.total": "总金额",
    "orders.totalAmount": "总金额",
    "orders.shipping": "收货地址",
    "orders.shippingAddress": "收货地址",
    "orders.trackingNumber": "物流单号",
    "orders.transactionHash": "交易哈希值",
    "orders.items": "订单商品",
    "orders.orderItems": "订单商品",
    "orders.quantity": "数量:",
    "orders.status.pending": "待付款",
    "orders.status.processing": "处理中",
    "orders.status.shipped": "已发货",
    "orders.status.delivered": "已送达",
    "orders.status.completed": "已完成",
    "orders.status.cancelled": "已取消",
    "orders.status.refunded": "已退款",
    "orders.status.paid": "已支付",
    "orders.backToHome": "返回首页",
    
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
    "product.inStock": "有货",
    "product.onlyLeft": "仅剩 {0} 件",
    
    // About Us
    "about.title": "关于我们",
    "about.content": "STONKS DEX SHOP 是区块链社区文化的先锋与枢纽，致力于通过技术创新和文化连接，打造一个属于每一位用户的去中心化生态。我们不仅提供精心设计的周边产品，更通过互动体验和社区活动，赋予用户探索区块链世界的无限可能。我们自豪地宣布，属于我们社区的去中心化交易平台 My STONKS 已正式测试上线！这标志着 STONKS DEX 生态迈出了历史性的一步。My STONKS 不仅是一个交易平台，更是社区共建的象征——每一位持有 $STONKS 代币的社区成员都是 My STONKS 的股东，共同参与平台的治理与发展。我们相信，区块链的真正价值在于去中心化的团结力量，通过 My STONKS，我们赋予每一位用户参与决策的权利，共同塑造平台的未来。这种「人人都是股东」的模式，体现了我们对社区信任与协作的坚定承诺，也让我们在区块链领域中独树一帜。在 STONKS DEX SHOP，社区始终是我们的核心驱动力。我们通过线上线下活动、互动平台以及独家周边，连接全球区块链爱好者，鼓励用户参与技术创新与文化交流。我们希望每一件产品、每一次互动，都能成为用户与区块链世界更深层连接的桥梁。我们的团队由一群热爱区块链、热衷于社区建设的成员组成，我们倾听用户的声音，不断优化产品与服务，为您带来更优质的体验。选择 STONKS DEX SHOP，您不仅是在购买一件产品，更是在加入一个充满活力与可能的社区，与我们一起见证共建 My STONKS，探索区块链的未来。我们坚信，通过团结与协作，我们能够创造属于社区的文化与价值，开启去中心化的全新篇章。让我们携手，共同书写区块链世界的下一页！加入我们的 <a href='https://t.me/STONKSOPEN' target='_blank'>Telegram 社区</a>，获取 $STONKS，STONKS TO THE MOON！",
    
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
    "checkout.sendUsdtTo": "发送USDT到地址:",
    "checkout.selectUsdtNetwork": "选择USDT网络:",
    "checkout.walletAddress": "钱包地址:",
    "checkout.copy": "复制",
    "checkout.copiedToClipboard": "已复制到剪贴板",
    "checkout.sendTokensToAddress": "发送STONKS到地址",
    "checkout.amountToSend": "发送金额",
    "checkout.transactionHash": "交易哈希值",
    "checkout.transactionHashPlaceholder": "发送STONKS后输入交易哈希",
    "checkout.transactionHashHint": "发送后输入交易哈希",
    "checkout.shippingAddressRequired": "请提供收货地址",
    "checkout.emailRequired": "请提供电子邮箱，以便我们联系您",
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
    "footer.about": "基于区块链的社区中心和周边商店，通过独家产品和区块链互动连接全球加密货币爱好者。",
    "footer.quickLinks": "快速链接",
    "footer.tradingPlatform": "",
    "footer.nftMarketplace": "",
    "footer.community": "电报社区",
    "footer.goldDogMonitor": "金狗监测",
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
    "music.title": "STONKS",
    "music.subtitle": "MUSIC\n探索区块链的节奏",
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
    "nav.cryptoNews": "社区活动",
    "cryptoNews.title": "社区活动",
    "cryptoNews.featured": "置顶活动",
    "cryptoNews.readMore": "了解更多",
    "cryptoNews.allNews": "全部活动",
    "cryptoNews.error": "获取社区活动失败",
    "cryptoNews.noNews": "暂无社区活动",
    "cryptoNews.stayUpdated": "关注我们以获取更多社区活动信息",
    
    // Team Section
    "about.teamTitle": "团队成员",
    "about.dev001Title": "DEV 001",
    "about.dev001Role": "首席开发官",
    "about.dev001Description": "STONKS DEX核心开发者，负责去中心化STONKS DEX的智能合约和区块链交互。",
    "about.trader025Title": "TRADER 025",
    "about.trader025Role": "交易策略师", 
    "about.trader025Description": "资深交易员和DEX流动性提供者，为STONKS DEX设计最佳交易路径和策略。",
    "about.artist108Title": "ARTIST 108",
    "about.artist108Role": "创意总监",
    "about.artist108Description": "负责所有STONKS DEX周边的设计创意，打造独特的去中心化品牌形象。",
    "about.communityTitle": "社区",
    "about.communityDescription": "STONKS DEX SHOP由社区驱动，社区成员在我们的区块链社区生态系统发展中扮演着重要角色。",
    "about.communityPoint1": "通过持有$STONKS代币参与平台治理",
    "about.communityPoint2": "获取独家周边商品的折扣和早期访问权限",
    "about.communityPoint3": "参与社区活动，包括空投、挖矿挑战和周边设计比赛",
    "about.communityPoint4": "为 STONKS DEX SHOP 区块链社区生态系统的改进提供反馈和建议",
    "about.joinTelegram": "加入我们的Telegram社区",
    
    // Contact Info
    "contact.supportEmail": "support@stonksdexshop.com",
    "contact.companyAddress": "新加坡, 区块链大厦 #42-01",
    "contact.title": "联系信息",
    "contact.name": "姓名:",
    "contact.nameRequired": "姓名:",
    "contact.namePlaceholder": "请输入您的姓名",
    "contact.email": "电子邮箱:", 
    "contact.emailRequired": "电子邮箱: *",
    "contact.emailPlaceholder": "请输入您的电子邮箱",
    "contact.emailHint": "用于接收订单确认和状态更新",
    "contact.phone": "联系电话:",
    "contact.phonePlaceholder": "请输入您的联系电话",
    "contact.address": "联系地址:",
    "contact.addressRequired": "联系地址: *",
    "contact.addressPlaceholder": "请输入您的联系地址"
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
  // 仅在开发环境输出调试信息
  if (import.meta.env.DEV) {
    console.log(`获取翻译, 键: ${key}, 语言: ${language}`);
  }
  
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
    return translationCache[cacheKey];
  }
  
  // 如果当前语言有此翻译，则返回
  if (translations[validLanguage] && translations[validLanguage][key] !== undefined) {
    const translation = translations[validLanguage][key];
    // 只缓存非产品名称的翻译
    if (!key.startsWith('product.name.')) {
      translationCache[cacheKey] = translation;
    }
    return translation;
  }
  
  // 否则尝试使用默认语言
  if (translations[defaultLanguage] && translations[defaultLanguage][key] !== undefined) {
    const translation = translations[defaultLanguage][key];
    // 只缓存非产品名称的翻译
    if (!key.startsWith('product.name.')) {
      translationCache[cacheKey] = translation;
    }
    return translation;
  }
  
  // 如果都没有，返回键名
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

// 创建语言上下文对象
const currentLanguageRef = { current: getUserLanguage() };

// 高性能翻译Hook
export function useTranslation() {
  const [language, setLanguage] = useState(currentLanguageRef.current);
  
  // 预计算语言选择的影响，减少页面切换时的计算负担
  useEffect(() => {
    // 确保我们有一致的内部状态
    setLanguage(getUserLanguage());
    
    // 注册语言变更监听器
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language') {
        const newLang = getUserLanguage();
        currentLanguageRef.current = newLang;
        setLanguage(newLang);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 切换语言 - 优化版本
  const changeLanguage = useCallback((newLanguage: string) => {
    if (['en', 'zh'].includes(newLanguage) && newLanguage !== language) {
      setUserLanguage(newLanguage);
      currentLanguageRef.current = newLanguage;
      setLanguage(newLanguage);
      
      // 触发存储事件，让其他组件知道语言变更了
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'language',
        newValue: newLanguage
      }));
    }
  }, [language]);

  // 翻译函数 - 使用记忆化避免不必要的重新渲染
  const t = useCallback((key: TranslationKey, fallback?: string) => {
    return getTranslation(key, language);
  }, [language]);

  return { t, language, changeLanguage };
}
