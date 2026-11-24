import type { Destination } from "@/app/model";
import Exams from "./Exams";

export const exams: Destination = {
  id: "exams",
  path: "/diem-thi",
  label: "Kết quả thi",
  Screen: Exams,
};
