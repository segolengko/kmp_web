"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./login-form.module.css";

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    const destination = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login gagal. Periksa email dan password.",
      );
    } finally {
      setIsSubmitting(false);
    }
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

      {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

      <label className={styles.field}>
        <span>Email Login</span>
        <input
          onChange={(event) => setEmail(event.target.value)}
          placeholder="contoh: admin@kmp.co.id"
          required
          type="email"
          value={email}
        />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Masukkan password"
          required
          type="password"
          value={password}
        />
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
        {isSubmitting ? "Memproses..." : "Masuk ke Sistem"}
      </button>
    </form>
  );
}
