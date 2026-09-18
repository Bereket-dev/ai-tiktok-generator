import { getRequestConfig } from "next-intl/server";

export const locales = ["am", "en"] as const;
export type SupportedLocale = (typeof locales)[number];
export const defaultLocale: SupportedLocale = "am";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as SupportedLocale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
