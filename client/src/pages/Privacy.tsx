import { useLanguage } from "@/contexts/LanguageContext";

export default function Privacy() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto py-20 px-4">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-accent">
          {t("footer.privacy")}
        </h1>
        
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="mb-6">
            我们非常重视您的隐私。本隐私政策说明了 STONKS DEX 如何收集、使用和保护您的个人信息。
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">信息收集</h2>
          <p className="mb-6">
            我们可能会收集您提供的电子邮件地址（例如通过订阅表单）以及订单信息（例如购物车数据）。
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">信息使用</h2>
          <p className="mb-6">
            我们使用您的信息来处理订单、发送更新通知以及改进我们的服务。
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">信息保护</h2>
          <p className="mb-6">
            我们采取合理的安全措施保护您的信息，但无法完全保证数据传输的安全性。
          </p>
          
          <p className="mt-8">
            如有任何疑问，请通过 <a href="mailto:stonksdex-shop@gmail.com" className="text-accent hover:underline">stonksdex-shop@gmail.com</a> 联系我们。
          </p>
        </div>
      </section>
    </div>
  );
}