import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "You";

  let html = readFileSync(
    join(process.cwd(), "household-ledger.html"),
    "utf-8"
  );

  // Inject user context + sign-out chip into topbar
  const contextScript = `<script>
window.__TN_USER__ = ${JSON.stringify({ name: displayName, id: user?.id ?? "" })};
document.addEventListener("DOMContentLoaded", function () {
  var target = document.querySelector(".topbar-right") || document.querySelector(".topbar");
  if (!target || !window.__TN_USER__) return;
  var chip = document.createElement("div");
  chip.style.cssText = "display:flex;align-items:center;gap:8px;flex-shrink:0";
  chip.innerHTML =
    '<span style="font-size:13px;color:var(--ink-soft)">' +
    window.__TN_USER__.name +
    "</span>" +
    '<button onclick="fetch(\\'/api/signout\\',{method:\\'POST\\'}).then(function(){location.href=\\'/signin\\'})" ' +
    'style="border:1px solid var(--mist);background:var(--paper);color:var(--ink-soft);border-radius:999px;padding:5px 12px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">Sign out</button>';
  target.appendChild(chip);
});
</script>`;

  html = html.replace("</head>", contextScript + "\n</head>");

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
