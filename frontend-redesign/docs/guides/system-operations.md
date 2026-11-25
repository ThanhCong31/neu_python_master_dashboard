# Quản trị và Chất lượng dữ liệu

[Danh mục tài liệu](../README.md) · [README dự án](../../README.md)

## Chức năng và API

Hai màn ở `src/features/system/` dùng endpoint sẵn có của backend `main`, không dùng dữ liệu demo.

- **Chất lượng dữ liệu (`/chat-luong`)**: tổng hợp lỗi/duplicate/flag/merged_distribution; phân tích số lượng theo loại; bảng `issues` và `duplicates` lọc `source`/`issue`, phân trang phía server; trạng thái và kiểm tra của lần import gần nhất (chỉ admin). Admin vẫn thấy dữ liệu toàn hệ thống khi đổi phạm vi, với nhãn rõ ràng; tài khoản đối tác không thấy `pipeline` và `last_import`.
- **Quản trị (`/quan-tri?tab=...`)**: bốn khu vực có deep link query `users`, `partners`, `data`, `audit`. Tài khoản có tạo, sửa họ tên, chuyển đối tác (theo quyền backend), khóa/mở khóa, đặt lại mật khẩu. Đối tác có chỉnh quyền module, PII và trạng thái. Dữ liệu có xem trạng thái, lịch sử import, nạp lại ETL, upload Excel với bước xác nhận. Nhật ký có lọc và xem JSON chi tiết.

### API sử dụng

| Tính năng | Backend API |
|---|---|
| Lỗi/nhật ký chất lượng | `GET /api/quality/summary`, `GET /api/quality/list` |
| Tài khoản | `GET/POST /api/admin/users`, `PATCH /api/admin/users/{username}`, `POST /api/admin/users/{username}/reset-password` |
| Đối tác | `GET /api/admin/partners`, `PATCH /api/admin/partners/{code}` |
| Dữ liệu | `GET /api/admin/data-status`, `GET /api/admin/imports`, `POST /api/admin/reload-data`, `POST /api/admin/upload-file?filename=...` |
| Nhật ký truy cập | `GET /api/admin/audit?limit=200` |

UI có trạng thái loading/error/empty, retry, xác nhận trước hành động nguy hiểm, thông báo thành công/lỗi. Quyền luôn được backend quyết định; frontend chỉ bổ trợ UX.

### Phạm vi của nhóm frontend và lưu ý tích hợp

**Bản này chỉ thay đổi `frontend-redesign/`; không chỉnh sửa `backend/`, ETL, database hay hợp đồng API.** Các thành phần đều gọi đúng các endpoint có sẵn trên nhánh `main`.

- **D24 — Upload:** API `/api/admin/upload-file` hiện xử lý tên tệp đích từ query. UI chỉ gửi hai tên tệp ETL cố định và yêu cầu xác nhận, **nhưng điều đó không sửa được rủi ro ở backend**. Không xem UI validation là một biện pháp bảo vệ phía server. Cần thông báo cho nhóm backend và tránh đưa upload lên môi trường công khai khi chưa được đánh giá an toàn.
- **D25 — Quality:** API `/api/quality/summary` có các trường `pipeline` và `last_import` chứa metadata toàn hệ thống. Frontend chỉ hiển thị chúng cho admin và ghi rõ phạm vi; **API gốc vẫn trả chúng theo hành vi hiện có**, nên frontend không thể đảm bảo giới hạn truy cập dữ liệu ở cấp server. Chuyển phát hiện này cho nhóm backend xử lý riêng nếu cần.
- **D23 — ETL:** `reload-data` và `upload-file` chạy thao tác ghi dữ liệu thật. UI có hộp xác nhận, không có dry-run hay rollback vì các API hiện tại không hỗ trợ. Chỉ kiểm thử trên dữ liệu thử nghiệm hoặc sau khi sao lưu.

Khi API thiếu chức năng hoặc trả dữ liệu không đúng phạm vi, ghi nhận thành vấn đề tích hợp, **không tự tạo endpoint mới, không sửa mã nguồn backend và không giả lập dữ liệu**.

### Kiểm tra thực tế cần chạy trên máy của bạn

```sh
cd frontend-redesign
npm ci
npm run build
npm run dev
```

Đồng thời chạy backend FastAPI và MongoDB từ repository hiện có. Kiểm thử với **admin**, **partner có quyền quality** và **partner không có quyền quality**:

1. Admin xem được mọi tab trong Quản trị, partner không nhìn thấy điều hướng Quản trị.
2. Tạo/sửa/khóa tài khoản, reset mật khẩu. Kiểm thử 403/401 và lỗi khi trùng username.
3. Thay quyền module/PII/active của đối tác; đăng nhập lại bằng tài khoản đối tác để kiểm tra quyền backend đã cập nhật.
4. Chuyển scope admin rồi kiểm tra chỉ số thuộc đối tác trong bảng nhật ký quality; pipeline tổng thể luôn được ghi nhãn toàn hệ thống.
5. Thử filter và phân trang của quality; tài khoản thiếu PII không nhìn thấy dữ liệu đã bị API che.
6. Kiểm thử import có xác nhận bằng dữ liệu test và **backup MongoDB**; không thử upload file không tin cậy lên backend chưa được vá.
7. Xem danh sách audit, lọc sự kiện, xem chi tiết, thử lại khi API lỗi; kiểm tra responsive và keyboard navigation.

Kết quả kiểm thử theo từng bản nằm trong [lịch sử triển khai](../history/README.md). Trước khi deploy, thực hiện [release checklist](../final-review/release-checklist.md); không coi kiểm tra tĩnh hoặc fixture là nghiệm thu production.
