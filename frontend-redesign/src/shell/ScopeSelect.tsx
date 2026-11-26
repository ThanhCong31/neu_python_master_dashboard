import { Building2, ChevronDown, Globe2 } from "lucide-react";
import { Button } from "@/components/expressive/button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/expressive/menu";
import { useWorkspace } from "@/app/workspace";

/**
 * Admin-only *viewing* scope. This is not impersonation and never changes the
 * authenticated user's identity or permissions. The Shell performs the role
 * check before mounting this component; the check here is defense-in-depth.
 */
export function ScopeSelect({
  change,
}: {
  change: (code: string | null) => void;
}) {
  const { user, partner, partners, scopeStatus, retryScope } = useWorkspace();

  if (user.role !== "admin") return null;

  if (scopeStatus === "error") {
    return (
      <Button size="sm" variant="text" onClick={retryScope}>
        Không tải được phạm vi · Thử lại
      </Button>
    );
  }

  const selectedName =
    partner === null
      ? "Toàn hệ thống"
      : partners.find((item) => item.code === partner)?.name ?? "Đang tải phạm vi…";
  const currentValue = partner ?? "all";

  return (
    <Menu>
      <MenuTrigger
        disabled={scopeStatus !== "ready"}
        render={
          <button
            type="button"
            aria-label={`Phạm vi dữ liệu đang xem: ${selectedName}. Chọn phạm vi`}
            title={`Phạm vi đang xem: ${selectedName}`}
            className="workspace-scope-trigger focus-ring state-layer flex h-12 max-w-72 cursor-pointer items-center gap-2 rounded-pill bg-secondary-container px-3 text-label-large text-on-secondary-container transition-colors duration-150 ease-out disabled:cursor-default disabled:opacity-60"
          />
        }
      >
        {partner === null ? (
          <Globe2 size={19} aria-hidden="true" className="shrink-0" />
        ) : (
          <Building2 size={19} aria-hidden="true" className="shrink-0" />
        )}
        <span className="min-w-0 max-w-48 truncate">{selectedName}</span>
        <ChevronDown size={17} aria-hidden="true" className="shrink-0" />
      </MenuTrigger>
      <MenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="workspace-scope-menu w-[min(20.5rem,calc(100vw-2rem))] max-w-none"
      >
        <MenuGroup>
        <MenuGroupLabel>Chọn phạm vi xem</MenuGroupLabel>
        <MenuRadioGroup
          aria-label="Phạm vi dữ liệu"
          value={currentValue}
          onValueChange={(next) => {
            if (typeof next === "string" && next !== currentValue) {
              change(next === "all" ? null : next);
            }
          }}
        >
          <MenuRadioItem value="all">Toàn hệ thống</MenuRadioItem>
          {partners.length > 0 && <MenuSeparator />}
          {partners.map((item) => (
            <MenuRadioItem
              key={item.code}
              value={item.code}
              supportingText={item.code}
            >
              {item.name}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
        </MenuGroup>

      </MenuContent>
    </Menu>
  );
}
