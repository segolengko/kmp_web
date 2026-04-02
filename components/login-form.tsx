"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./login-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push("/dashboard");
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.intro}>
        <span className={styles.badge}>Portal Internal</span>
        <h1>Masuk ke sistem koperasi yang lebih rapi.</h1>
        <p>
          Pantau anggota, generate simpanan wajib, dan cek tunggakan dalam satu
          dashboard yang bersih.
        </p>
      </div>

      <label className={styles.field}>
        <span>Email atau No. Anggota</span>
        <input type="text" placeholder="contoh: admin@koperasi.id" required />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input type="password" placeholder="Masukkan password" required />
      </label>

      <div className={styles.row}>
        <label className={styles.checkbox}>
          <input type="checkbox" defaultChecked />
          <span>Ingat saya</span>
        </label>
        <button className={styles.link} type="button">
          Lupa password?
        </button>
      </div>

      <button className={styles.submit} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Memproses..." : "Masuk ke Dashboard"}
      </button>
    </form>
  );
}
