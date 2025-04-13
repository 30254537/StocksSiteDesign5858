import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send the email to a backend service
    toast({
      title: "Success",
      description: "You've been subscribed to our newsletter",
      variant: "default"
    });
    
    setEmail("");
  };

  return (
    <footer className="bg-primary border-t border-accent/30 text-gray-300 pt-16 pb-8 relative z-30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-xl font-orbitron font-medium mb-4 text-white">STONKS DEX</h3>
            <p className="mb-4 text-sm leading-relaxed">{t("footer.about")}</p>
            <div className="flex space-x-4 text-accent">
              <a href="https://x.com/MyStonks_Org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300">
                <i className="fa-brands fa-x"></i>
              </a>
              <a href="https://discord.com/invite/YfBHj2Qc" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300">
                <i className="fa-brands fa-discord"></i>
              </a>
              <a href="https://t.me/STONKSOPEN" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300">
                <i className="fa-brands fa-telegram"></i>
              </a>
              <Link 
                to="/music" 
                className="hover:text-white transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  // 使用前端路由导航而不是刷新页面
                  window.history.pushState({}, '', '/music');
                  // 触发页面内容重新加载，但不是整页刷新
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  // 滚动到顶部
                  window.scrollTo({
                    top: 0,
                    behavior: 'instant'
                  });
                }}
              >
                <i className="fa-solid fa-music"></i>
              </Link>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xl font-orbitron font-medium mb-4 text-white">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://mystonks.org/pc/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-300">
                  {t("footer.tradingPlatform")}
                </a>
              </li>
              <li>
                <a href="https://mystonks.org/pc/index.html" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-300">
                  {t("footer.nftMarketplace")}
                </a>
              </li>
              <li>
                <a href="https://t.me/STONKSOPEN" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-300">
                  {t("footer.community")}
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-accent transition-colors duration-300">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-accent transition-colors duration-300">
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Contact */}
          <div>
            <h3 className="text-xl font-orbitron font-medium mb-4 text-white">联系我们</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="text-accent mr-2">📧</span>
                <span className="text-white">support@stonksdex.io</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">📍</span>
                <span className="text-white">新加坡, 区块大厦 #42-01</span>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-xl font-orbitron font-medium mb-4 text-white">{t("footer.subscribeTitle")}</h3>
            <p className="mb-4 text-sm">{t("footer.subscribeDescription")}</p>
            <form className="flex subscribe-form" action="https://your-mailchimp-url" method="post" target="_blank">
              <Input
                type="email"
                name="EMAIL"
                placeholder={t("footer.email")}
                required
                className="bg-secondary text-white border border-accent/30 rounded-l-lg px-4 py-2 focus:outline-none focus:border-accent w-full"
              />
              <Button 
                type="submit"
                className="bg-accent text-primary px-4 rounded-r-lg hover:bg-white transition-colors duration-300"
              >
                📩
              </Button>
            </form>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">{t("footer.copyright")}</p>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy" className="hover:text-accent transition-colors duration-300">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-accent transition-colors duration-300">
              {t("footer.terms")}
            </Link>
            <a href="#" className="hover:text-accent transition-colors duration-300">
              {t("footer.refund")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
