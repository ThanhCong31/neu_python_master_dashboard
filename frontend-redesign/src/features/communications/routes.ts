import type { Destination } from "@/app/model";
import Marketing from "./Marketing";
import Sponsorship from "./Sponsorship";

export const marketing: Destination = {
  id: "marketing",
  path: "/kenh-roi",
  label: "Truyền thông",
  Screen: Marketing,
};

export const sponsorship: Destination = {
  id: "sponsorship",
  path: "/tai-tro",
  label: "Nhà tài trợ",
  Screen: Sponsorship,
};
