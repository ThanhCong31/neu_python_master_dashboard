import { useEffect, useState, useId } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Users } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
  useSidebarRail,
} from "@/components/expressive/sidebar";
import { useWorkspace } from "@/app/workspace";
import { DestinationIcon } from "@/shared/Icons";
import type { Destination } from "@/app/model";

export function Navigation() {
  const { destinations } = useWorkspace();
  const { pathname } = useLocation();
  const { setOpenMobile, setOpen } = useSidebar();
  const rail = useSidebarRail();
  const childrenId = useId();
  const admissions = destinations.filter((item) => item.group === "Tuyển sinh");
  const activeAdmission = admissions.some((item) => item.path === pathname);
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem("neu-shell-admissions-expanded") !== "false"; } catch { return true; }
  });
  function setRememberedExpanded(next: boolean) {
    setExpanded(next);
    try { localStorage.setItem("neu-shell-admissions-expanded", String(next)); } catch { /* ignore */ }
  }
  useEffect(() => {
    if (activeAdmission) setRememberedExpanded(true);
  }, [pathname, activeAdmission]);
  function link(item: Destination) {
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          render={<Link to={item.path} />}
          icon={<DestinationIcon name={item.id} />}
          active={pathname === item.path}
          onClick={() => setOpenMobile(false)}
        >
          {item.navLabel ?? item.label}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  const system = destinations.filter((item) => item.group === "Hệ thống");
  return (
    <SidebarContent aria-label="Điều hướng chính">
      <SidebarGroup>
        <SidebarMenu>
          {destinations.filter((item) => item.id === "overview").map(link)}
          {admissions.length === 1 && admissions.map(link)}
          {admissions.length > 1 && (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<button type="button" />}
                icon={<Users aria-hidden="true" />}
                ancestorActive={activeAdmission && (rail || !expanded)}
                tooltip="Tuyển sinh"
                aria-expanded={!rail && expanded}
                aria-controls={expanded && !rail ? childrenId : undefined}
                onClick={() => {
                  if (rail) {
                    setOpen(true);
                    setRememberedExpanded(true);
                  } else setRememberedExpanded(!expanded);
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  Tuyển sinh
                  <ChevronDown
                    aria-hidden="true"
                    className={expanded ? "rotate-180 !size-4" : "!size-4"}
                  />
                </span>
              </SidebarMenuButton>
              {!rail && expanded && (
                <SidebarMenuSub id={childrenId}>
                  {admissions.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuSubButton
                        render={<Link to={item.path} />}
                        active={pathname === item.path}
                        title={item.label}
                        className="min-h-12 h-auto py-2 whitespace-normal"
                        onClick={() => setOpenMobile(false)}
                      >
                        {item.navLabel ?? item.label}
                      </SidebarMenuSubButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}
          {destinations
            .filter((item) => item.id !== "overview" && !item.group)
            .map(link)}
        </SidebarMenu>
      </SidebarGroup>
      {system.length > 0 && (
        <>
          <SidebarSeparator />
          <SidebarGroup label="Hệ thống">
            <SidebarMenu>{system.map(link)}</SidebarMenu>
          </SidebarGroup>
        </>
      )}
    </SidebarContent>
  );
}
