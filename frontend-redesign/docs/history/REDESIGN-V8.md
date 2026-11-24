# NEU Admissions BI — V8: Sửa màn hình trắng và rà soát chức năng Hệ thống

## Phạm vi

Chỉ sửa frontend. **Không thay đổi backend, endpoint, dữ liệu MongoDB hoặc ETL.** Cơ sở là ZIP V7. Các màn hình nghiệp vụ vốn để trống được giữ nguyên.

## Nguyên nhân và sửa chữa

1. **Lỗi gây màn hình trắng được xác nhận:** `src/features/system/admin/Partners.tsx` dùng `<Check />` cho checkbox đã bật nhưng không import `Check`. Việc render quyền đang bật gây lỗi JavaScript `ReferenceError`. Đã thêm import chính xác.
2. **Thiếu phương án phục hồi:** trước V8 React không có Error Boundary nên lỗi render một màn hình có thể khiến nội dung biến mất hoàn toàn. Đã thêm `src/shared/ScreenErrorBoundary.tsx` cho từng route và workspace, thông báo lỗi kèm nút thử lại. Trong dev mode có phần chi tiết lỗi. Đây là giải pháp giảm tác động, **không thay thế việc sửa lỗi gốc**.
3. **Làm mới thiếu nhất quán:** nút làm mới ở Chất lượng dữ liệu trước đây chỉ tải lại summary mà không tải lại bảng log. V8 đồng bộ summary và bảng, giữ bộ lọc đang dùng.
4. **Giảm nút làm mới:** xóa nút lặp trong Tài khoản, Đối tác và Lịch sử nạp dữ liệu. Sau thao tác thành công danh sách Tài khoản tự cập nhật; Phân quyền đọc lại cấu hình sau lưu. Giữ nút cập nhật dữ liệu ở Chất lượng dữ liệu, số liệu database (đồng thời cập nhật lịch sử nhập) và Nhật ký. Mục Đối tác có nút tải lại cấu hình **chỉ khi xảy ra lỗi/đụng độ dữ liệu**, để người dùng phục hồi an toàn.
5. **Scope menu:** bọc nhãn mục và nhóm chọn quyền vào `MenuGroup` đúng cấu trúc component; không thay đổi endpoint hoặc quyền truy cập.
6. **Đổi scope khi đang ở tab nhập gần nhất:** hiệu chỉnh dependency effect khi `partner` thay đổi; trở về tab nhật ký phù hợp.

## Hợp đồng API đã đối chiếu với `main` (không sửa)

- Tài khoản: `GET/POST /api/admin/users`, `PATCH /api/admin/users/{username}`, `POST /api/admin/users/{username}/reset-password`.
- Đối tác: `GET /api/admin/partners`, `PATCH /api/admin/partners/{code}`; gửi `modules`, `can_view_pii`, `active`; GET để đối chiếu sau lưu.
- Dữ liệu: `GET /api/admin/data-status`, `GET /api/admin/imports`, `POST /api/admin/reload-data`, `POST /api/admin/upload-file?filename=...`.
- Nhật ký: `GET /api/admin/audit?limit=200`.
- Chất lượng: `GET /api/quality/summary`, `GET /api/quality/list?kind=...`.
- Phạm vi admin: `GET /api/meta/options`; tham số `partner` ở các endpoint nghiệp vụ được hỗ trợ.

## Kiểm thử trên máy phát triển

```bash
cd frontend-redesign
npm ci
npm run test:local
npm run build
npm run dev
```

Sau khi đăng nhập admin, thử lần lượt: (1) mở Quản trị → Đối tác & quyền (khi các quyền đã bật), (2) bật/tắt một quyền rồi xác nhận/huỷ lưu, (3) mở các dialog trong Tài khoản, (4) kiểm tra lọc, phân trang và cập nhật Chất lượng dữ liệu, (5) kiểm tra Nhật ký và số liệu hệ thống. Chỉ sử dụng tài khoản/dữ liệu thử nghiệm khi muốn thực hiện thay đổi thật.

Có thể kiểm tra **10 endpoint GET** (không ghi dữ liệu nghiệp vụ) với `npm run check:system-api` theo hướng dẫn README; script đăng nhập sẽ vẫn ghi sự kiện audit và cập nhật thời gian đăng nhập theo logic gốc. Không gửi mật khẩu hoặc cookie về chat.

## Giới hạn xác thực

- `npm run test:source`, `npm run test:theme`, `npm run test:api` đã chạy và pass trong môi trường tạo ZIP.
- Chưa thể thực hiện `npm run build` ở đây do không có toàn bộ npm dependencies và môi trường không thể truy cập `registry.npmjs.org`. Không tuyên bố code đã build thành công.
- Chưa thực hiện thao tác POST/PATCH trên backend thật, vì backend của người dùng không chạy trong môi trường hiện tại. Việc URL/API method đúng không bảo đảm toàn bộ tương tác đã được kiểm thử end-to-end.
- Không thể giải quyết nguy cơ endpoint upload không giới hạn tên file hoặc trạng thái đọc/ghi đồng thời bằng sửa frontend; backend do nhóm khác phụ trách.

## Nếu vẫn gặp màn hình trắng

Mở DevTools → Console, ghi lại thông báo lỗi đầu tiên (red stack trace) và thao tác gây ra lỗi. Không gửi cookie, mật khẩu hoặc dữ liệu cá nhân. Lỗi render trong V8 sẽ xuất hiện trong giao diện phục hồi thay vì biến toàn bộ trang thành trắng.
