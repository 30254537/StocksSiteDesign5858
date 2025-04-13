import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="py-20 px-4 md:px-8 lg:px-16 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#00ffcc]">{t("about.title")}</h1>
        
        <div className="prose prose-sm md:prose-base lg:prose-lg prose-invert prose-headings:text-[#00ffcc] prose-a:text-[#00ffcc] hover:prose-a:text-[#00ffcc]/70">
          <div dangerouslySetInnerHTML={{ __html: t("about.content") }} />
        </div>
        
        {/* Team Section */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#00ffcc]">{t("about.teamTitle")}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-primary/30 border border-accent/20 p-6 rounded-lg hover:bg-accent/5 transition-colors">
              <h3 className="text-xl font-semibold mb-2">DEV 001</h3>
              <p className="text-gray-300 mb-4">{t("about.dev001Role")}</p>
              <p className="text-sm">{t("about.dev001Description")}</p>
            </div>
            
            <div className="bg-primary/30 border border-accent/20 p-6 rounded-lg hover:bg-accent/5 transition-colors">
              <h3 className="text-xl font-semibold mb-2">TRADER 025</h3>
              <p className="text-gray-300 mb-4">{t("about.trader025Role")}</p>
              <p className="text-sm">{t("about.trader025Description")}</p>
            </div>
            
            <div className="bg-primary/30 border border-accent/20 p-6 rounded-lg hover:bg-accent/5 transition-colors">
              <h3 className="text-xl font-semibold mb-2">ARTIST 108</h3>
              <p className="text-gray-300 mb-4">{t("about.artist108Role")}</p>
              <p className="text-sm">{t("about.artist108Description")}</p>
            </div>
          </div>
        </div>
        
        {/* Community Section */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#00ffcc]">{t("about.communityTitle")}</h2>
          
          <div className="bg-primary/30 border border-accent/20 p-8 rounded-lg">
            <p className="mb-6">{t("about.communityDescription")}</p>
            
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>{t("about.communityPoint1")}</li>
              <li>{t("about.communityPoint2")}</li>
              <li>{t("about.communityPoint3")}</li>
              <li>{t("about.communityPoint4")}</li>
            </ul>
            
            <div className="mt-8">
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank"
                className="bg-accent text-primary px-6 py-3 rounded-md font-medium hover:bg-white transition-colors"
              >
                {t("about.joinTelegram")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}