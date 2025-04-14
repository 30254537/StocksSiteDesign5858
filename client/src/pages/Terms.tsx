import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto py-20 px-4">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-accent">
          {t("footer.terms")}
        </h1>
        
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="mb-6">
            欢迎使用 STONKS DEX 周边商店。使用本网站即表示您同意以下条款。
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">使用限制</h2>
          <p className="mb-6">
            您不得使用本网站进行任何非法活动，包括但不限于欺诈、侵权等。
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">订单和支付</h2>
          <p className="mb-6">
            所有订单需使用 $STONKS 代币支付，我们保留取消订单的权利。
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">责任限制</h2>
          <p className="mb-6">
            我们不对因使用本网站而导致的任何损失负责。
          </p>
          
          <p className="mt-8">
            如有疑问，请通过 <a href="mailto:stonksdex-shop@gmail.com" className="text-accent hover:underline">stonksdex-shop@gmail.com</a> 联系我们。
          </p>
        </div>
      </section>
    </div>
  );
}