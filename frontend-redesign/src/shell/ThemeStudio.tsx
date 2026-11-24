import { useEffect, useRef, useState } from "react";
import { Palette, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { IconButton } from "@/components/expressive/icon-button";
import { getThemeColor, getThemeScheme, setThemeColor, THEME_COLORS, type ThemeColor } from "./theme";

/** Browser-only appearance preference; unrelated to API/database permissions. */
export function ThemeStudio({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const userClosing = useRef(false);
  const [selected, setSelected] = useState<ThemeColor>(getThemeColor);
  const dark = document.documentElement.classList.contains("dark");
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => { if (!node.open) node.showModal(); });
    return () => { cancelAnimationFrame(frame); userClosing.current = false; if (node.open) node.close(); };
  }, []);
  function choose(color: ThemeColor) { setThemeColor(color); setSelected(color); }
  function requestClose() { userClosing.current = true; dialog.current?.close(); }
  return (
    <dialog ref={dialog} className="neu-theme-dialog"
      onCancel={() => { userClosing.current = true; }}
      onClose={() => { if (userClosing.current) { userClosing.current = false; onClose(); } }}
      aria-labelledby="theme-studio-heading"
      onClick={(event) => { if (event.target === dialog.current) requestClose(); }}>
      <div className="neu-theme-dialog-head">
        <div className="neu-theme-dialog-symbol"><Palette size={24} aria-hidden="true" /></div>
        <IconButton aria-label="Đóng bảng màu" onClick={requestClose}><X size={21} /></IconButton>
      </div>
      <h2 id="theme-studio-heading">Màu giao diện</h2>
      <p>Màu được áp dụng ngay khi chọn và tự lưu trong trình duyệt. Mỗi bảng màu đều hỗ trợ chế độ sáng và tối.</p>
      <div className="neu-theme-colors" role="group" aria-label="Chọn bảng màu giao diện">
        {THEME_COLORS.map((entry) => {
          const scheme = getThemeScheme(entry.id);
          const colors = dark ? scheme.dark : scheme.light;
          const chosen = selected === entry.id;
          return (
            <button type="button" key={entry.id}
              className={`neu-theme-option${chosen ? " neu-theme-option--selected" : ""}`}
              title={entry.name} aria-label={entry.name} aria-pressed={chosen}
              onClick={() => choose(entry.id)}>
              <span className="neu-theme-preview" aria-hidden="true"
                style={{ background: colors.surfaceContainerLow, color: colors.onSurface }}>
                <span className="neu-theme-preview-rail" style={{ background: colors.surfaceContainer }}>
                  <span className="neu-theme-preview-dot" style={{ background: colors.primary }} />
                  <span className="neu-theme-preview-nav" style={{ background: colors.primaryContainer }} />
                  <span className="neu-theme-preview-nav-line" style={{ background: colors.outlineVariant }} />
                </span>
                <span className="neu-theme-preview-content">
                  <span className="neu-theme-preview-heading" style={{ background: colors.onSurface }} />
                  <span className="neu-theme-preview-card" style={{ background: colors.surfaceContainerHigh }} />
                  <span className="neu-theme-preview-action" style={{ background: colors.primary }} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="neu-theme-dialog-footer">
        <Button variant="text" icon={<RotateCcw />} onClick={() => choose("campus")}>Mặc định</Button>
        <Button onClick={requestClose}>Đóng</Button>
      </div>
    </dialog>
  );
}
