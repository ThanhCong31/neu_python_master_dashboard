import { overview } from "@/features/overview/routes";
import { contacts, leads } from "@/features/admissions/routes";
import { marketing, sponsorship } from "@/features/communications/routes";
import { exams } from "@/features/results/routes";
import { quality, admin } from "@/features/system/routes";
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
];

export function availableTo(user: User) {
  return destinations.filter(
    (item) =>
      user.modules.includes(item.id) &&
      (item.id !== "admin" || user.role === "admin"),
  );
}
