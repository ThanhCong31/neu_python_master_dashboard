# Audit Leads — vấn đề và mức độ ưu tiên

Nguồn: `main/frontend/src/pages/Leads.tsx` (L), `components/DataTable.tsx` (T), `FilterBar.tsx` (F), `lib/hooks.ts` (H), `backend/app/routers/leads.py` (A), `filters.py` (B), `misc.py` (M), `etl/loaders.py` (E), `etl/process_and_seed.py` (E2). Các kết luận code là static audit; đánh giá UX/rủi ro cần kiểm thử. P0 = nguy cơ sai dữ liệu/quyền, P1 = tác vụ chính, P2 = refinement. Không coi mọi vấn đề là lỗi backend đã xảy ra trong production.

| ID | Ưu tiên / loại | Vấn đề, bằng chứng và hệ quả |
|---|---|---|
| L01 | P1 UX | L đặt 6 KPI và 11 biểu đồ trước bảng; tra cứu phải cuộn quá nhiều. |
| L02 | P1 UX | Tất cả 13 cột L mặc định; chiều rộng lớn, câu hỏi dài đẩy hàng cao. |
| L03 | P1 UX | T không có chi tiết hồ sơ, khó xem note, vùng, tự khai, dòng gốc. |
| L04 | P1 UX | L dùng 9 nhóm lọc (ngày + 8 nhóm đa chọn), F áp dụng từng thay đổi; khó thao tác mobile, nhiều request liên tiếp. |
| L05 | P0 code | L hardcode date min 2026-08-01/max 2026-09-30; M không trả date bounds của leads, có thể chặn dữ liệu mới hoặc ngoài kỳ. |
| L06 | P0 code | L chú thích tổng dòng lead với unique_contacts nhưng nhiều KPI dùng chữ lead không ghi rõ đơn vị; dễ hiểu lead mới là người duy nhất. |
| L07 | P0 semantics | A new_leads đếm result == Lead mới, không distinct; không gọi đây là số người mới hoặc tỷ lệ chuyển đổi trả phí. |
| L08 | P0 code | L RESULTS cố định 3 nhãn; A trả mọi result, E map nhãn đã biết nhưng giữ nguyên nhãn lạ. Biểu đồ bỏ mất nhóm lạ/null. |
| L09 | P0 code | L dùng sources từ by_source_result và series cố định; cần giữ nguồn lạ, null, không suy đoán nguồn theo platform. |
| L10 | P0 semantics | E source chuẩn hóa Talkshow, E2 Talkshow Google Form; không map thành một value gửi API nếu chưa có alias contract. |
| L11 | P0 code | A weekly.start = min(created_at) trong tuần/nguồn, không phải thứ Hai. L dùng min làm nhãn tuần, gây sai nghĩa, bỏ năm. |
| L12 | P1 code | A weekly chỉ có tuần có ngày; L không biểu thị tuần trống hoặc dòng thiếu ngày. Khoảng trống thời gian bị nén. |
| L13 | P0 semantics | E2 tự điền timestamp khi thiếu; E giữ to_dt. API không có cờ nhận biết fallback. Không khẳng định mọi timestamp là thực đo. |
| L14 | P0 semantics | self_declared là tự khai/giá trị ETL, không xác minh CRM; E2 FB gán Chưa đăng ký. Không biến thành tỷ lệ đăng ký thực tế. |
| L15 | P1 semantics | wants_talkshow đếm true trên dòng; E yes() và E2 mặc định khác nhau. False không chứng minh người dùng từ chối. |
| L16 | P0 privacy | T hiển thị question dài mặc định; A trả question cả summary và CSV, B không mask question. Văn bản tự do có thể chứa PII. |
| L17 | P0 privacy | B mask email/phone và ẩn note, không ẩn full_name/question. Không diễn giải can_view_pii=false là ẩn toàn bộ danh tính. |
| L18 | P0 code | T search q chỉ list/CSV, L ghi ít ngữ cảnh; KPI/biểu đồ không đổi. Cần nêu phạm vi rõ. |
| L19 | P0 code | H giữ data cũ khi path đổi (scope/filter) đến khi response mới; nguy cơ hiển thị sai phạm vi. V20 useResource xử lý path; vẫn cần boundary identity. |
| L20 | P1 code | T reset page qua effect sau khi filter/search/sort thay đổi; có thể phát request trang cũ trước khi reset. |
| L21 | P1 code | T dùng index làm key, click th sort thiếu button keyboard; duplicate contact_id không thể là row key thay thế. |
| L22 | P1 semantics | A không trả _id, row_no có thể null; (source,row_no) hữu ích nhưng không có unique constraint xác nhận. Không dùng như ID bền vững cho edit. |
| L23 | P1 code | T gửi sort trong CSV; A CSV luôn sort created_at tăng dần, xuất mọi dòng khớp. Không hứa giống thứ tự/trang hiện tại. |
| L24 | P0 risk | B csv_response ghi string trực tiếp vào CSV; công thức spreadsheet từ text người dùng có thể được thực thi khi mở. Cần backend review riêng, không tuyên bố CSV an toàn tuyệt đối. |
| L25 | P0 semantics | E campaign có NO_PERMISSION_CAMPAIGN; không coi thiếu quyền là tên chiến dịch thật hoặc tự suy diễn ad_name/adset_name (không có trong A list). |
| L26 | P1 UX | L gộp campaign/heard_from bằng fallback mà không ghi ý nghĩa khác nhau; Talkshow biết qua đâu khác chiến dịch FB. |
| L27 | P1 semantics | by_campaign, by_platform, by_heard_from, by_self_declared, by_question loại null, không phải toàn bộ mẫu; mẫu số phải rõ. |
| L28 | P1 UX | L 8 simple bar phân bố + câu hỏi; trùng nhiệm vụ, tốn chart instances; gộp selector, loại câu hỏi khỏi aggregate. |
| L29 | P1 UX | L không hỗ trợ drill-down chính xác từ chart; B chỉ có 8 filter nhóm, không có heard_from/self_declared/question. |
| L30 | P1 code | M distinct bỏ null/empty; muốn lọc PIC null có thể dùng __none__ (B), không coi null tương đương chuỗi rỗng. |
| L31 | P1 risk | T/H lỗi lần đầu và lỗi refresh hiển thị không rõ; không distinction 0 và missing, không disable export khi search pending. |
| L32 | P1 UX | L chart height và nhãn cố định, nhiều long labels; cần container responsive, table fallback, không bỏ data point. |
| L33 | P1 UX | F popover cũ, keyboard/ARIA và focus chưa đầy đủ; dialog batch với focus restore và full-screen compact. |
| L34 | P1 risk | B search regex trên email thực dù masked output, có thể tạo inference; không nới lỏng quyền, báo backend review. |
| L35 | P1 architecture | V20 đã có PageRefresh/Shell H1 duy nhất; không copy page header cũ hoặc thêm nút cập nhật khác chỗ. |

## Giữ / bỏ / thay thế

Giữ mọi bộ lọc được B hỗ trợ, CSV, table/pager/sort, kết quả đối soát, weekly, phân nhóm có ý nghĩa. Chuyển thông tin campaign, nguồn biết đến, question (chỉ theo chính sách chi tiết), note, row_no vào detail. Không phát sinh tính năng ghi. Không lặp doanh thu, phễu chuyển đổi, ngân sách; các màn hình khác đã phụ trách. Không copy global export cũ. Không hardcode số liệu seed.

## Blocker cần phân biệt

Không có exact-ID contact lookup, detail endpoint, update, source-specific date bounds, cờ thời gian giả định, quyền riêng question, trạng thái campaign chuẩn giữa hai ETL. Có thể triển khai chức năng đọc với guard và mô tả hạn chế; việc thay đổi backend thuộc phạm vi riêng. Không đưa link chính xác đến hồ sơ Contacts nếu chỉ có q regex; không gửi PII qua URL. Nếu nhu cầu drill-down cross-route được duyệt, thiết kế contract exact ID riêng hoặc ghi rõ tìm kiếm gần đúng.
