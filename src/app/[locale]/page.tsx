import { redirect } from "next/navigation";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

/** Old locale welcome → camera immediately */
export default async function LocaleWelcomeRedirect({ params }: LocalePageProps) {
  await params;
  redirect("/");
}
