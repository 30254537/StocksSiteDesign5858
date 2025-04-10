import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { StonksPriceProvider } from "@/contexts/StonksPriceContext";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";

// 使用懒加载提升应用性能
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const Manage = lazy(() => import("@/pages/ManageNew"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const About = lazy(() => import("@/pages/About"));
const Music = lazy(() => import("@/pages/Music"));
const CryptoNews = lazy(() => import("@/pages/CryptoNews"));
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartModal from "@/components/ui/cart-modal";

// 页面切换加载动画
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// 页面切换动画
const pageVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// 页面包装器，添加平滑动画
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

function Router() {
  const [location] = useLocation();
  
  // 监听路由变化，自动滚动到顶部
  useEffect(() => {
    // 当路由变化时，滚动到页面顶部，除非URL包含哈希锚点
    if (!location.includes('#')) {
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    }
  }, [location]);
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoading />}>
        <Switch key={location}>
          <Route path="/">
            {() => (
              <PageWrapper>
                <Home />
              </PageWrapper>
            )}
          </Route>
          <Route path="/product/:id">
            {(params) => (
              <PageWrapper>
                <ProductDetail id={params.id} />
              </PageWrapper>
            )}
          </Route>
          <Route path="/checkout">
            {() => (
              <PageWrapper>
                <Checkout />
              </PageWrapper>
            )}
          </Route>
          <Route path="/checkout-success">
            {() => (
              <PageWrapper>
                <CheckoutSuccess />
              </PageWrapper>
            )}
          </Route>
          <Route path="/manage">
            {() => (
              <PageWrapper>
                <Manage />
              </PageWrapper>
            )}
          </Route>
          <Route path="/privacy">
            {() => (
              <PageWrapper>
                <Privacy />
              </PageWrapper>
            )}
          </Route>
          <Route path="/terms">
            {() => (
              <PageWrapper>
                <Terms />
              </PageWrapper>
            )}
          </Route>
          <Route path="/about">
            {() => (
              <PageWrapper>
                <About />
              </PageWrapper>
            )}
          </Route>
          <Route path="/music">
            {() => (
              <PageWrapper>
                <Music />
              </PageWrapper>
            )}
          </Route>
          <Route path="/crypto-news">
            {() => (
              <PageWrapper>
                <CryptoNews />
              </PageWrapper>
            )}
          </Route>
          <Route path="/admin-stonks-dex-secret-login">
            {() => (
              <PageWrapper>
                <AdminLogin />
              </PageWrapper>
            )}
          </Route>
          <Route>
            {() => (
              <PageWrapper>
                <NotFound />
              </PageWrapper>
            )}
          </Route>
        </Switch>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  // 预加载常用页面减少延迟
  useEffect(() => {
    const preloadPages = async () => {
      // 预加载首页和关于页面
      await Promise.all([
        import("@/pages/Home"),
        import("@/pages/About"),
        import("@/pages/Music")
      ]);
    };
    
    preloadPages();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <AudioProvider>
            <StonksPriceProvider>
              <div className="flex flex-col min-h-screen bg-nightblue">
                <Header />
                <main className="flex-grow">
                  <Router />
                </main>
                <Footer />
                <CartModal />
              </div>
              <Toaster />
            </StonksPriceProvider>
          </AudioProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
