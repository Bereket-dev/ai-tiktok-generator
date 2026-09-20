import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function LocaleResultRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/result/${id}`);
}
