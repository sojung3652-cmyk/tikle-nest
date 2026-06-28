import { cookies } from "next/headers";
import type { Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  return cookieStore.get("tn-lang")?.value === "ko" ? "ko" : "en";
}
