import { Currency, fmt } from "@/lib/format";
import styles from "./BudgetHero.module.css";

interface Goal {
  note: string;
  target: number;
}

interface Props {
  budget: number;
  nec: number;
  opt: number;
  currency: Currency;
  goal?: Goal;
  onEditBudget?: () => void;
  onEditGoal?: () => void;
  onOpenIncome?: () => void;
  onChangeCurrency?: () => void;
}

export default function BudgetHero({
  budget,
  nec,
  opt,
  currency,
  goal,
  onEditBudget,
  onEditGoal,
  onOpenIncome,
  onChangeCurrency,
}: Props) {
  const spent = nec + opt;
  const remaining = budget - spent;
  const isOver = spent > budget && budget > 0;
  const denom = Math.max(budget, spent, 1);

  // Bar widths — match prototype's render() logic exactly
  const necPct =
    (budget > 0
      ? Math.min(nec, budget) / denom
      : nec / Math.max(spent, 1)) * 100;
  const optPct =
    (budget > 0
      ? Math.min(opt, Math.max(budget - nec, 0)) / denom
      : opt / Math.max(spent, 1)) * 100;
  const overPct = isOver ? ((spent - budget) / denom) * 100 : 0;

  // Goal status line
  let goalText: string;
  if (goal && (goal.note || goal.target > 0)) {
    goalText = "Goal: " + (goal.note || `Save ${fmt(goal.target, currency)}`);
    if (goal.target > 0 && budget > 0) {
      const saved = Math.max(remaining, 0);
      const pct = Math.min(Math.round((saved / goal.target) * 100), 100);
      goalText += ` — ${fmt(saved, currency)} of ${fmt(goal.target, currency)} set aside (${pct}%)`;
    } else if (goal.target > 0) {
      goalText += ` — target ${fmt(goal.target, currency)}`;
    }
  } else {
    goalText = "No goal set this month — tap Goal to add one.";
  }

  return (
    <section className={styles.hero}>
      <div className={styles.heroTop}>
        <div>
          <div className={styles.eyebrow}>Budget this month</div>
          <div className={styles.heroAmount}>
            {budget > 0 ? fmt(budget, currency) : "Not set"}
          </div>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.chipBtn} onClick={onEditBudget}>
            Edit budget
          </button>
          <button className={styles.chipBtn} onClick={onEditGoal}>
            Goal
          </button>
          <button className={styles.chipBtn} onClick={onOpenIncome}>
            Income
          </button>
          <button className={styles.chipBtn} onClick={onChangeCurrency}>
            {currency.sym} {currency.code} ▾
          </button>
        </div>
      </div>

      <div className={styles.bar}>
        <span
          className={`${styles.barSeg} ${styles.segNec}`}
          style={{ width: `${necPct}%` }}
        />
        <span
          className={`${styles.barSeg} ${styles.segOpt}`}
          style={{ width: `${optPct}%` }}
        />
        <span
          className={`${styles.barSeg} ${styles.segOver}`}
          style={{ width: `${overPct}%` }}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotNec}`} />
          Necessary <b className={styles.legendVal}>{fmt(nec, currency)}</b>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotOpt}`} />
          Could save <b className={styles.legendVal}>{fmt(opt, currency)}</b>
        </div>
        {!isOver && budget > 0 && (
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotLeft}`} />
            Unspent{" "}
            <b className={styles.legendVal}>
              {fmt(Math.max(remaining, 0), currency)}
            </b>
          </div>
        )}
        {isOver && (
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotOver}`} />
            Over budget{" "}
            <b className={styles.legendVal}>
              {fmt(Math.max(spent - budget, 0), currency)}
            </b>
          </div>
        )}
      </div>

      <div className={styles.goalStatus}>{goalText}</div>
    </section>
  );
}
