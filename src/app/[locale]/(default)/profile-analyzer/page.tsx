import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    robots: 'noindex, nofollow',
  };
}

export default async function ProfileAnalyzerRedirect({ params }: Props) {
  const { locale } = await params;
  
  if (locale) {
    redirect(`/${locale}`);
  } else {
    redirect('/');
  }
} 