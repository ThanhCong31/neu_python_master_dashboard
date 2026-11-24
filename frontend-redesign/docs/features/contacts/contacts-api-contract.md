# Contacts — hợp đồng dữ liệu và ràng buộc nghiệp vụ

Nguồn chính: `main/backend/app/routers/contacts.py`, `filters.py`, `misc.py`, Data Dictionary; đối chiếu source V16. Đây là tài liệu hợp đồng quan sát từ code, không phải API mới. Chưa kiểm tra response trực tiếp trên MongoDB đang chạy. Các ví dụ là fixture.

## 1. Endpoint hiện có

| Method / URL backend | Mục đích | Quyền |
|---|---|---|
| GET `/api/meta/options?partner=...` | Danh mục bộ lọc, date bounds theo scope | Đăng nhập; `contacts` có nếu modules giao với contacts/marketing/overview |
| GET `/api/contacts/summary` | Tổng hợp theo ContactFilters | `require_module("contacts")` |
| GET `/api/contacts/list` | Danh sách JSON phân trang | `require_module("contacts")` |
| GET `/api/contacts/list?format=csv` | Xuất toàn bộ dòng khớp filter/search | Cùng quyền và PII masking |

V16 `api<T>` và `apiFile` tự prefix `/api`; truyền đường dẫn `/contacts/list?...`, không `/api/contacts/list`. Không có GET detail theo ID riêng, POST/PATCH/DELETE contact trong router này. Dùng chính row hiện tải để mở chi tiết chỉ đọc; không dùng q như lookup chính xác vì q tìm substring ở ba trường.

## 2. Scope và quyền (CT26, CT32)

- `useWorkspace()` có `user`, `partner`, `partners`, `scopeStatus`, `retryScope`, `destinations`. Khi scope chưa ready hoặc admin chọn mã không thuộc danh mục, không fetch contact. Không gửi scope từ URL hoặc input nhập tay.
- Admin: `partner=null` toàn hệ thống; code hợp lệ lọc document có `partners` chứa mã. Partner: backend luôn lọc theo `user.partner_code`, bỏ qua partner tùy ý do client gửi. Modules của tài khoản thật vẫn kiểm tra bởi backend; admin scope không tự biến admin thành tài khoản đối tác hay đổi `can_view_pii`.
- `options.viewing_partner` phản ánh scope, kiểm tra đúng giá trị dự kiến. List/summary **không có echo scope**, nên không áp dụng điều kiện equality giống Overview cho hai response này. Gắn request/path với scope và identity; dùng `useResource` + boundary key đúng để không show snapshot trước. Hủy export khi scope, account, query hoặc route đổi; không cache PII trong localStorage/sessionStorage.
- Backend `apply_pii` che email/phone, null `cccd`, `dob`, `notes`, `note` nếu thiếu quyền; `full_name` vẫn có. Không cố giải mask hay thêm nút reveal. Đề xuất detail không hiển thị `cccd`, `dob`, `notes`, `question` trong vòng đầu, kể cả admin, vì không cần cho tác vụ chính; nếu sau này cần, review PII và quyền trước. API hiện vẫn trả các trường được project, frontend không thể thay đổi server exposure.
- Search q tìm email thô trước mask. Với account không có PII, placeholder “Tìm mã hoặc họ tên”; frontend không cung cấp gợi ý search email. Đây chỉ là UX, không ngăn backend regex tìm email qua q; ghi issue backend riêng. Không log email/tên tìm kiếm, không lưu q vào URL, không gửi telemetry. Với người có quyền, label “Tìm mã, họ tên, email”. Không hứa tìm số điện thoại, trường học, substring theo số CCCD.

## 3. Query chung và semantics

| Param | Cách backend lọc | UI |
|---|---|---|
| `partner` | row scope | Shell, không trong filter form |
| `date_from`, `date_to` | `first_touch >= from` và `< to + 1 day`, định dạng ISO ngày | “Ngày tiếp xúc đầu tiên”; cho phép một đầu; chặn khoảng đảo, ngày lỗi |
| `board` | `$in` | Bảng thi (đa chọn) |
| `region` | `$in` | Miền |
| `province` | `$in` | Tỉnh/TP |
| `payment_status` | `$in` | Trạng thái thanh toán theo nguyên văn API |
| `segment` | `$in` | Nhóm CRM, dùng `value` của options, không gửi label |
| `channel` | `$in` | Kênh ghi nhận (final attribution), không gọi first-touch |
| `source` | `sources: {$in: values}` | Nguồn dữ liệu; bất kỳ nguồn đã chọn |
| `pic` | `$in`, `__none__` → null | Người phụ trách, Chưa phân công |
| `venue` | `$in` trường `exam_venue` | Điểm thi |
| `q` | Regex literal, ignore case, trim tối đa 80 ký tự, OR mã/họ tên/email | Tìm trong danh sách; debounce 300ms, không áp dụng phân tích theo quyết định IA |

Các multi-value phân cách bằng dấu phẩy, OR trong một chiều, AND giữa các chiều; bỏ param khi không chọn. `source` dùng any-match, không phải tất cả nguồn. Dùng URLSearchParams encode, giá trị danh mục chứa dấu phẩy thực sự là giới hạn protocol cần báo, không tự escape khác backend. Không có `web_registered`, `paid`, `flagged`, `drip`, `contact_id_exact` filter trong ContactFilters. Không gửi param tưởng tượng, không lọc client một trang để giả lập server.

Options theo scope, không theo filter hiện tại (không phải cascading facets): `board`, `region`, `province`, `payment_status`, `channel`, `source`, `pic`, `venue`: string arrays; `segment`: `{value:string,label:string}[]`; `date_min/date_max`: ngày/giờ hoặc null, chỉ bounds first_touch. `__none__` thêm riêng cho PIC theo semantics backend; không thêm lựa chọn trống cho mọi field nếu chưa kiểm chứng nhu cầu. Nếu danh mục thay đổi, báo chip không còn hợp lệ và bỏ nó bằng thao tác rõ ràng; không tự biến filter cũ thành “Tất cả” rồi fetch rộng hơn trong im lặng.

URL state allowlist: 11 key cấu trúc + `view` (records/analysis). Có thể lưu sort/page/page_size nếu cần back/forward, không đưa q/PII vào URL. Không xóa partner/scope ở Shell khi reset. Canonicalize multi-values bằng trim, dedup và sort ổn định; không thay đổi nghĩa. Khi filter/sort/search/page size đổi, page=1 trong cùng cập nhật state. Trên scope change, clear search, filter draft, row detail, tải options mới; mặc định reset cấu trúc về toàn scope với thông báo và không hiện data cũ. Nếu muốn bảo toàn lựa chọn hợp lệ, chỉ làm ở phiên bản sau khi có test.

Ví dụ hợp lệ (minh họa): `/contacts/summary?board=B%E1%BA%A3ng+A&region=Mi%E1%BB%81n+B%E1%BA%AFc&date_from=2026-08-01&date_to=2026-08-31`. List dùng cùng base + `page=1&page_size=20&sort=contact_id&q=PT-001`. Không dùng ngày hiện tại mặc định; tất cả thời gian có dữ liệu.

## 4. List, sort, paging và CSV

JSON shape: `{total:number,page:number,page_size:number,rows:ContactRow[]}`. page >=1, page_size 1..200, default 20. UI choices 10/20/50/100; API `sort=field` ASC, `-field` DESC, default contact_id ASC; tie breaker `_id`. Whitelist chính xác: `contact_id`, `full_name`, `board`, `province`, `payment_status`, `revenue`, `channel`, `segment`, `pic`, `first_touch`, `web_registered_at`. Không sort email, phone, region, flags, fee, sources, exam_venue. Bảng phải có `aria-sort` và nút sort có thể focus.

`LIST_FIELDS` (những field thực sự được project, có thể missing/null nếu DB thiếu):

| Nhóm | Field |
|---|---|
| Danh tính | `contact_id`, `full_name`, `email`, `phone` |
| Hồ sơ | `board`, `province`, `region`, `exam_venue` |
| Tài chính | `payment_status`, `fee`, `revenue` |
| Nguồn | `channel`, `channel_is_assumed`, `sources`, `utm_partners`, `promo_codes` |
| Vận hành | `segment`, `drip`, `pic`, `first_touch`, `web_registered_at`, `flags` |
| Nhạy cảm / text tự do | `dob`, `cccd`, `notes`, `question` |

Không có `web_registered`, `paid`, `is_registered_valid`, `channel_base`, `school` trong list projection. Không suy các boolean này từ `web_registered_at` vì hồ sơ thiếu ngày vẫn có thể đăng ký web. Dùng nguyên `payment_status`; unknown = nhãn trung tính. `revenue=0` hiển thị 0 ₫, null/missing = —. `flags` thiếu không tự ghi “đã kiểm tra”, `flags=[]` là không có cờ ghi nhận. Trường mảng có thể rỗng; hiển thị text an toàn, không HTML thô.

CSV: backend gọi `find(match, LIST_FIELDS).sort("contact_id",1)` rồi `apply_pii`. **Tất cả kết quả**, không phân trang, sort luôn mã. Backend CSV có BOM UTF-8, 18 trường: mã, họ tên, email, phone, bảng, tỉnh, miền, trạng thái, fee, revenue, channel, segment, drip, sources, pic, first_touch, exam_venue, flags. Không xuất field tự do thêm từ detail. UI dùng `apiFile` và download blob, filename `lien_he.csv`, revoke object URL. Không gửi page/page_size/sort vào CSV query (không tác động kết quả). Trong lúc q debounce, filter draft hoặc request chưa xác nhận, disable export hoặc đồng bộ đúng snapshot được áp dụng. Label “Xuất CSV (N hồ sơ)” chỉ khi N đã biết theo đúng query. Thông báo thứ tự theo mã. CSV không phải toàn bộ báo cáo Overview. Cần kiểm tra CSV formula injection nếu trường đầu vào có `=`, `+`, `-`, `@`; backend hiện csv.writer không thấy escape công thức. Ghi rủi ro backend, không tự biến đổi dữ liệu nghiệp vụ không được duyệt.

## 5. Summary: field và từ điển KPI

`contact_summary(match)` aggregate `$facet` trên contacts: `kpi`, `funnel`, `by_segment`, `by_drip`, `by_sub_segment`, `by_channel`, `by_source_combo`, `by_source`, `by_region`, `by_province`, `by_board`, `by_payment`, `by_pic`, `by_venue`, `by_flag`, `timeline`, `heatmap`. Không tính KPI từ một page rows.

| KPI field | Định nghĩa code | Nhãn/diễn giải |
|---|---|---|
| total | số contact documents | Liên hệ duy nhất (hồ sơ hợp nhất) |
| web_registered | sum boolean web_registered | Đăng ký web |
| paid | sum boolean paid | Đã đóng phí |
| paid_rate | paid / web_registered, null nếu 0 | Tỷ lệ đóng phí / đăng ký web, không phải tất cả contact |
| revenue | sum revenue | Lệ phí ghi nhận, không lợi nhuận |
| unpaid_registered | web_registered AND not paid | Đăng ký chưa ghi nhận đóng phí (có thể gồm miễn phí) |
| unpaid_fees / potential_revenue | sum fee hoặc 0 của nhóm trên; hai field tương đương | Tổng lệ phí ghi nhận của nhóm, không phải dự báo hay khoản phải thu chắc chắn |
| leads_only | not web_registered | Liên hệ chưa đăng ký web, khác số dòng lead nguồn |
| free | payment_status == Miễn phí | Miễn phí; không cộng trừ để tạo KPI hợp lệ nếu không rõ giao nhau |
| external | has_external | Có dữ liệu nguồn ngoài |
| flagged | size(flags)>0 | Số hồ sơ có cờ |
| merged_records | sum(merged_count-1) | Số bản ghi gộp, không phải số người |
| undated_contacts | first_touch null | Thiếu ngày tiếp xúc |
| undated_registrations | web_registered & web_registered_at null | Thiếu ngày đăng ký |
| undated_paid | paid & web_registered_at null | Đóng phí nhưng thiếu ngày đăng ký |

`funnel`: `{stage,value}[]` 3 bước total→web_registered→paid. Kiểm tra số nguyên hữu hạn, không âm, quan hệ total>=web>=paid trước tính tỷ lệ và chiều dài; nếu bất thường, hiển thị giá trị và cảnh báo, không clamp âm để che lỗi. `paid_rate=null` hiển thị “— / Chưa xác định”; không 0% giả. Free không phải đóng phí và không nhất thiết nằm trong nhóm có web ở mọi data.

Các breakdown thông thường `{key, count, web_registered, paid, revenue}`; `by_segment` thêm `name`; key có thể null. `by_flag` chỉ `{key,count}` (không phải Breakdown đầy đủ). `by_source` đếm mỗi membership, có overlap; `by_source_combo` nhóm tổ hợp; không dùng như attribution. `by_venue` là tất cả contact khớp filter, không riêng đã đóng phí; nếu hiển thị `paid` thì ghi rõ count paid theo venue. `by_pic` chỉ phân bổ hồ sơ và kết quả, không phải năng suất lao động. Không tự gán xếp hạng người phụ trách.

`timeline`: `{date,new_contacts,registrations,paid,cum_contacts,cum_registrations,cum_paid}[]`. backend tạo ngày liên tục từ min tới max của first_touch/web_registered_at trong tập đã lọc. `paid` đếm hồ sơ **đã đóng phí hiện tại theo ngày đăng ký**, không ngày thanh toán. Nếu filter first_touch tháng 8 thì timeline đăng ký có thể vượt tháng 8; không cắt dữ liệu hoặc ghi là doanh thu tháng 8. Thiếu ngày hiển thị chú thích riêng; lũy kế chỉ phần có ngày và trong cohort, không hứa khớp KPI tổng. Ngày nghiệp vụ hiển thị nguyên ngày nguồn, tránh parse qua timezone trình duyệt làm lệch ngày; test ngày biên dữ liệu thực trước khi xác nhận timezone.

`heatmap`: `{dow:1..7,hour:0..23,count}` theo ngày đăng ký; chưa có bằng chứng thời điểm gọi hiệu quả. Không cần v1; nếu dùng sau này, xác minh timezone aggregate.

## 6. Các giới hạn phải ghi, không tự sửa backend

| ID | Giới hạn | Cách xử lý frontend / yêu cầu sau |
|---|---|---|
| API-L1 | Không filter exact web_registered / paid / flagged; list không có boolean | Không tạo quick filter “đã đăng ký chưa đóng phí” giả. CTA Overview hiện chỉ mở `/crm`; muốn exact drill-down phải có backend mới hoặc xác minh contract thay đổi. Không dùng payment_status thay thế nhóm này. |
| API-L2 | Không detail endpoint, mutation | Read-only detail từ row; không nút sửa/gọi gửi email tự động |
| API-L3 | Search email trước mask; CSV có thể chứa công thức | Backend/security review riêng; không tự tuyên bố bảo mật hoàn toàn |
| API-L4 | Metadata theo scope, không cascade; summary/list độc lập | Không khẳng định options là facet count; có thể lệch do import đồng thời, refresh theo snapshot rõ ràng |
| API-L5 | Không payment event date, không valid-registrations KPI | Không chart doanh thu theo ngày hay valid rate giả |
| API-L6 | `by_channel` không có breakdown assumed count | Không đánh dấu cả chart là actual, không phân tách giả định ở aggregate bằng suy đoán; row có cờ riêng |
| API-L7 | Vài ghi chú README/ETL khác dataset | Đọc số runtime, kiểm tra schema, không hardcode 145/119/66 |

Nếu backend hoặc teammate cập nhật hợp đồng, ghi change log, kiểm tra OpenAPI thực tại `/api/docs` và response runtime trước khi thay đổi spec.
