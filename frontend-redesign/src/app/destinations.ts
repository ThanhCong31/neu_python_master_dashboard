import { overview } from "@/features/overview/routes";
import { contacts, leads } from "@/features/admissions/routes";
import { marketing, sponsorship } from "@/features/communications/routes";
import { exams } from "@/features/results/routes";
import { quality, admin, dataImport } from "@/features/system/routes";
import type { User } from "./model";

const destinations = [
  overview,
  contacts,
  leads,
  marketing,
  exams,
  sponsorship,
  quality,
  admin,
  dataImport,
];

export function availableTo(user: User) {
  return destinations.filter((item) => {
    if (user.role === "admin") return true;
    if (item.id === "admin" || item.id === "data-import") return false;
    return user.modules.includes(item.id);
  });
}
