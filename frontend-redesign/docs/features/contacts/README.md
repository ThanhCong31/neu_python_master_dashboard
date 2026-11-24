# Tuyển sinh — bộ hồ sơ thiết kế Contacts

> Hồ sơ thiết kế theo baseline lịch sử; xem [design review](contacts-design-review.md) và [lịch sử triển khai](../../history/README.md) để biết các quyết định sau audit.

**Dự án:** NEU Admissions BI · frontend-redesign · baseline V16 (bản làm việc trong workspace).
**Ngày:** 24/11/2026. **Trạng thái:** đặc tả để review, chưa triển khai.
**Phạm vi:** `/crm` — Liên hệ & chuyển đổi; không phải `/lead` — Lead từ biểu mẫu.

## Thứ tự đọc và sử dụng

| Tài liệu | Vai trò | Khi dùng |
|---|---|---|
| [contacts-issues.md](contacts-issues.md) | Audit frontend cũ, bằng chứng, mức độ ưu tiên | Trước mọi quyết định sửa |
| [contacts-api-contract.md](contacts-api-contract.md) | Hợp đồng API, từ điển chỉ số, giới hạn backend | Khi thiết kế và viết logic |
| [contacts-design.md](contacts-design.md) | IA, wireframe, visual design, tương tác, responsive | Trước khi viết component |
| [contacts-plan.md](contacts-plan.md) | Kiến trúc, phạm vi file, trình tự V17–V19, bàn giao | Khi bắt đầu triển khai |
| [contacts-review.md](contacts-review.md) | Kịch bản kiểm thử, rubric, cổng nghiệm thu | Sau mỗi vòng và trước commit |

Đặt các file này cùng nhau tại `frontend-redesign/docs/features/contacts/`. Giữ tên file để liên kết tương đối hoạt động. Đọc `AGENTS.md` và `CONTRIBUTING.md` hiện có trong repo trước khi chỉnh code. Không coi tài liệu audit cũ là hợp đồng API mới; nếu có mâu thuẫn, xác minh router/backend, ghi quyết định, rồi cập nhật tài liệu.

## Nguồn và mức độ chắc chắn

- GitHub fork `chiinthedesert/neu_python_master_dashboard`, cây `main` đọc ngày 24/11/2026: tree SHA `89ec8638ddc751f03c38ce4ea0bdb2ca79be0464` (đây là tree SHA, không phải commit SHA). Đã đọc `frontend/src/pages/Contacts.tsx`, `components/DataTable.tsx`, `FilterBar.tsx`, `Viz.tsx`, `lib/hooks.ts`, `backend/app/routers/contacts.py`, `misc.py`, `filters.py`, `backend/etl/process_and_seed.py`, `seed.py`, `docs/DATA_DICTIONARY.md`, `README.md`; xem liên kết trong audit.
- Đã đọc `neu-dashboard-existing-issues.md`, mục liên quan C13–C19, A04–A06, B08–B09; tham chiếu các quyết định Overview ở [Overview plan](../overview/overview-plan.md) và [Overview audit](../overview/overview-issues.md).
- Đã đối chiếu source V16 trong workspace, gồm shell, routes, trang Contacts đang `return null`, API service, chart adapter/responsive helper, formatters, primitive Expressive, System components. Không giả định bản local trên máy người dùng hoặc branch remote có cùng nội dung; kiểm tra diff trước khi viết patch.
- Audit tĩnh: chưa chạy MongoDB, chưa đo performance hay kiểm thử với người dùng. Các số liệu ví dụ trong tài liệu là fixture giả lập, không phải số liệu thực. Không sửa source, backend, dữ liệu hoặc Git remote trong bước này.

## Quyết định thiết kế đề xuất

1. Trang là **workspace tra cứu hồ sơ và phân tích chuyển đổi**, không phải Overview thứ hai. Hai chế độ `Hồ sơ` (mặc định) và `Phân tích`, cùng bộ lọc nghiệp vụ; không thêm sidebar destination.
2. Ưu tiên bảng đọc nhanh và chi tiết chỉ đọc. Desktop bảng có số cột hợp lý; mobile danh sách thích ứng có đầy đủ hành động, không thu nhỏ bảng 15 cột.
3. Bộ lọc thực sự thuộc Contacts. Bộ lọc nhiều giá trị, thời gian tiếp xúc đầu tiên, áp dụng theo lô; tìm kiếm mã/tên/email chỉ áp dụng bảng và CSV, ghi phạm vi rõ ràng. Không lưu email/tên tìm kiếm vào URL.
4. Bảng và CSV dùng cùng điều kiện lọc/tìm kiếm; phân tích không chịu tìm kiếm riêng của bảng. CSV là tất cả dòng khớp, thứ tự mã hồ sơ, không phải trang hiện tại. Overview giữ menu báo cáo Excel/Word/PDF riêng.
5. ECharts V16 dùng chung, màu theo theme, nhãn và bảng thay thế; tối giản biểu đồ trùng lặp. Material 3 Expressive phải có hierarchy, shape, typography, trạng thái và chuyển động có mục đích; không hardcode theme.
6. Không sửa backend, không invent endpoint chi tiết hay chỉnh sửa hồ sơ, không giả lập filter không có API, không thay đổi phần teammate. Mọi hạn chế nghiệp vụ ghi trong API contract.

## Cách sử dụng cho người/agent triển khai

Bắt đầu bằng review các quyết định D01–D08 trong `contacts-design.md`. Khi được phép viết code, thực hiện từng vòng trong `contacts-plan.md`; chỉ tuyên bố pass nếu có lệnh và kết quả thực tế theo `contacts-review.md`. Nếu gặp điều kiện chưa xác minh, ghi rõ blocker; không tự bù số liệu, không sửa backend ngầm. Kết thúc bằng patch từ baseline thực tế, không thay toàn repo.
