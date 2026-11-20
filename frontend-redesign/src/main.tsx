import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import "./index.css";

function App() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className={`${dark ? "dark" : ""} min-h-dvh bg-background p-6 text-foreground`}>
      <main className="mx-auto grid min-h-[80dvh] max-w-lg place-items-center">
        <section className="w-full space-y-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">NEU Admissions BI</h1>
          <p className="text-sm text-muted-foreground">
            Trang kiểm tra riêng cho bản thiết kế mới. Không cần API hay cơ sở dữ liệu để mở trang này.
          </p>
          <Button type="button" variant="outline" aria-pressed={dark} onClick={() => setDark((value) => !value)}>
            Giao diện tối
          </Button>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
