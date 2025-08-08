import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ, { ModernFAQ } from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import LucyHero from "@/components/blocks/lucy-hero";
import LucyCompatible from "@/components/blocks/lucy-compatible";
import LucyWhyChoose from "@/components/blocks/lucy-why-choose";
import LucyFeatures from "@/components/blocks/lucy-features";
import LucyWhatCanYouDo from "@/components/blocks/lucy-what-can-you-do";
import LucyWhoIsFor from "@/components/blocks/lucy-who-is-for";
import LucyTestimonials from "@/components/blocks/lucy-testimonials";
import LucyFAQ from "@/components/blocks/lucy-faq";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import { getLandingPage } from "@/services/page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);
  const homepageT = await getTranslations("homepage");

  const faqData = [
    {
      question: homepageT("faq.q1_question"),
      answer: homepageT("faq.q1_answer")
    },
    {
      question: homepageT("faq.q2_question"),
      answer: homepageT("faq.q2_answer")
    },
    {
      question: homepageT("faq.q3_question"),
      answer: homepageT("faq.q3_answer")
    },
    {
      question: homepageT("faq.q4_question"),
      answer: homepageT("faq.q4_answer")
    },
    {
      question: homepageT("faq.q5_question"),
      answer: homepageT("faq.q5_answer")
    },
    {
      question: homepageT("faq.q6_question"),
      answer: homepageT("faq.q6_answer")
    },
    {
      question: homepageT("faq.q7_question"),
      answer: homepageT("faq.q7_answer")
    },
    {
      question: homepageT("faq.q8_question"),
      answer: homepageT("faq.q8_answer")
    },
    {
      question: homepageT("faq.q9_question"),
      answer: homepageT("faq.q9_answer")
    },
    {
      question: homepageT("faq.q10_question"),
      answer: homepageT("faq.q10_answer")
    }
  ];

  return (
    <>
      {/* Lucy Hero */}
      <LucyHero />
      {/* Lucy Compatible */}
      <LucyCompatible />
      {/* Why Choose Lucy AI ？ */}
      <LucyWhyChoose />
      {/* Your AI Dating Coach */}
      <LucyFeatures />
      {/* What Can You Do with Lucy AI? */}
      <LucyWhatCanYouDo />
      {/* Who Is Lucy For? */}
      <LucyWhoIsFor />
      {/* What Users Are Saying? */}
      <LucyTestimonials />
      {/* FAQ */}
      {/* 新增的Lucy风格FAQ模块 */}
      <LucyFAQ 
        title={homepageT("faq.title")}
        subtitle={homepageT("faq.subtitle")}
        items={faqData}
      />
    </>
  );
}
