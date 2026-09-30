import { getInitials } from "@/types";
import ThemeToggle from "./ThemeToggle";
import styles from "./Header.module.css";

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  return (
    <header className={styles.appHeader}>
      <div className={styles.appHeaderBrand}>
        <span className={styles.brandMark}>SH</span>
        <span className={styles.brandTitle}>Supply Hub</span>
      </div>
      <div className={styles.appHeaderUser}>
        <ThemeToggle />
        <span className={styles.userAvatar}>{getInitials(userName)}</span>
        <span className={styles.userName}>{userName}</span>
      </div>
    </header>
  );
}
