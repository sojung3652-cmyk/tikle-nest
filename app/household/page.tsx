"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import styles from "./page.module.css";
import { createHousehold, joinHousehold } from "@/app/actions/household";

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
  const router = useRouter();

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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={styles.wordmark}>Tikle Nest</span>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "create" ? styles.tabActive : ""}`}
            onClick={() => { setTab("create"); setError(""); }}
          >
            Create household
          </button>
          <button
            className={`${styles.tab} ${tab === "join" ? styles.tabActive : ""}`}
            onClick={() => { setTab("join"); setError(""); }}
          >
            Join household
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {tab === "create" && (
          <form onSubmit={handleCreate}>
            <p className={styles.sub}>
              Name your household. Your partner will join using the invite code you&apos;ll get after creating it.
            </p>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">Household name</label>
              <input
                className={styles.input}
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Kim Family"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="currency">Currency</label>
              <select className={styles.input} id="currency" name="currency">
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create household"}
            </button>
          </form>
        )}

        {tab === "join" && (
          <form onSubmit={handleJoin}>
            <p className={styles.sub}>
              Enter the 6-letter invite code from your partner&apos;s household.
            </p>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="code">Invite code</label>
              <input
                className={`${styles.input} ${styles.codeInput}`}
                id="code"
                name="code"
                type="text"
                placeholder="ABC123"
                maxLength={6}
                required
              />
            </div>
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "Joining…" : "Join household"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
