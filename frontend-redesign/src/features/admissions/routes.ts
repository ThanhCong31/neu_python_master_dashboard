import type { Destination } from "@/app/model";
import Contacts from "./Contacts";
import Leads from "./Leads";

export const contacts: Destination = {
  id: "contacts",
  path: "/crm",
  label: "Liên hệ & chuyển đổi",
  group: "Tuyển sinh",
  Screen: Contacts,
};

export const leads: Destination = {
  id: "leads",
  path: "/lead",
  label: "Lead từ biểu mẫu",
  group: "Tuyển sinh",
  Screen: Leads,
};
