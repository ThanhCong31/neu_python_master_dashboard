# Leads — hợp đồng API hiện hành

Căn cứ router leads.py, LeadFilters, meta/options, apply_pii, paginate, csv_response; không đề xuất field mới như thể đã tồn tại. `api` và `apiFile` tự thêm `/api`. GET đọc dữ liệu; require_module("leads") tại summary/list. Scope do backend xác định; admin partner hợp lệ, partner account bị giới hạn theo account (không tin query partner).

## Endpoints

| Method/path frontend service | Query | Response |
|---|---|---|
| GET /meta/options | partner (admin) | viewing_partner, leads? (theo module), các module khác bỏ qua |
| GET /leads/summary | filter nghiệp vụ (không q trong UI mới), partner | kpi, by_source_result, weekly, breakdowns |
| GET /leads/list | filter, partner, q, page, page_size, sort | total, page, page_size, rows |
| GET /leads/list?format=csv | filter, partner, q | text/csv; charset=utf-8, BOM, filename lead_talkshow_fb.csv |

Không có GET /leads/:id hoặc POST/PATCH/DELETE trong router này. Không gọi detail endpoint tự tạo; detail từ row đã được server trả. Không có export PDF/XLSX/Word riêng cho leads. CSV toàn bộ dòng match, sort created_at asc cố định, không gửi page/page_size/sort. JSON default sort -created_at, tie _id asc. Page ≥1, size 1–200; UI 10/20/50/100 mặc định 20. Sort allowlist created_at, source, result, segment, campaign, full_name, contact_id; không sort phone/PIC/row_no/province. Sai sort 400.

## Filters

| Query | Mongo field | Label UI |
|---|---|---|
| date_from, date_to | created_at | Ngày gửi biểu mẫu (theo dữ liệu ghi nhận) |
| source | source | Nguồn biểu mẫu |
| board | board_interest | Bảng thi quan tâm |
| region | region | Miền |
| result | result | Kết quả đối soát |
| segment | segment | Nhóm CRM |
| campaign | campaign | Chiến dịch |
| platform | platform | Nền tảng |
| pic | pic | Người phụ trách |
| q | contact_id, full_name, email | Tìm trong danh sách |

Ngày YYYY-MM-DD, từ đầu ngày tới trước đầu ngày sau date_to; không gọi giờ Việt Nam nếu backend lưu UTC khác. Cho phép một đầu mở; validate lịch thật và from ≤ to. M.leads không có date_min/max; không hardcode. Date filter loại created_at null. Multi-value CSV, trim, OR trong nhóm AND giữa nhóm; `__none__` map null (không bao hàm empty string). Option chứa dấu phẩy không biểu diễn nguyên vẹn, phải báo giới hạn; không tách giả. q trim, 80 ký tự theo B, literal regex escaped, case insensitive; không tìm SĐT, không exact ID, không hứa accent-insensitive. Search giữ trong memory, không localStorage/URL. Structural filters URL, mode URL; không gửi mode vào API. Query key ổn định, không tin partner từ URL.

Options.leads: source/result/campaign/platform/segment/region/board/pic đều là string[] (khác Contacts segment object). _distinct bỏ null/empty. Hiện lựa chọn PIC chưa phân công bằng __none__ với label rõ; không tự suy ra các option từ data của scope cũ. viewing_partner phải khớp effective scope. Không có option province/heard_from/self_declared/question/wants_talkshow.

## Summary

| Field kpi | Nghĩa |
|---|---|
| total | Số dòng leads khớp filter |
| unique_contacts | Số contact_id khác nhau và truthy; không đếm null/rỗng |
| new_leads | Dòng có result Lead mới |
| in_data | Dòng có result Đã có trong Data |
| dup_external | Dòng có result Trùng trong form ngoài |
| wants_talkshow | Dòng có wants_talkshow truthy |
| self_declared_registered | Dòng có self_declared đúng Đã đăng ký |

Count là số nguyên không âm; total = 0 => hiển thị 0, ratio = null/—. unique_contacts ≤ total. Ba kết quả chuẩn có thể không phủ total; đối chiếu by_source_result, giữ nhóm khác/null. Không ép total bằng tổng 3 field. Tỷ lệ dòng mới = new_leads/total, không gọi conversion rate. Không lấy total - unique_contacts làm số trùng: còn ID trống. Không cộng counts unique giữa nhóm hay partner; scope overlap. Không so sánh KPI khi filter khác nhau.

`by_source_result`: {source:string|null,result:string|null,count:number}[] (cho phép null/unknown để UI phòng vệ). `weekly`: {week:string,source:string|null,start:string,count:number}[]; week ISO `YYYY-Www`, start ngày có bản ghi đầu trong nhóm, không phải Monday. Backend $dateToString không chỉ định timezone => UTC mặc định; client không chuyển nhãn tuần theo timezone local. Dùng ISO week key có năm, validate week 53; không dùng start làm ngày đầu tuần. Có thể chèn 0 tuần thiếu giữa hai tuần có dữ liệu khi range hợp lý; không tạo count ngoài phạm vi. Nếu khoảng dài, giữ dữ liệu đầy đủ trong table, chọn window/zoom rõ ràng; không tự gộp/sampling count. `total - sum(weekly.count)` có thể cho số dòng không có tuần nếu count hợp lệ cùng snapshot, phải cảnh báo nếu âm hoặc không khớp. ETL E2 có ngày fallback; API không có flag nên ghi chú nguồn timestamp, không suy ra dòng cụ thể là giả.

Breakdowns `{key:string|null,count:number}[]`: by_source, by_campaign, by_platform, by_heard_from, by_region, by_board, by_segment, by_pic, by_self_declared, by_question. Các nhóm campaign/platform/heard_from/self_declared/question loại null; tổng nhóm không nhất thiết bằng total. Empty string có thể khác null. Label missing rõ. Tỷ lệ trên tổng dòng có giá trị trường phải ghi mẫu số. `by_question` chứa text tự do; không hiển thị aggregate trong V21–23.

Drill-down exact chỉ by_source→source, by_campaign→campaign, by_platform→platform, by_board→board, by_region→region, by_segment→segment, by_pic→pic, source+result khi cả hai có option hợp lệ. Giữ filter khác, thu hẹp giá trị trong dimension, clear q/page=1, chuyển list; nếu null PIC dùng __none__, nếu chuỗi chứa comma hoặc không có option thì không render action. by_heard_from/by_self_declared không có filter tương ứng. Không tạo filter unique contact, không filter question.

## List row

Type theo projection; nullable/optional khi backend thiếu trường:

- source, contact_id, result, segment, full_name, board_interest: string|null; row_no: number|null; created_at: ISO datetime|null.
- email, phone, province, region, self_declared, question, campaign, heard_from, platform, pic, note: string|null.
- wants_talkshow: boolean|null; true ghi Có ghi nhận nhu cầu, false Không ghi nhận, null Chưa có dữ liệu. Không dùng truthiness để đánh đồng null và false.
- Không có _id, school_raw, ad_name, adset_name, payment_status, revenue, web_registered hay current CRM status. Không suy ra từ result hoặc self_declared.

Row là submission, nhiều row cùng contact_id. Key theo response snapshot + source/row_no + index discriminator nếu trùng/thiếu; selection giữ đúng object của snapshot, đóng detail khi query/scope/snapshot thay đổi. Không dùng index để identify bền vững khi sort. Hiển thị Contact ID là mã liên kết tham chiếu, không phải mã dòng lead. Không gọi contact q exact nếu không có contract.

## Privacy và lỗi

Backend mask email/phone, ẩn note khi can_view_pii=false; full_name và question không được mask. UI không reconstruct, không log response/PII, không persist PII, detail không show question/note cho masked role. Với admin xem scope đối tác, quyền theo tài khoản thật, không giả vờ impersonate quyền PII đối tác. CSV vẫn do backend trả question; không tuyên bố đã mask toàn bộ. Cần review chính sách question và CSV formula injection trước production; UI không tự sửa CSV âm thầm; cảnh báo export chứa dữ liệu nhạy cảm, dùng file tin cậy. Không lưu dữ liệu trong telemetry/screenshot test. 401 xử lý service, 403 no access, 400/422 filter error, abort scope/request stale, same path refresh lỗi giữ data có cảnh báo. Refresh options + active resource, không gọi ETL. Disable export khi path chưa ready, options invalid, search pending; abort khi query/scope/mode/unmount. Không hứa trình duyệt đã lưu file thành công.
