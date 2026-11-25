# Tài liệu frontend

[README dự án](../README.md)

Một điểm vào duy nhất cho tài liệu kỹ thuật. Ưu tiên hướng dẫn hiện hành và source khi phát triển; dùng hồ sơ lịch sử để hiểu lý do thiết kế.

| Nhóm | Nội dung |
|---|---|
| [Guides — phát triển](guides/development.md) | Cài đặt, backend, chạy, kiểm thử và build |
| [Guides — kiến trúc](guides/architecture.md) | Cấu trúc source, route, shell, Expressive CLI |
| [Guides — vận hành hệ thống](guides/system-operations.md) | Quản trị, Quality, API và giới hạn backend |
| [Design system](design-system/README.md) | Component, theme, chart, responsive và loading |
| [Features](features/README.md) | Audit, hợp đồng API, thiết kế và review theo màn hình |
| [Final review](final-review/README.md) | Audit liên màn hình, kế hoạch V35–V37 và release checklist |
| [History](history/README.md) | Các ghi chú phiên bản V2–V64 đã có |

## Quy ước

- Root chỉ giữ README giới thiệu và lệnh chạy nhanh; tài liệu dài vào `docs/`.
- Tài liệu mới theo feature đặt tại `features/<feature>/`; không cần tạo mọi loại file nếu không có nội dung.
- Các quyết định dùng chung vào `design-system/`, kiểm thử và audit tích hợp vào `final-review/`.
- Ghi chú phiên bản mới vào `history/`; không chỉnh kết quả kiểm thử cũ thành kết quả hiện tại.
- Các đường dẫn trong snippet source tính từ `frontend-redesign/`, trừ khi có chỉ dẫn khác. Liên kết Markdown tính từ file chứa liên kết.
- Khi merge PR đồng đội, bổ sung hồ sơ và review tích hợp, không coi V38 là bản đã nghiệm thu production.
