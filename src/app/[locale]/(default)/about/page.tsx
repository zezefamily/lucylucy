import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/about`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/about`;
  }
  
  return {
    title: t("page_title"),
    description: t("page_description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function About({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  
  return (
    <div className="min-h-screen bg-gradient-fluid relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient-primary mb-6 float-animation">
                {t("title")}
              </h1>
              <div className="absolute -inset-4 bg-gradient-primary rounded-full blur-2xl opacity-20 animate-pulse"></div>
            </div>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* 主要内容 */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-10"></div>
            <div className="relative">
              <div className="card-glass rounded-2xl p-8 md:p-12 space-y-10">
                {/* 使命部分 */}
                <div className="">
                  {/* <h2 className="text-2xl font-semibold mb-6 flex items-center text-gradient-primary">
                    <span className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mr-3 glow-primary">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </span>
                    {t("mission_title")}
                  </h2> */}
                  <p className="text-foreground/80 text-lg leading-relaxed">
                    {t("mission_content")}
                  </p>
                </div>

                {/* 价值观部分 */}
                <div className="">
                  {/* <h2 className="text-2xl font-semibold mb-6 flex items-center text-gradient-primary">
                    <span className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center mr-3 glow-secondary">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                      </svg>
                    </span>
                    {t("values_title")}
                  </h2> */}
                  <p className="text-foreground/80 text-lg leading-relaxed">
                    {t("values_content")}
                  </p>
                </div>

                {/* 承诺部分 */}
                <div className="">
                  {/* <h2 className="text-2xl font-semibold mb-6 flex items-center text-gradient-primary">
                    <span className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center mr-3 glow-accent">
                      <svg className="w-4 h-4 text-accent-green-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </span>
                    {t("commitment_title")}
                  </h2> */}
                  <p className="text-foreground/80 text-lg leading-relaxed">
                    {t("commitment_content")}
                  </p>
                </div>

                {/* 分割线 */}
                <div className="flex items-center">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                  <div className="px-4 text-sm font-medium text-primary">
                    {t("team_section_title")}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                </div>

                {/* 公司介绍 */}
                <div className=" rounded-xl p-6 ">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center text-gradient-primary">
                    <span className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mr-3 glow-primary">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                      </svg>
                    </span>
                    {t("company_title")}
                  </h2>
                  <p className="text-foreground/80 text-lg leading-relaxed mb-4">
                    {t("company_description")}
                  </p>
                  <p className="text-foreground/80 text-lg leading-relaxed">
                    {t("company_philosophy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );
}