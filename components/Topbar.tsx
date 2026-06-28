import Logo from "./Logo";
import styles from "./Topbar.module.css";

interface TopbarProps {
  householdName?: string;
  accountName?: string;
}

export default function Topbar({ householdName, accountName }: TopbarProps) {
  const subtitle = [householdName, accountName ? `Viewing ${accountName}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className={styles.topbar}>
      <div>
        <div className={styles.brand}>
          <Logo size={28} />
          <span className={styles.wordmark}>Tikle Nest</span>
        </div>
        {subtitle && <div className={styles.sub}>{subtitle}</div>}
      </div>
    </header>
  );
}
