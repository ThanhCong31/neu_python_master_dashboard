# NEU Admissions BI — Audit màn hình Tổng quan

**Ngày:** 24/11/2026 · **Trạng thái:** Đề xuất để thảo luận, chưa sửa code.
**Đối tượng audit:** frontend cũ `frontend/` trên `main`, không phải `frontend-redesign/`.
**Phương pháp:** Đọc mã nguồn React, CSS, API FastAPI, quy tắc nghiệp vụ và ETL; đối chiếu bản `neu-dashboard-existing-issues.md` đã lập ngày 23/11/2026. Đây là source audit, chưa phải kiểm thử trực tiếp với dữ liệu MongoDB, ảnh chụp runtime hoặc nghiên cứu người dùng.

## 1. Kết luận điều hành

Tổng quan hiện tại đã có đủ nền tảng dữ liệu để xây dựng một màn hình điều hành có giá trị: API tổng hợp theo module, phạm vi đối tác, phễu, chuỗi thời gian, dữ liệu thi và tài trợ. Vấn đề chính không phải thiếu số liệu mà là **chưa phân biệt rõ tổng quan điều hành với báo cáo phân tích chuyên sâu**. Người dùng phải đọc nhiều KPI và biểu đồ, trong khi ý nghĩa phạm vi lọc, thời điểm và mức độ tin cậy của chúng không đồng nhất.

Ba lỗi ảnh hưởng đến độ tin cậy cần được ưu tiên trước khi thiết kế giao diện mới: ROI sử dụng ngân sách và doanh thu có thể khác phạm vi; chú thích điểm thi không khớp quy tắc phân loại; các khối cùng màn hình chịu các bộ lọc khác nhau. Thay đổi màu sắc hoặc thư viện chart không tự giải quyết được các vấn đề này.

Mục tiêu audit là xác định đúng hiện trạng. Phương án thiết kế và các quyết định đề xuất được tách riêng trong [overview-plan.md](overview-plan.md).

## 2. Nguồn đã kiểm tra

Repository: [`chiinthedesert/neu_python_master_dashboard`](https://github.com/chiinthedesert/neu_python_master_dashboard). Git tree `main` đọc được có SHA `89ec8638ddc751f03c38ce4ea0bdb2ca79be0464`. Các đường dẫn bên dưới thuộc `main`, đọc tại thời điểm audit; nhánh có thể thay đổi sau đó.

| Mã | File / khu vực | Vai trò |
|---|---|---|
| S1 | [frontend/src/pages/Overview.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/pages/Overview.tsx) | Bố cục, KPI, điều kiện render và các liên kết |
| S2 | [frontend/src/components/Viz.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/Viz.tsx) | FunnelCard, TimelineCard, StatusStackCard |
| S3 | [frontend/src/components/FilterBar.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/FilterBar.tsx), [Contacts.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/pages/Contacts.tsx) | Bộ lọc, preset, contactFilterDefs |
| S4 | [frontend/src/lib/hooks.ts](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/lib/hooks.ts) | useApi, useScope, useUrlFilters |
| S5 | [ChartCard.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/ChartCard.tsx), [styles.css](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/styles.css), [charts.ts](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/lib/charts.ts), [format.ts](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/lib/format.ts) | Chart/table toggle, CSS grid, formatter |
| S6 | [backend/app/routers/overview.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/routers/overview.py) | API tổng hợp, snapshot thi, xuất báo cáo |
| S7 | [backend/app/filters.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/filters.py), [contacts.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/routers/contacts.py) | Phạm vi, bộ lọc, cách tính KPI, timeline |
| S8 | [backend/app/routers/marketing.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/routers/marketing.py), [Marketing.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/pages/Marketing.tsx) | ROI, ngân sách, attribution |
| S9 | [backend/app/routers/misc.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/routers/misc.py) | Meta options, quality, sponsorship |
| S10 | [docs/DATA_DICTIONARY.md](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/docs/DATA_DICTIONARY.md), [backend/etl/process_and_seed.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/etl/process_and_seed.py) | Paid, attribution, grade_of, chứng chỉ và dữ liệu |
| S11 | [Layout.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/Layout.tsx), [App.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/App.tsx), [ExportBar.tsx](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/frontend/src/components/ExportBar.tsx), [reports.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/reports.py) | Điều hướng, export và báo cáo thực tế |
| S12 | [partners.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/partners.py), [security.py](https://github.com/chiinthedesert/neu_python_master_dashboard/blob/main/backend/app/security.py) | Module và quyền theo người dùng |

Tài liệu audit trước: `neu-dashboard-existing-issues.md` (bản đã tạo trong cuộc trao đổi, đọc lại toàn bộ). Không mặc định tất cả vấn đề cũ vẫn tồn tại trên V9. V9 là nền triển khai, không phải đối tượng audit này.

## 3. Màn hình cũ đang làm gì?

### 3.1. Cấu trúc theo thứ tự xuất hiện

```text
Layout (global)
├── Topbar: Tổng quan + phạm vi dữ liệu (admin)
├── ExportBar: Excel / Word / PDF
└── Overview
    ├── Thời gian / Bảng / Miền / Xóa bộ lọc
    ├── Cảnh báo lỗi / ghi chú scope
    ├── CRM (nếu response có crm)
    │   ├── Doanh thu lệ phí (hero), liên hệ, đăng ký web,
    │   │   tỷ lệ thanh toán, doanh thu tiềm năng, ROI (có ngân sách)
    │   ├── Phễu tuyển sinh | Tăng trưởng theo thời gian
    │   └── Segment CRM | Kênh thu hút
    ├── Marketing (nếu có kênh nhìn thấy ngân sách)
    │   └── Ngân sách và doanh thu theo kênh + bảng + link ROI/CPA
    ├── Kết quả thi (nếu có exams)
    │   ├── 5 KPI, chú thích bộ 119 thí sinh
    │   └── Xếp loại vòng loại theo bảng + bảng + link điểm thi
    ├── Nhà tài trợ (nếu có sponsorship)
    │   └── 3 KPI: tiến độ, reach, engagement
    └── Dữ liệu thô → sạch (nếu có pipeline)
        └── 3 KPI: tổng dòng thô, liên hệ duy nhất, bản ghi gộp
```

Ở cấu hình đầy đủ có tối đa 17 ô KPI (6 CRM/ROI + 5 thi + 3 tài trợ + 3 pipeline), 6 biểu đồ; mỗi biểu đồ còn có nút đổi sang bảng. Không phải mọi tài khoản đều nhìn thấy toàn bộ. CSS sử dụng grid 12 cột, các chart card gần đồng dạng; hero doanh thu lớn hơn các KPI khác (48px so với 26px), nên không thể nói rằng giao diện cũ hoàn toàn không có phân cấp. Breakpoint 1100px chuyển phần lớn chart thành một cột; ở chiều rộng vừa màn hình trở nên dài. [S1, S2, S5]

### 3.2. Luồng dữ liệu

- `useScope()` nhận mã đối tác từ context. `useUrlFilters()` đọc bốn query key `date_from`, `date_to`, `board`, `region`.
- `GET /api/meta/options?partner=...` cung cấp option `contacts`; `contactFilterDefs(..., false)` tái sử dụng bộ lọc CRM.
- `GET /api/overview?partner=...&...` trả `modules`, `viewing_partner` và các nhóm tùy quyền: `crm`, `marketing`, `exams`, `sponsorship`, `pipeline`.
- Backend gọi `contact_summary`, `marketing_summary`, `_exam_snapshot` và aggregate tài trợ. Admin chọn đối tác thì các nhóm dựa vào module của đối tác lưu trong DB; admin vẫn là admin. `pipeline` chỉ được thêm khi admin không chọn đối tác, và có thể null nếu meta chưa tồn tại.
- Frontend cũ giữ response trước đó khi fetch mới; chỉ thay data khi thành công. [S4, S6–S9, S12]

### 3.3. Ma trận bộ lọc thực sự áp dụng

| Nhóm dữ liệu | Partner scope | Từ/đến ngày | Bảng | Miền |
|---|---|---|---|---|
| CRM KPI, phễu, breakdown, timeline | Có | Có, theo `first_touch` | Có | Có |
| Marketing: liên hệ, đăng ký, doanh thu | Có | Có, theo `first_touch` | Có | Có |
| Marketing: ngân sách | Có, quyền theo kênh | Không | Không | Không |
| Exams PM119 | Có | Không | Có | Có |
| Sponsorship | Có | Không | Không | Không |
| Pipeline | Chỉ admin toàn hệ thống | Không | Không | Không |

**Hệ quả:** ngay cả khi dùng cùng một endpoint, các chỉ số không có cùng cửa sổ phân tích. Lọc ngày không phải lọc ngày đóng phí, ngày thi hay ngày chi ngân sách. Khi lọc CRM theo ngày tiếp xúc đầu tiên, ngày đăng ký của những hồ sơ đó có thể nằm ngoài khoảng lọc. [S6–S8]

## 4. Sổ vấn đề chi tiết

Quy ước: **P0** = phải giải quyết/né an toàn trước khi phát hành; **P1** = cần giải quyết để UX tốt và ổn định; **P2** = cải thiện sau hoặc cần kiểm chứng. `Code` là hành vi chứng minh từ nguồn, `UX` là đánh giá chuyên gia, `Risk` là rủi ro cần thử bằng runtime/data. Không đánh đồng rủi ro với lỗi đã xảy ra ở production.

| ID | Ưu tiên / loại | Vấn đề và tác động | Bằng chứng / liên hệ audit cũ |
|---|---|---|---|
| OV-01 | P0 · Code | ROI khi lọc ngày/bảng/miền lấy doanh thu đã lọc, ngân sách nguyên kênh. Có thể biến chỉ số thành giá trị âm lớn khi người dùng chỉ chọn một phần dữ liệu. | S1, S6, S8; A02 |
| OV-02 | P0 · Code | FilterBar nằm trên cả trang, nhưng thi chỉ theo bảng/miền; tài trợ và pipeline không theo 3 bộ lọc; không có giải thích cạnh từng khối. | S1, S6–S8; A03, C17 |
| OV-03 | P0 · Code | Timeline gọi chuỗi `cum_paid` là “Đã thanh toán (luỹ kế)” theo ngày đăng ký, không phải ngày thanh toán. Dễ hiểu nhầm tiến trình thu tiền. | S2, S7; A06, C17 |
| OV-04 | P0 · Code | Chú thích xếp loại: Khá ≥600, Trung bình ≥400; ETL `grade_of` dùng ≥650, ≥500. Chart sử dụng grade server nên chú thích và dữ liệu không khớp. | S1, S10; A01 |
| OV-05 | P0 · Code/Risk | Overview không phân biệt các kênh có attribution/ngân sách giả định dù Marketing có cảnh báo; `roi_program` có thể gộp cả mô phỏng. Không được coi là lợi nhuận thực tế. | S1, S8, S10; A04 |
| OV-06 | P0 · Code/Risk | `useApi` giữ data cũ khi đổi scope; render cũ vẫn nhìn thấy trong lúc loading và sau lỗi. Admin có thể thấy số liệu toàn hệ thống dưới scope vừa chọn. Đây là rủi ro gắn sai ngữ cảnh UI, không khẳng định truy cập trái phép backend. | S1, S4, S11; B12 |
| OV-07 | P1 · Code | Ghi chú “hiển thị đúng những gì tài khoản đối tác này nhìn thấy” quá mạnh: backend vẫn xử lý người đăng nhập admin, chỉ áp dụng dữ liệu/module đối tác; navigation theo user.modules. | S1, S6, S11, S12; B12 |
| OV-08 | P1 · Code/UX | Điều kiện `crm` bao quanh cả ROI tile; nếu tài khoản có marketing nhưng không có contacts, không có KPI marketing cấp đầu; nếu không có kênh ngân sách, không có cả chart marketing. | S1; B11 |
| OV-09 | P1 · Code/Risk | Nếu chỉ có overview/leads hoặc không có nhóm dữ liệu trả về, có thể xuất hiện màn hình gần trống. Response rỗng khác với không có quyền, chưa nạp dữ liệu hay lỗi mạng. | S1, S4, S6; B11 |
| OV-10 | P1 · Code | Initial request không có trạng thái loading riêng rõ ràng; lỗi chỉ Note, không nút retry tại Overview. | S1, S4 |
| OV-11 | P1 · Code | `contactFilterDefs(opts?.contacts, false)` trả [] khi options chưa có/lỗi, không có trạng thái lỗi option. Options exam không được dùng cho tài khoản tập trung thi. | S1, S3, S9; C17 |
| OV-12 | P1 · Code/UX | “Đã thanh toán” không đồng nghĩa đăng ký hợp lệ; diện miễn phí được phân biệt bởi data dictionary. Phần `unpaid_registered` thực tế là web_registered && !paid, có thể chứa miễn phí nếu dataset có nhóm đó. Hint “người chưa thanh toán” cần định nghĩa. | S1, S7, S10; A06 |
| OV-13 | P1 · Code/UX | Doanh thu tiềm năng là tổng `fee` của hồ sơ web chưa paid, không phải dự báo xác suất hay cam kết thu được. | S1, S7; A06 |
| OV-14 | P1 · Code | Tên “Kênh thu hút (attribution)” sử dụng `crm.by_channel`, nhóm theo `channel` (final attribution theo dictionary), không phải `channel_base`. | S1, S7, S10; A04 |
| OV-15 | P1 · Code/Risk | `StatusStackCard` chia count thành paid / web-paid / count-web; miễn phí bị tính trong web-paid nếu paid chỉ là đóng tiền. Nếu dữ liệu vi phạm quan hệ tập con còn có khả năng âm; chưa kiểm dữ liệu runtime. | S2, S7, S10; A06 |
| OV-16 | P1 · Code | Tiêu đề 119 thí sinh và hint 5 kênh cố định; không thể suy ra số kênh từ `sponsorship` response (chỉ benefits, avg_progress, total_reach, total_engagement). `exams.kpi.count` đếm documents, không kiểm điểm khác null. | S1, S6; A05 |
| OV-17 | P1 · Code/UX | Chứng chỉ là `max(VL, CK) >= 600` trong ETL hiện tại, không chỉ điểm vòng loại; top 10% theo toàn bảng đã tính trước, không tính lại theo filter. Rank đồng điểm có thể cho số vượt vòng loại vượt ceil(10%). | S1, S6, S10; A01/A06 |
| OV-18 | P1 · Code/Risk | `grades` chart chỉ vẽ 4 grade cố định. Giá trị null/lạ có thể có trong bảng nhưng không vẽ; chênh tổng chart và count. Cần kiểm PM119 thực tế. | S1, S6, S10 |
| OV-19 | P1 · Code/UX | Tiến độ quyền lợi là trung bình cộng progress, không phải % số hạng mục hoàn thành; reach là tổng lượt các kênh, không phải số người duy nhất. Tổng 0 khi không có reach không phân biệt thiếu dữ liệu. | S1, S6; A06 |
| OV-20 | P1 · Code/UX | ExportBar hiển thị nhiều trang nhưng đều gọi overview/export, đọc 11 filter keys. Báo cáo tổng hợp cả phần không hiện trên trang; _filter_note chỉ ghi một số key, chưa mô tả phạm vi khác nhau hoặc giả định. | S11; C19 |
| OV-21 | P1 · UX | Nhiều lớp thông tin chuyên sâu ngang nhau: 17 KPI, 6 chart, section CRM/Marketing/Thi/Tài trợ/Pipeline nối dài. Người dùng khó biết nên bắt đầu ở đâu và làm gì tiếp. | S1, S5; B07, C13, C14 |
| OV-22 | P1 · UX | Segment CRM, channel performance, grade chi tiết, pipeline trùng với nhiệm vụ của trang chuyên trách. Việc lặp không mặc nhiên xấu, nhưng ở đây mức độ chi tiết lớn và thiếu đường dẫn CRM/quality rõ ràng. | S1, S2, S11; B08, B09 |
| OV-23 | P1 · UX | DN không có CRM vẫn phải đọc trang theo cấu trúc admin; hero chỉ được đổi sang số hồ sơ thi, chưa có ưu tiên tài trợ. Tài khoản marketing-only không có hero phù hợp. | S1, S12; B11 |
| OV-24 | P1 · Code/Risk | Note dữ liệu thiếu ngày chỉ xuất hiện trong TimelineCard; điều kiện hiển thị xét undated.contacts/registrations, không chỉ undated.paid. Không nên hiểu timeline cuối bằng KPI toàn bộ nếu thiếu ngày. | S2, S7 |
| OV-25 | P1 · Code/UX | Các nút lọc dropdown tự xây dựng có click outside và Escape, nhưng chưa thể hiện đầy đủ điều hướng bàn phím listbox, focus return, multi-select semantics. Cần test, không khẳng định tất cả bị lỗi. | S3, S4; C18 |
| OV-26 | P2 · UX | Mỗi chart có bảng tương đương là ưu điểm accessibility, nhưng lặp nút “Bảng” ở mọi card tạo nhiều điều khiển; bảng dạng snapshot không thay thế trang nghiệp vụ. | S2, S5; C13 |
| OV-27 | P2 · Code/UX | Preset 7/30/90 ngày dựa vào ngày hiện tại, có thể luôn rỗng với dataset lịch sử; tháng có dữ liệu được cung cấp nhưng nằm sau preset. | S3 |
| OV-28 | P2 · UX | Tiền compact “tr”, “N” thiếu đơn vị ₫ ở một số tile; label 12.5px, hint 12px. Không phải lỗi dữ liệu nhưng giảm khả năng quét. | S5 |
| OV-29 | P2 · Risk | API overview gọi contact_summary tổng hợp nhiều facets rồi chỉ lấy một phần; options cũng đọc nhiều trường. Có nguy cơ overfetch/độ trễ, nhưng chưa benchmark. | S6, S7, S9 |
| OV-30 | P1 · Code/UX | Pipeline all-system xuất hiện cạnh các KPI CRM có thể đã lọc. Liên hệ duy nhất xuất hiện lần hai, khiến người dùng so sánh hai phạm vi khác nhau. | S1, S6; B08, A03 |

### 4.1. Ví dụ đọc sai chỉ số — minh họa, không phải dữ liệu NEU

Giả sử kênh có ngân sách toàn kỳ 10 triệu và doanh thu toàn kỳ 15 triệu; ROI theo công thức hiện tại là 50%. Người dùng lọc một vùng còn 2 triệu doanh thu, ngân sách vẫn 10 triệu: ROI trả về -80%. Con số -80% là phép tính đúng theo input, nhưng không cho biết vùng đó lỗ 80% vì chưa có ngân sách của vùng. Đây là OV-01.

Nếu một thí sinh đăng ký ngày 01/08 và đóng phí ngày 05/08, timeline backend cộng trạng thái paid vào ngày đăng ký 01/08. Nó không chứng minh tiền về ngày 01/08. Đây là OV-03.

Nếu admin đổi từ Toàn hệ thống sang DN, giao diện cũ có thể còn render `crm` của scope trước trong lúc request DN đang chạy. Nếu request lỗi, dữ liệu đó vẫn còn vì hook không xóa. Đây là OV-06.

### 4.2. Điều cần giữ lại từ frontend cũ

- API hợp nhất theo module và scope; không cần chuyển sang nhiều endpoint chỉ vì muốn UI đẹp.
- Funnel ba tầng, KPI có định nghĩa rõ, chuỗi thời gian, bảng dữ liệu tương đương chart, và link tới màn hình nghiệp vụ.
- Tài khoản không có CRM vẫn được xem phần thi/tài trợ phù hợp; không ép tất cả cùng có một dashboard CRM.
- Dark/light theme và khả năng đọc số liệu chính xác; giữ bảng chi tiết ở màn hình chuyên trách, không loại bỏ dữ liệu nguồn.
- Không thay đổi quy tắc backend hoặc dữ liệu Excel để làm demo.

## 5. Các câu hỏi cần chốt và giới hạn

1. KPI ưu tiên cho admin là doanh thu hay chuyển đổi tuyển sinh? Đề xuất trong plan ưu tiên quy mô đăng ký và hành động với hồ sơ chưa paid, doanh thu là headline tài chính trong cùng nhóm.
2. Có cần xuất báo cáo ở phiên bản Overview đầu tiên không? Endpoint có thật nhưng báo cáo chứa nhiều chi tiết hơn UI và không xử lý đầy đủ ngữ cảnh giả định. Phải kiểm chứng trước khi bật lại.
3. Data dictionary và ETL hiện tại không nhất thiết phản ánh mọi dataset. ETL đã đọc cho thấy một số đường nạp chỉ tạo trạng thái paid/chưa thanh toán, nhưng không suy ra toàn DB không có miễn phí, lead hay kênh giả định. Kiểm fixture/live response đã khử PII.
4. Chưa có dữ liệu thời gian thanh toán, ngân sách theo kỳ/vùng, KPI lead trực tiếp hay số kênh tài trợ trong response Overview. Không tự thêm chỉ số nếu chưa có hợp đồng API.
5. Kiểm thử role/partner phải dùng quyền hiện hành từ backend, không dựa vào danh sách mặc định `partners.py`. Các đối tác có thể chồng lấn; không cộng chúng thành tổng chương trình.

**Kết thúc audit:** Không có thay đổi GitHub, mã nguồn, backend hoặc dữ liệu. Mọi đề xuất triển khai nằm ở file plan. Các P0 cần có test hoặc phương án tránh hiển thị sai trước khi chấp nhận redesign.
