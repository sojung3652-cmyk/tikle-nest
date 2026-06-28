import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { signUp } from "@/app/actions/auth";
import { AUTH_STRINGS } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import styles from "../auth.module.css";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const lang = await getLang();
  const s = AUTH_STRINGS[lang];

  async function action(formData: FormData) {
    "use server";
    const result = await signUp(formData);
    if (result?.error) {
      redirect(`/signup?error=${encodeURIComponent(result.error)}`);
    }
    if (result?.message) {
      redirect(`/signin?message=${encodeURIComponent(result.message)}`);
    }
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backBtn} href="/signin">{s.back}</Link>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={styles.wordmark}>{s.tikle_nest}</span>
        </div>

        <h1 className={styles.title}>{s.signup_title}</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">{s.name_label}</label>
            <input
              className={styles.input}
              id="name"
              name="name"
              type="text"
              placeholder={s.name_placeholder}
              autoComplete="name"
              required
            />
          </div>
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
            <PasswordInput id="password" name="password" autoComplete="new-password" minLength={6} />
          </div>
          <button className={styles.submit} type="submit">{s.submit_signup}</button>
        </form>

        <p className={styles.footer}>
          {s.have_account}{" "}
          <Link className={styles.link} href="/signin">{s.signin_link}</Link>
        </p>
      </div>
    </div>
  );
}
