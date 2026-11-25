import {
  PanelsTopLeft,
  Users,
  ListFilter,
  Megaphone,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Settings2,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import type { ModuleId } from "@/app/model";

const icons: Record<ModuleId, LucideIcon> = {
  overview: PanelsTopLeft,
  contacts: Users,
  leads: ListFilter,
  marketing: Megaphone,
  exams: GraduationCap,
  sponsorship: Handshake,
  quality: ShieldCheck,
  admin: Settings2,
  "data-import": FileSpreadsheet,
};

export function DestinationIcon({ name }: { name: ModuleId }) {
  const Component = icons[name];
  return <Component aria-hidden="true" size={24} strokeWidth={1.75} />;
}
