import { redirect } from "next/navigation";

/** Old /[locale]/snap → root camera */
export default function SnapRedirect() {
  redirect("/");
}
