import type { Destination } from "@/app/model";
import Quality from "./Quality";
import Admin from "./Admin";
import DataImport from "./DataImport";

export const quality: Destination = {
  id: "quality",
  path: "/chat-luong",
  label: "Chất lượng dữ liệu",
  group: "Hệ thống",
  Screen: Quality,
};

export const admin: Destination = {
  id: "admin",
  path: "/quan-tri",
  label: "Quản trị hệ thống",
  navLabel: "Quản trị",
  group: "Hệ thống",
  Screen: Admin,
};

export const dataImport: Destination = {
  id: "data-import",
  path: "/nhap-du-lieu",
  label: "Nạp dữ liệu Excel",
  navLabel: "Nạp dữ liệu Excel",
  group: "Hệ thống",
  Screen: DataImport,
};
