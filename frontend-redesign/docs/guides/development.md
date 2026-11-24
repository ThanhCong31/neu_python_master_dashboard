# Phát triển và kiểm thử

[Danh mục tài liệu](../README.md) · [README dự án](../../README.md)

## Chạy

Cần Node.js >= 22.16.0 (xem `engines` trong `package.json`); sử dụng phiên bản tương thích với lockfile.

```sh
npm ci
npm run dev
```

Mở http://localhost:5174. Thử trên điện thoại cùng Wi-Fi bằng `npm run dev -- --host 0.0.0.0`, rồi mở địa chỉ Network mà Vite hiển thị.

`npm run build` kiểm tra TypeScript và tạo `dist/`. `npm run preview` mở bản build.

## Khung ứng dụng có kết nối backend

Chạy backend FastAPI hiện có trên cổng 8000 với MongoDB và tài khoản đã được tạo. Vite chuyển tiếp request `/api` tới `http://127.0.0.1:8000`. Đăng nhập bằng tài khoản hiện có, giống frontend cũ. Bản build cần được phục vụ cùng origin với API hoặc có reverse proxy cho `/api`.

- Khôi phục phiên qua `GET /api/auth/me` mỗi lần mở ứng dụng.
- Đăng nhập qua `POST /api/auth/login`, đăng xuất qua `POST /api/auth/logout`.
- Khi API trả 401, quay về đăng nhập. Khi máy chủ lỗi hoặc mất kết nối, hiện nút thử lại.
- Danh sách route và menu được lọc theo `user.modules`. Quản trị yêu cầu thêm vai trò admin.
- Admin lấy đối tác từ `GET /api/meta/options`; chọn phạm vi và giữ khi chuyển trang.
- Tài khoản có đổi mật khẩu qua `POST /api/auth/change-password` và hiển thị quyền của phiên đăng nhập dựa trên danh sách màn đã cấp.
- Gửi cookie phiên cùng origin. Frontend không lưu mật khẩu hay token vào localStorage.
- Backend tiếp tục quyết định quyền trên từng request.

Truyền thông và Nhà tài trợ đã tích hợp qua PR #1. Xem [lịch sử sau V38](../history/README.md#sau-v38) và [release checklist](../final-review/release-checklist.md). Điểm thi là dữ liệu giả lập, không dùng để công bố hoặc đánh giá cá nhân.

## Kiểm thử và build

```sh
npm run test:local
npm run build
```

Không bỏ qua lỗi compiler. Xem [release checklist](../final-review/release-checklist.md) để kiểm thử browser, phân quyền, API và dữ liệu thật. Full build cần được xác nhận trên môi trường tích hợp; các kết quả kiểm thử cũ trong lịch sử không phải chứng nhận release hiện tại. Xác nhận backend phục vụ `frontend-redesign/dist` hoặc reverse proxy cùng origin; không giả định backend đã đổi đường dẫn từ frontend cũ.
