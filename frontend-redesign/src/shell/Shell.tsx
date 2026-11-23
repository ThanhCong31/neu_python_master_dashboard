import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  useSidebarRail,
} from "@/components/expressive/sidebar";
import { TopAppBar } from "@/components/expressive/top-app-bar";
import { useWorkspace } from "@/app/workspace";
import { Navigation } from "./Navigation";
import { IconButton } from "@/components/expressive/icon-button";
import { CircleUserRound, X } from "lucide-react";
const Profile = lazy(() =>
  import("./Profile").then((module) => ({ default: module.Profile })),
);
const ScopeSelect = lazy(() =>
  import("./ScopeSelect").then((module) => ({ default: module.ScopeSelect })),
);

export function Shell({
  changeScope,
  signedOut,
}: {
  changeScope: (code: string | null) => void;
  signedOut: () => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={matchMedia("(min-width: 1200px)").matches}
      storageKey="neu-shell-sidebar"
      keyboardShortcut={false}
      width="16.5rem"
    >
      <a
        href="#page-content"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-shape-medium focus:bg-secondary-container focus:p-4 focus:text-on-secondary-container"
      >
        Đến nội dung chính
      </a>
      <Sidebar variant="inset" aria-label="Điều hướng chính">
        <SidebarHeader>
          <Brand />
        </SidebarHeader>
        <Navigation />
        <SidebarFooter className="border-t border-outline-variant/60 px-3 py-3">
          <Suspense
            fallback={
              <div className="flex h-14 items-center justify-center" role="status" aria-label="Đang tải tài khoản">
                <CircleUserRound className="size-9 text-on-surface-variant" aria-hidden="true" />
              </div>
            }
          >
            <Profile signedOut={signedOut} />
          </Suspense>
        </SidebarFooter>
      </Sidebar>
      <ShellContent changeScope={changeScope} />
    </SidebarProvider>
  );
}

function Brand() {
  const rail = useSidebarRail();
  const { setOpenMobile } = useSidebar();
  return (
    <div className="flex h-14 items-center gap-3 px-3">
      {/* Reuse the original product identity from main/frontend/index.html.
          Brand remains stable across user-selected Material color themes. */}
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className="size-8 shrink-0"
      />
      <span className={rail ? "sr-only" : "min-w-0 whitespace-nowrap"}>
        <span className="block text-title-medium text-on-surface">NEU</span>
        <span className="block text-label-medium text-on-surface-variant">
          Admissions BI
        </span>
      </span>
      <IconButton
        className="ml-auto md:hidden"
        aria-label="Đóng điều hướng"
        onClick={() => setOpenMobile(false)}
      >
        <X aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function ShellContent({
  changeScope,
}: {
  changeScope: (code: string | null) => void;
}) {
  const { user, destinations } = useWorkspace();
  const { setOpenMobile } = useSidebar();
  const { pathname } = useLocation();
  const current = destinations.find((item) => item.path === pathname);
  const title = current?.label ?? "Tài khoản";
  const section = current?.group ?? "Không gian làm việc";
  const content = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    document.title = `${title} · NEU Admissions BI`;
    if (previousPath.current !== pathname) {
      setOpenMobile(false);
      content.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      previousPath.current = pathname;
    }
  }, [pathname, title, setOpenMobile]);

  return (
    <SidebarInset className="overflow-x-clip">
      <TopAppBar
        className="rounded-t-shape-extra-large bg-surface-container-low"
        title={<span className="text-title-medium" title={section}>{section}</span>}
        navigation={<NavigationTrigger />}
        actions={<div className="flex items-center gap-2">
          {current && current.id !== "admin" && user.role === "admin" &&
            <div className="hidden lg:block"><Suspense fallback={<span className="text-label-medium text-on-surface-variant">Đang tải phạm vi…</span>}><ScopeSelect change={changeScope} /></Suspense></div>}

        </div>}
      />
      {current && current.id !== "admin" && user.role === "admin" && (
        <div className="border-b border-outline-variant/50 px-4 py-2 lg:hidden sm:px-6">
          <Suspense fallback={<div className="h-10 w-40 rounded-pill bg-surface-container" role="status" aria-label="Đang tải phạm vi" />}>
            <ScopeSelect change={changeScope} />
          </Suspense>
        </div>
      )}
      <div
        id="page-content"
        ref={content}
        tabIndex={-1}
        aria-label={title}
        className="min-h-[60dvh] flex-1 p-4 outline-none sm:p-6"
      >
        {current && current.id !== "admin" && current.id !== "quality" &&
          <header className="mb-6 max-w-4xl"><h1 className="text-headline-medium font-semibold tracking-tight">{title}</h1></header>}
        <Outlet />
      </div>
    </SidebarInset>
  );
}

const mobileQuery = matchMedia("(max-width: 767.98px)");
const isMobile = () => mobileQuery.matches;
function subscribeMobile(listener: () => void) {
  mobileQuery.addEventListener("change", listener);
  return () => mobileQuery.removeEventListener("change", listener);
}

function NavigationTrigger() {
  const mobile = useSyncExternalStore(subscribeMobile, isMobile);
  const { open, openMobile, setOpenMobile } = useSidebar();
  useEffect(() => {
    if (!mobile) setOpenMobile(false);
  }, [mobile, setOpenMobile]);
  return (
    <SidebarTrigger
      aria-label="Bật/tắt điều hướng"
      aria-expanded={mobile ? openMobile : open}
    />
  );
}

