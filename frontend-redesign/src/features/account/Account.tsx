import { useState, type FormEvent } from "react";
import { Button } from "@/components/expressive/button";
import { TextField } from "@/components/expressive/text-field";
import { useWorkspace } from "@/app/workspace";
import { api } from "@/services/api";

export default function Account() {
  const { user } = useWorkspace();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    if (values.get("repeat") !== values.get("new_password")) {
      setNotice("Hai mật khẩu mới chưa khớp.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await api("/auth/change-password", {
        json: {
          current_password: values.get("current_password"),
          new_password: values.get("new_password"),
        },
      });
      form.reset();
      setNotice("Đã cập nhật mật khẩu.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể đổi mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="max-w-lg space-y-6">
      <div>
        <h2 className="text-title-large">{user.full_name}</h2>
        <p className="text-body-medium text-on-surface-variant">
          @{user.username} ·{" "}
          {user.role === "admin" ? "Quản trị viên" : user.partner_name}
        </p>
      </div>
      <h2 className="text-title-large">Đổi mật khẩu</h2>
      <form className="grid gap-5" onSubmit={submit} aria-busy={busy}>
        <TextField
          label="Mật khẩu hiện tại"
          type="password"
          name="current_password"
          required
          autoComplete="current-password"
        />
        <TextField
          label="Mật khẩu mới"
          type="password"
          name="new_password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
        />
        <TextField
          label="Nhập lại mật khẩu mới"
          type="password"
          name="repeat"
          required
          autoComplete="new-password"
        />
        <p role="status" className="text-body-medium">
          {notice}
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu mật khẩu"}
        </Button>
      </form>
    </section>
  );
}
