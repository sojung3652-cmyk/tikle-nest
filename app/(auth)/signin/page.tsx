import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { signIn } from "@/app/actions/auth";
import { getLang, AUTH_STRINGS } from "@/lib/i18n";
import styles from "../auth.module.css";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const lang = await getLang();
  const s = AUTH_STRINGS[lang];

  async function action(formData: FormData) {
    "use server";
    const result = await signIn(formData);
    if (result?.error) {
      redirect(`/signin?error=${encodeURIComponent(result.error)}`);
    }
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backBtn} href="/signup">{s.back}</Link>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={styles.wordmark}>{s.tikle_nest}</span>
        </div>

        <h1 className={styles.title}>{s.signin_title}</h1>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <form action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">{s.email_label}</label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">{s.password_label}</label>
            <PasswordInput id="password" name="password" autoComplete="current-password" />
          </div>
          <div className={styles.rememberRow}>
            <label className={styles.rememberLabel}>
              <input type="checkbox" name="remember" className={styles.checkbox} />
              {s.remember_me}
            </label>
          </div>
          <button className={styles.submit} type="submit">{s.submit_signin}</button>
        </form>

        <p className={styles.footer}>
          {s.no_account}{" "}
          <Link className={styles.link} href="/signup">{s.signup_link}</Link>
        </p>
      </div>
    </div>
  );
}
