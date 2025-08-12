"use client";

import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function Footer({ footer }: { footer: FooterType }) {
  const [showContactCard, setShowContactCard] = useState(false);
  const t = useTranslations("contact_modal");

  if (footer.disabled) {
    return null;
  }

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContactCard(true);
  };

  return (
    <section id={footer.name} className="py-16 relative">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-11"
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-3xl font-semibold">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-6 text-md text-muted-foreground">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-6 text-muted-foreground">
                  {footer.social.items?.map((item, i) => (
                    <li key={i} className="font-medium hover:text-primary">
                      <a href={item.url} target={item.target}>
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:grid md:grid-cols-3 lg:grid-cols-3 lg:gap-20">
              {footer.nav?.items?.map((item, i) => (
                <div key={i} className="flex-shrink-0 md:flex-shrink">
                  <p className="mb-6 font-bold">{item.title}</p>
                  <ul className="flex flex-wrap gap-4 md:space-y-4 md:flex-col md:gap-0 text-sm text-muted-foreground">
                    {item.children?.map((iitem, ii) => (
                      <li key={ii} className="font-medium hover:text-primary">
                        {iitem.title === "联系我们" || iitem.title === "Contact Us" ? (
                          <button 
                            onClick={handleContactClick}
                            className="cursor-pointer"
                          >
                            {iitem.title}
                          </button>
                        ) : (
                          <a 
                            href={iitem.url} 
                            target={iitem.target}
                          >
                            {iitem.title}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>
                {footer.copyright}
                {/* {process.env.NEXT_PUBLIC_SHOW_POWERED_BY === "false" ? null : (
                  <a
                    href="https://shipany.ai"
                    target="_blank"
                    className="px-2 text-primary"
                  >
                    build with ShipAny
                  </a>
                )} */}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="hover:text-primary">
                    <a href={item.url} target={item.target}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>

      {/* 联系我们卡片 */}
      {showContactCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowContactCard(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("title")}</CardTitle>
                <button
                  onClick={() => setShowContactCard(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={t("close")}
                >
                  <Icon name="RiCloseLine" className="size-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t("description")}
              </CardDescription>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {t("official_email")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
