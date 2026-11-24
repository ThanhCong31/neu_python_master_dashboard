# UX & Interaction Audit

| ID | Mức / loại | Bằng chứng | Hướng xử lý |
|---|---|---|---|
| U01 | P1 C | Admin.tsx `dirty` chỉ chặn `change(tab)` và beforeunload; route sidebar/back có thể đổi mà không gọi change | Guard điều hướng SPA và back/forward; xác nhận bỏ/lưu; không chặn đăng xuất cưỡng bức do hết phiên. |
| U02 | P1 C | Overview.tsx `ExportActions disabled={!data||!groups.length||resource.refreshing}` không xét refreshError | Chặn export khi snapshot lỗi thời, thông báo rõ, retry thành công mới bật. Không hứa report là snapshot giao dịch nếu API chưa có revision. |
| U03 | P1 C | Quality.tsx gọi `/quality/summary` ngay với partner; không kiểm tra scopeStatus như Overview/Exams | Chờ scope xác thực, không request với partner lưu cũ không hợp lệ; xem A01. |
| U04 | P2 C | Overview refresh chỉ resource.retry, Contacts/Leads/Exams tải cả danh mục | Quy chuẩn refresh: tài nguyên đang xem + danh mục phụ thuộc; không nạp ETL. Scope retry riêng khi lỗi. |
| U05 | P2 C | `ScreenErrorBoundary` dùng H1 bên trong Shell H1; fallback chỉ reset lỗi hoặc reload | Đổi heading đúng cấp trong workspace, kiểm tra retry không tạo loop và thông báo không lộ thông tin nhạy cảm. |
| U06 | P2 C | `Marketing.tsx`, `Sponsorship.tsx` trả null nhưng route vẫn được cấp module | Không nghiệm thu trang trắng; đồng đội cung cấp implementation hoặc trạng thái chưa sẵn sàng rõ ràng trong bản tích hợp, không tự ẩn quyền. |
| U07 | P2 R | `ResponsiveDialog` focus restore về previous; các dialog đóng khi path/data đổi | Test Escape, Tab/Shift+Tab, trigger bị unmount, resize đổi compact, scope đổi; khi trigger biến mất focus về heading hợp lý. |
| U08 | P1 R | CSV và report xuất từ server, abort khi path/scope đổi; browser download bất đồng bộ | Test bấm export rồi đổi search/filter/role/route; không tải nhầm dataset. Không ghi “đã lưu file” khi chỉ gửi yêu cầu browser. |
| U09 | P2 R | Search chỉ áp dụng danh sách và CSV; summary không nhận q | Kiểm tra chuyển mode giữ đúng kỳ vọng, note ngắn; khi drill-down xóa q có thông báo nếu cần. |
| U10 | P2 R | Filter dialog draft/apply và URL filters; cột tùy chọn được chọn trực tiếp | Test Hủy/Áp dụng/xóa chip/Back; Xong cột không áp dụng vào filter; kiểm tra default qua resize và đổi quyền. |
| U11 | P2 R | WorkspacePagination, sys Pager dùng hai pattern | Giữ số trang đơn giản cho workspace; thống nhất vị trí, label, disabled; khi trang vượt giới hạn điều chỉnh một lần, không vòng request. |
| U12 | P2 R | Profile/ThemeStudio/ScopeSelect dùng popup và lazy | Test keyboard, 5 theme, system mode, route đổi khi popup mở và click ngoài. |
| U13 | P2 D | Nhiều thuật ngữ: lead, đối soát, chưa ghi nhận đóng phí, đạt ngưỡng | Giữ từ nghiệp vụ nhất quán, không gọi lead là người duy nhất hay chứng chỉ thật; tránh viết tắt mơ hồ khi thiếu chú giải. |
| U14 | P1 R | Account submit, Admin Users/Partners/Data mutations | Test double submit, lỗi mạng, busy, cancel, quyền bị thu hồi; không replay mutation tự động. |

## Luồng nghiệm thu
- Login sai/đúng, mất mạng, session hết hạn, đăng xuất rồi login người khác; không thấy dữ liệu tài khoản cũ.
- Admin đổi scope Toàn hệ thống → DN → THPT → METAADS; điều hướng mục được cấp quyền, xem scope, export, filter, reset; partner thật không đổi scope tùy ý.
- Overview → phân tích Kết quả thi qua link PM119; nếu PM119 không có, fallback dataset có thông báo. Overview → Contacts không giả làm bộ lọc unpaid chính xác.
- Contacts/Leads/Exams: tìm → lọc → sort → page → chi tiết → chọn tất cả cột → mặc định → CSV → phân tích → drill-down → quay lại. Lặp mobile và keyboard.
- Admin: chỉnh quyền không lưu, chuyển tab, sidebar, back, reload; test xác nhận; mutation đang chạy không đóng dialog tùy tiện.
