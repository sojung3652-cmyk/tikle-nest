"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import styles from "./page.module.css";
import { createHousehold, joinHousehold } from "@/app/actions/household";
import { AUTH_STRINGS } from "@/lib/i18n";

const CURRENCIES = [
  { code: "USD", label: "$ US dollar" },
  { code: "KRW", label: "₩ Korean won" },
  { code: "EUR", label: "€ Euro" },
  { code: "GBP", label: "£ British pound" },
  { code: "JPY", label: "¥ Japanese yen" },
  { code: "CAD", label: "C$ Canadian dollar" },
  { code: "AUD", label: "A$ Australian dollar" },
  { code: "SGD", label: "S$ Singapore dollar" },
];

export default function HouseholdPage() {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [lang, setLang] = useState<"en" | "ko">("en");
  const router = useRouter();

  useEffect(() => {
    const l = localStorage.getItem("tn-lang");
    if (l === "ko") setLang("ko");
  }, []);

  const s = AUTH_STRINGS[lang];

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createHousehold(fd);
    if (result?.error) { setError(result.error); setPending(false); }
    else router.push("/");
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await joinHousehold(fd);
    if (result?.error) { setError(result.error); setPending(false); }
    else router.push("/");
  }

  async function handleBack() {
    await fetch("/api/signout", { method: "POST" });
    router.push("/signin");
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={handleBack}>{s.back}</button>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={styles.wordmark}>{s.tikle_nest}</span>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "create" ? styles.tabActive : ""}`}
            onClick={() => { setTab("create"); setError(""); }}
          >
            {s.create_household}
          </button>
          <button
            className={`${styles.tab} ${tab === "join" ? styles.tabActive : ""}`}
            onClick={() => { setTab("join"); setError(""); }}
          >
            {s.join_household}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {tab === "create" && (
          <form onSubmit={handleCreate}>
            <p className={styles.sub}>{s.partner_hint}</p>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">{s.household_name_label}</label>
              <input
                className={styles.input}
                id="name"
                name="name"
                type="text"
                placeholder={s.household_name_ph}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="currency">{s.currency_label}</label>
              <select className={styles.input} id="currency" name="currency">
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "…" : s.submit_create}
            </button>
          </form>
        )}

        {tab === "join" && (
          <form onSubmit={handleJoin}>
            <p className={styles.sub}>{s.join_hint}</p>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="code">{s.invite_code_label}</label>
              <input
                className={`${styles.input} ${styles.codeInput}`}
                id="code"
                name="code"
                type="text"
                placeholder={s.invite_code_ph}
                maxLength={6}
                required
              />
            </div>
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "…" : s.submit_join}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
