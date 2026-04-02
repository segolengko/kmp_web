import Image from "next/image";
import styles from "./koperasi-logo.module.css";

type KoperasiLogoProps = {
  compact?: boolean;
  iconOnly?: boolean;
};

export function KoperasiLogo({
  compact = false,
  iconOnly = false,
}: KoperasiLogoProps) {
  return (
    <div className={styles.wrap}>
      <div className={compact ? styles.frameCompact : styles.frame}>
        <div className={compact ? styles.markCompact : styles.mark}>
          <Image
            src="/logo-koperasi-indonesia.gif"
            alt="Logo Koperasi Indonesia"
            fill
            sizes={compact ? "40px" : "56px"}
            className={styles.image}
            unoptimized
          />
        </div>
      </div>
      {!iconOnly ? (
        <div className={styles.text}>
          <strong>KMP</strong>
        </div>
      ) : null}
    </div>
  );
}
