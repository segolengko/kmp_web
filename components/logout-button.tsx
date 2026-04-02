"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LogoutButtonProps = {
  className: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      router.push("/login");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  return (
    <button className={className} disabled={isSubmitting} onClick={handleLogout} type="button">
      {isSubmitting ? "Keluar..." : "Logout"}
    </button>
  );
}
