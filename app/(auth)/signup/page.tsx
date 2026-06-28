import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import { signUp } from "@/app/actions/auth";
import styles from "../auth.module.css";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={styles.wordmark}>Tikle Nest</span>
        </div>

        <h1 className={styles.title}>Create account</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Your name</label>
            <input
              className={styles.input}
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Kim"
              autoComplete="name"
              required
            />
          </div>
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
            <PasswordInput id="password" name="password" autoComplete="new-password" minLength={6} />
          </div>
          <button className={styles.submit} type="submit">Create account</button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link className={styles.link} href="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
