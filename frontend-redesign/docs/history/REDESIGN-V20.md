# V20 — Điều hướng và thao tác cấp màn hình

Baseline: V19 Contacts. Không sửa API backend, route paths, phân quyền, theme hay nội dung module của đồng đội.

## Quyết định

- Bỏ nhãn dự phòng “Không gian làm việc”. Top App Bar hiển thị tên màn hình (H1 duy nhất); không lặp tiêu đề trong body. “Hệ thống” vẫn là nhãn nhóm sidebar có ý nghĩa.
- Nút Làm mới dùng icon M3 Expressive 48px, nằm ngoài cùng bên phải của hàng tiêu đề. Tooltip, accessible name, loading state, reduced motion. Không phải nạp dữ liệu/ETL.
- Scope admin đứng trước refresh nếu content ≥740px, xuống hàng riêng nếu hẹp hơn. Tiêu đề có thể xuống dòng. Không lặp tên scope admin ở Overview.
- Tuyển sinh: nhóm mở/đóng nếu có cả Contacts và Leads; chỉ có một module thì đi thẳng tới module đó. Giữ URL, quyền và thứ tự. “Liên hệ” là nhãn nav ngắn; tên trang vẫn là “Liên hệ & chuyển đổi”. Parent không mang selected surface đồng thời với child đang mở; rail/nhóm đóng vẫn báo ancestor active. Child có touch target ≥48px.
- Overview, Contacts, Quality dùng PageRefresh. Contacts cập nhật danh mục lọc và đúng view đang hoạt động, giữ query, trang, sort; view ẩn không fetch. Admin chỉ làm mới các phần đọc độc lập (nhật ký và trạng thái/lịch sử dữ liệu). Không reset form quản trị.
- Marketing, Sponsorship, Leads và Kết quả thi: khi có dữ liệu, sử dụng `import { PageRefresh } from '@/shared/PageActions'`; render `<PageRefresh onRefresh={resource.retry} busy={resource.state === 'loading' || resource.refreshing}/>` một lần bên trong màn hình. Shell đặt nút ở slot chung; không thêm H1 riêng. Với request nhiều nguồn, tổng hợp busy và retry đúng nguồn. Không đặt nút giả trên màn hình chưa triển khai.

## Review runtime bắt buộc

- 320, 360, 390, 600, 768, 1024, 1280, 1440px; sidebar mở/đóng, zoom 200%, tên đối tác dài; light/dark, năm theme.
- Chỉ một H1 mỗi route, không tràn ngang, scope không che refresh, không xuất hiện refresh từ route cũ khi chuyển trang. Kiểm tra tooltip, keyboard, touch, reduced motion.
- Quyền 0/1/2 module Tuyển sinh; link con active duy nhất khi nhóm mở, rail mở lại nhóm đúng, back/forward và reload route con.
- Refresh khi có filter, search, sort và page >1; thay đổi options khiến filter cũ không hợp lệ phải hiển thị cảnh báo; lỗi cùng path giữ dữ liệu, đổi scope không lộ dữ liệu cũ. Không gọi endpoint ghi/ETL.
- Admin: refresh nhật ký và trạng thái/lịch sử không làm mất draft; giữ riêng Nạp lại dữ liệu/Tải lên và xử lý.

## Kiểm tra trong workspace

Xem kết quả lệnh test kèm bản giao. Full build/live integration cần xác nhận tại môi trường có đầy đủ npm dependencies và FastAPI/MongoDB.
