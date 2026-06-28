import { Currency, fmt } from "@/lib/format";
import styles from "./StatStrip.module.css";

interface Props {
  budget: number;
  nec: number;
  opt: number;
  currency: Currency;
}

export default function StatStrip({ budget, nec, opt, currency }: Props) {
  const spent = nec + opt;
  const remaining = budget - spent;
  const isOver = budget > 0 && remaining < 0;

  return (
    <section className={styles.stats}>
      <div className={styles.stat}>
        <div className={styles.k}>Budget</div>
        <div className={styles.v}>{budget > 0 ? fmt(budget, currency) : "—"}</div>
      </div>

      <div className={styles.stat}>
        <div className={styles.k}>Spent</div>
        <div className={styles.v}>{fmt(spent, currency)}</div>
      </div>

      <div className={styles.stat}>
        <div className={styles.k}>Remaining</div>
        <div className={`${styles.v} ${isOver ? styles.overVal : styles.leftVal}`}>
          {budget > 0 ? fmt(remaining, currency) : "—"}
        </div>
      </div>

      <div className={styles.stat}>
        <div className={styles.k}>Flexible (could save)</div>
        <div className={`${styles.v} ${styles.saveVal}`}>
          {fmt(opt, currency)}
        </div>
      </div>
    </section>
  );
}
