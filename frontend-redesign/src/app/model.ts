import type { ComponentType } from "react";

export type ModuleId =
  | "overview"
  | "contacts"
  | "leads"
  | "marketing"
  | "exams"
  | "sponsorship"
  | "quality"
  | "admin"
  | "data-import";

export interface User {
  username: string;
  full_name: string;
  role: "admin" | "partner";
  partner_code: string | null;
  partner_name: string | null;
  modules: ModuleId[];
  can_view_pii: boolean;
}

export interface Destination {
  id: ModuleId;
  path: string;
  label: string;
  navLabel?: string;
  group?: "Tuyển sinh" | "Hệ thống";
  Screen: ComponentType;
}
