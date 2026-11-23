import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/expressive/button";
import { TextField } from "@/components/expressive/text-field";
import { api } from "@/services/api";
import type { User } from "@/app/model";

export function Login({ accept }: { accept: (user: User) => void }) {
  useEffect(() => {
    document.title = "Đăng nhập · NEU Admissions BI";
  }, []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      accept(
        await api<User>("/auth/login", {
          json: {
            username: values.get("username"),
            password: values.get("password"),
          },
        }),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Chưa đăng nhập được.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-container p-4 text-on-surface">
      <section className="w-full max-w-md rounded-shape-extra-large bg-surface p-6 shadow-elevation-1 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/favicon.svg" alt="" aria-hidden="true" width={44} height={44} />
          <div><p className="text-title-large font-semibold">NEU</p><p className="text-label-medium text-on-surface-variant">Admissions BI</p></div>
        </div>
        <h1 className="text-headline-medium">Đăng nhập</h1>
        <p className="mt-2 text-body-medium text-on-surface-variant">
          Dùng tài khoản được quản trị viên cấp.
        </p>
        <form onSubmit={submit} className="mt-8 grid gap-5" aria-busy={busy}>
          <TextField
            label="Tên đăng nhập"
            name="username"
            autoComplete="username"
            required
            maxLength={64}
          />
          <TextField
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
          {error && (
            <p role="alert" className="text-body-medium text-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>
      </section>
    </main>
  );
}
