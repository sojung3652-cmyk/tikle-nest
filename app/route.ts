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

  // Inject user context + topbar name/gear chip
  const contextScript = `<script>
window.__TN_USER__ = ${JSON.stringify({ name: displayName, id: user?.id ?? "", email: user?.email ?? "" })};
document.addEventListener("DOMContentLoaded", function () {
  var target = document.querySelector(".topbar-right") || document.querySelector(".topbar");
  if (!target || !window.__TN_USER__) return;
  var chip = document.createElement("div");
  chip.style.cssText = "display:flex;align-items:center;gap:8px;flex-shrink:0";
  chip.innerHTML =
    '<span class="tn-username" style="font-size:13px;color:var(--ink-soft);font-weight:500">' +
    window.__TN_USER__.name +
    '</span>' +
    '<button onclick="if(window.openFullSettings)openFullSettings()" ' +
    'style="border:1px solid var(--mist);background:var(--card);color:var(--ink-soft);border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer;display:grid;place-items:center;font-family:inherit;transition:.15s;flex-shrink:0" ' +
    'title="Settings" aria-label="Settings">⚙</button>';
  target.appendChild(chip);
});
</script>`;

  html = html.replace("</head>", contextScript + "\n</head>");

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
