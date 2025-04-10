import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AudioProvider } from "@/contexts/AudioContext";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Manage from "@/pages/Manage";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import AdminLogin from "@/pages/AdminLogin";
import About from "@/pages/About";
import Music from "@/pages/Music";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartModal from "@/components/ui/cart-modal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout-success" component={CheckoutSuccess} />
      <Route path="/manage" component={Manage} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/about" component={About} />
      <Route path="/music" component={Music} />
      <Route path="/admin-stonks-dex-secret-login" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <AudioProvider>
            <div className="flex flex-col min-h-screen bg-nightblue">
              <Header />
              <main className="flex-grow">
                <Router />
              </main>
              <Footer />
              <CartModal />
            </div>
            <Toaster />
          </AudioProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
