import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronsUpDown, CircleUserRound, LogOut, Palette } from "lucide-react";
import { ThemeStudio } from "./ThemeStudio";
import "./theme-studio.css";
import { Avatar } from "@/components/expressive/avatar";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuRadioGroup,
  MenuRadioItem,
  MenuGroup,
  MenuGroupLabel,
} from "@/components/expressive/menu";
import { useWorkspace } from "@/app/workspace";
import { useSidebar, useSidebarRail } from "@/components/expressive/sidebar";
import { api } from "@/services/api";
import { getTheme, setTheme } from "./theme";

export function Profile({ signedOut }: { signedOut: () => void }) {
  const { user } = useWorkspace();
  const rail = useSidebarRail();
  const { setOpenMobile } = useSidebar();
  const roleLabel = user.role === "admin" ? "Quản trị viên" : (user.partner_name ?? "Đối tác");
  const [mode, setMode] = useState(getTheme);
  useEffect(() => {
    const sync = () => setMode(getTheme());
    window.addEventListener("neu-theme-change", sync);
    return () => window.removeEventListener("neu-theme-change", sync);
  }, []);
  const [studioOpen, setStudioOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            title={rail ? user.full_name : undefined}
            aria-label={`Tài khoản ${user.full_name}. Mở menu`}
            className={`focus-ring group/profile flex h-14 items-center rounded-shape-large p-2 text-start text-on-surface transition-[background-color,border-radius] spring-spatial-fast hover:rounded-shape-extra-large hover:bg-surface-container-high focus-visible:bg-surface-container-high data-popup-open:bg-primary-container data-popup-open:text-on-primary-container ${rail ? "w-14 justify-center" : "w-full gap-3"}`}
          />
        }
      >
        <Avatar alt={user.full_name} color="tertiary" size="md" />
        {!rail && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-large font-semibold">{user.full_name}</span>
              <span className="truncate text-body-small text-on-surface-variant">{roleLabel}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
          </>
        )}
      </MenuTrigger>
      <MenuContent side="top" align="start" sideOffset={8} className="w-72 max-w-[calc(100vw-2rem)]">
        <MenuGroup>
          <MenuGroupLabel>{user.full_name} · @{user.username}</MenuGroupLabel>
          <MenuItem
            render={<Link to="/tai-khoan" onClick={() => setOpenMobile(false)} />}
            icon={<CircleUserRound />}
          >
            Tài khoản
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Giao diện</MenuGroupLabel>
          <MenuRadioGroup
            aria-label="Giao diện"
            value={mode}
            onValueChange={(value) => {
              if (value === "system" || value === "light" || value === "dark") {
                setTheme(value);
                setMode(value);
              }
            }}
          >
            <MenuRadioItem value="system">Theo hệ thống</MenuRadioItem>
            <MenuRadioItem value="light">Sáng</MenuRadioItem>
            <MenuRadioItem value="dark">Tối</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuItem icon={<Palette />} onClick={() => setStudioOpen(true)}>
          Màu giao diện…
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={<LogOut />}
          disabled={busy}
          closeOnClick={false}
          onClick={async () => {
            if(busy || !window.dispatchEvent(new Event("neu-before-sign-out",{cancelable:true})))return;
            setBusy(true);
            setError("");
            try {
              await api("/auth/logout", { method: "POST" });
              setOpenMobile(false);
              signedOut();
            } catch {
              setError("Chưa đăng xuất được. Vui lòng thử lại.");
              setBusy(false);
            }
          }}
        >
          {busy ? "Đang đăng xuất…" : "Đăng xuất"}
        </MenuItem>
        {error && (
          <p role="alert" className="px-4 text-body-medium text-error">
            {error}
          </p>
        )}
      </MenuContent>
    </Menu>
    {studioOpen && <ThemeStudio onClose={() => setStudioOpen(false)} />}
    </>
  );
}
