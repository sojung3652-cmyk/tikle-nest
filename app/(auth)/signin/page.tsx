import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { signIn } from "@/app/actions/auth";
import styles from "../auth.module.css";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const result = await signIn(formData);
    if (result?.error) {
      redirect(`/signin?error=${encodeURIComponent(result.error)}`);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={styles.wordmark}>Tikle Nest</span>
        </div>

        <h1 className={styles.title}>Sign in</h1>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <form action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
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
            <label className={styles.label} htmlFor="password">Password</label>
            <PasswordInput id="password" name="password" autoComplete="current-password" />
          </div>
          <button className={styles.submit} type="submit">Sign in</button>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link className={styles.link} href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
