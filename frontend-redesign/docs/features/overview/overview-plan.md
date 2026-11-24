# NEU Admissions BI — Kế hoạch redesign Tổng quan (Material 3 Expressive)

**Ngày:** 24/11/2026 · **Trạng thái:** Đề xuất thiết kế để thống nhất, chưa implement.
**Điều kiện:** Dựa trên [overview-issues.md](overview-issues.md), frontend cũ `main/frontend/`, backend hiện hữu và gói frontend V9 `neu-dashboard-m3-expressive-v9-selection-cleanup.zip` đã đọc lại. Làm việc ở `frontend-redesign/` trên nhánh `frontend-redesign`. Không sửa frontend cũ, backend, ETL, MongoDB hay Excel.
**Mục tiêu:** Một màn hình điều hành có cá tính M3 Expressive, đọc nhanh, dùng dữ liệu thật và hướng người dùng tới đúng màn hình nghiệp vụ. Không phải bản sao của dashboard cũ được bo góc nhiều hơn.

## 1. Định nghĩa sản phẩm

Tổng quan trả lời ba câu hỏi, theo thứ tự:

1. **Hiện tình hình thế nào?** Biết số liệu quan trọng trong phạm vi hiện tại, không phải đọc mọi KPI.
2. **Điểm nào đáng chú ý?** Nhìn được tiến trình chuyển đổi, hồ sơ chưa đóng phí, xu hướng và phần dữ liệu cần hiểu đúng.
3. **Tiếp tục ở đâu?** Đi tới Tuyển sinh, Truyền thông, Kết quả thi hoặc Nhà tài trợ khi cần phân tích chi tiết.

Không đặt bảng hồ sơ chứa PII, phân tích mọi segment, mọi kênh, mọi hạng điểm, dữ liệu ETL hoặc công cụ quản trị lên trang chủ. Giữ dữ liệu chuyên sâu ở trang đích. Có thể lặp lại chỉ số quan trọng nếu chúng thực sự giúp định hướng, không lặp cả biểu đồ chỉ vì API đã trả dữ liệu.

### 1.1. Đối tượng và ưu tiên

| Người xem (ví dụ quyền mặc định) | Câu hỏi chính | Thứ tự nội dung đề xuất |
|---|---|---|
| Admin toàn hệ thống | Tuyển sinh tiến triển ra sao, doanh thu thế nào, lĩnh vực nào cần xem tiếp? | CRM chính → Truyền thông, Kết quả thi, Nhà tài trợ → link Quality nếu phù hợp |
| NEU / trường đối tác | Có bao nhiêu hồ sơ, đăng ký, đóng phí và kết quả thi trong phạm vi trường/khối? | CRM chính → Thi → Truyền thông nếu có quyền |
| METAADS / INFO | Kênh được giao mang lại bao nhiêu hồ sơ, đăng ký, đóng phí? | CRM và tóm tắt Marketing; nếu chỉ có Marketing thì Marketing làm khối chính |
| DN | Kết quả thi và quyền lợi tài trợ đang như thế nào? | Thi hoặc tài trợ làm hero (ưu tiên thi nếu có), khối còn lại tóm tắt; không có CRM giả |
| Module tùy chỉnh | Những nhóm dữ liệu nào được cấp? | Tạo bố cục từ response, không hardcode theo mã đối tác |

Danh sách mặc định trong `backend/app/partners.py` chỉ giúp xây kịch bản test. Quyền thực tế có thể được chỉnh bởi admin. Không dựa vào mã DN/NEU để bật tắt màn hình.

## 2. Quyết định về phạm vi và bộ lọc

### 2.1. Phương án được đề xuất: Tổng quan chỉ có scope toàn trang

**V1 bỏ bộ lọc thời gian, bảng và miền khỏi Overview, không bỏ khỏi hệ thống.** Giữ scope selector hiện có ở Shell. Mỗi trang nghiệp vụ sở hữu bộ lọc phù hợp. Đây là quyết định UX có chủ ý để giải quyết OV-01/02/11/27, không phải vì API không hỗ trợ bộ lọc.

- Khi vào trang, gọi `GET /api/overview` (admin toàn hệ thống hoặc partner đăng nhập) hay `/api/overview?partner=DN` (admin chọn DN).
- Không thêm query filter CRM vào URL request Overview mặc dù URL cũ có thể còn `date_from`, `board`...; xác định rõ chính sách bỏ qua/loại bỏ các key cũ trong route Overview, không sửa URL trang khác.
- Chú thích ngắn cạnh nhóm CRM: toàn bộ hồ sơ trong phạm vi đang xem, không ngầm giả định “30 ngày gần nhất”.
- Chart thời gian có thể đổi giữa “Theo ngày” và “Luỹ kế” trên cùng response; đây là cách biểu diễn, không phải lọc cả trang. Không cắt 30 ngày rồi gọi số liệu khác là KPI toàn kỳ.
- Không gọi `/meta/options` riêng từ Overview V1; shell đã có scope của nó. Không nhân đôi bộ chọn đối tác.

**So sánh lựa chọn:**

| Phương án | Ưu | Nhược | Quyết định |
|---|---|---|---|
| Giữ filter global cũ | Ít thao tác với người quen | Ngữ nghĩa lệch giữa các domain, ROI sai ngữ cảnh | Không chọn |
| Scope toàn trang, filter ở trang chi tiết | Gọn, nhất quán, ít request | Không slice mọi KPI trên trang chủ | **Chọn cho V1** |
| Filter riêng CRM và thi | Phân tích linh hoạt | Nhiều state, nhiều request/label, cần xác nhận UX | V2 nếu có nhu cầu rõ |

Nếu sau này cần lọc CRM trên Overview, chỉ lọc nhóm CRM và ghi rõ cohort `first_touch`; giữ các snapshot khác nguyên scope, không dùng marketing ROI từ response đã lọc. Không thay đổi backend trong phạm vi hiện tại. Việc này phải là một quyết định mới, không tự phát sinh trong PR V1.

### 2.2. Scope và quyền

- Lấy `{ user, partner, destinations, scopeStatus, retryScope }` từ `useWorkspace()` của V9. Chờ scope admin sẵn sàng trước khi gọi overview; nếu scope lỗi, hiển thị trạng thái và dùng `retryScope()`.
- Partner đăng nhập không tự truyền partner_code để đổi phạm vi; backend tự áp scope. Admin chọn đối tác gửi partner hợp lệ từ workspace.
- Chỉ render khối có module tương ứng trong `data.modules` và response thực sự chứa nhóm đó; không tạo khối 0 cho module không được cấp. Nếu modules liệt kê một nhóm mà dữ liệu thiếu/null, phân biệt “chưa có dữ liệu” với “không có quyền”.
- Link drill-down phải có destination tương ứng trong `workspace.destinations`; không hiển thị CTA vô hiệu hoặc route tự dựng. Scope admin là góc nhìn dữ liệu, không phải impersonation. Admin có thể mở các trang được cấp theo session hiện hữu, không giả định navigation là quyền của partner.
- Khi scope thay đổi, không để một frame nào hiển thị dữ liệu cũ dưới scope mới. Dùng `useResource` theo path; không giữ response từ hook cũ; reset state cục bộ nếu gắn với scope. Backend là ranh giới bảo mật.

## 3. Bố cục đề xuất — overview như một không gian điều hành

### 3.1. Desktop mở rộng, ví dụ admin có CRM

Wireframe cấu trúc (không phải mockup đã duyệt; không chứa số liệu thật):

```text
┌────────────────────── Shell V9 đã có ─────────────────────────────┐
│ Không gian làm việc                              [Phạm vi ▾]       │
│ Tổng quan                                                          │
│ Tình hình tuyển sinh và các lĩnh vực trong phạm vi đang xem.        │
│                                                                    │
│ TUYỂN SINH                                  Xem tuyển sinh  →     │
│ ┌───────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Đăng ký trên website      │ │ Liên hệ       Đã thanh toán      │ │
│ │ [số lớn]                  │ │ [số]          [số]               │ │
│ │ Tỷ lệ đóng phí [x%]       │ ├─────────────────────────────────┤ │
│ │ Thanh tiến trình có nhãn  │ │ Lệ phí ghi nhận                 │ │
│ │                           │ │ [số tiền ₫]                     │ │
│ └───────────────────────────┘ └─────────────────────────────────┘ │
│ ┌───────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Tiến trình tuyển sinh         │ │ Hồ sơ chưa ghi nhận đóng phí│ │
│ │ Liên hệ   ━━━━━━━━━━━━━        │ │ [số] hồ sơ                  │ │
│ │ Đăng ký   ━━━━━━━━             │ │ [lệ phí tương ứng]         │ │
│ │ Đóng phí  ━━━━━                │ │ Xem danh sách liên hệ →    │ │
│ └───────────────────────────────┘ └─────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Hoạt động tuyển sinh          [Theo ngày | Luỹ kế]             │ │
│ │ [line chart, nhãn thời gian, dữ liệu thiếu ngày nếu có]        │ │
│ │                                       Xem bảng số liệu        │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ CÁC LĨNH VỰC KHÁC (chỉ nhóm được phép)                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐ │
│ │ Truyền thông      │ │ Kết quả thi       │ │ Nhà tài trợ        │ │
│ │ [chỉ số có nghĩa] │ │ PM119 · mô phỏng  │ │ Tiến độ quyền lợi │ │
│ │ ngữ cảnh giả định │ │ [số] hồ sơ thi    │ │ [tiến độ]         │ │
│ │ Xem chi tiết →    │ │ [số] chứng chỉ   │ │ Xem chi tiết →    │ │
│ └──────────────────┘ └──────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

Bố cục này cố ý **không hiển thị tất cả số liệu trong first viewport**. Phần trên ưu tiên đọc tình hình, khối hành động và phễu; chart xu hướng có thể cần cuộn nhẹ. Không thêm greeting lớn, banner thương hiệu, thanh điều hướng thứ hai hay bộ lọc trang trí. Shell đã có H1 “Tổng quan”.

### 3.2. Tránh trùng số liệu trong wireframe

Hero đăng ký, tổng liên hệ và paid sẽ xuất hiện một lần nữa trong phễu, nhưng phễu trả lời câu hỏi khác: tỷ lệ chuyển từng bước. Đây là sự lặp có mục đích. Nếu bố cục thực tế quá dày, rút gọn hero thành đăng ký + doanh thu và chuyển total/paid vào phễu, **không** thêm KPI card thứ ba chỉ để lấp lưới. Thanh tiến trình trong hero chỉ biểu diễn paid/web; nếu lặp với phễu mà không tăng giá trị, bỏ thanh tiến trình, giữ tỷ lệ bằng text.

### 3.3. Các bố cục không có CRM

- **Thi chính:** hero hồ sơ thi PM119, chứng chỉ và tỷ lệ chứng chỉ; hỗ trợ điểm trung bình vòng loại, số vào chung kết. Có thể dùng một chart xếp loại ngang theo bảng nếu dữ liệu grade đủ và đúng; không lặp toàn bộ chart trong trang Kết quả thi. Tài trợ/Marketing còn lại là nhóm tóm tắt.
- **Tài trợ chính:** hero tiến độ trung bình quyền lợi, số hạng mục đạt progress ≥1 nếu có benefits; tổng lượt tiếp cận, tương tác là thông tin phụ. Không tạo biểu đồ kênh vì overview không trả reach rows.
- **Marketing chính:** đăng ký web/đã đóng phí thuộc phạm vi marketing, ngân sách nhìn thấy nếu có, ghi chú phân bổ giả định. Không có ngân sách vẫn hiển thị số liệu liên hệ hợp lệ; không tự suy diễn ROI.
- **Không có nhóm hỗ trợ:** thông báo rõ “Chưa có dữ liệu tổng quan cho các lĩnh vực được cấp”, cung cấp link trang có quyền nếu tồn tại. Không tạo demo data.

Quy tắc ưu tiên đề xuất: CRM → Exams → Sponsorship → Marketing; nếu chỉ còn một nhóm, cho nó toàn chiều rộng. Không để lưới có lỗ hổng do module bị ẩn. Điều chỉnh thứ tự sau khi kiểm với người dùng mục tiêu, không hardcode theo partner code.

### 3.4. Responsive theo chiều rộng nội dung

Shell có sidebar 16.5rem, vì vậy dựa vào content container chứ không chỉ viewport. Đề xuất thử ngưỡng content ≥1100px cho grid 12 cột; 700–1099px cho grid 6 cột; dưới 700px xếp 1–2 cột tùy khả năng đọc. Đây là quyết định layout riêng của app, không phải breakpoint chính thức bắt buộc của M3. Các card secondary tự wrap 1/2/3 cột; timeline luôn full width. Màn hình 360px, laptop 1280×720 với sidebar mở/thu, desktop 1440px, zoom 200% đều không cuộn ngang toàn trang.

## 4. Quyết định giữ / đổi / chuyển / hoãn

| Nội dung cũ | Quyết định V1 | Lý do |
|---|---|---|
| Hero doanh thu | Đổi bố cục; giữ KPI doanh thu nổi bật trong cụm chính | Không đồng nhất KPI tài chính và quy mô tuyển sinh |
| Liên hệ, đăng ký, paid, paid rate | Giữ, nhóm trực quan theo funnel | Câu hỏi chính của overview |
| Doanh thu tiềm năng | Đổi thành “Lệ phí của hồ sơ chưa ghi nhận đóng phí”, kèm số hồ sơ | Không phải dự báo doanh thu; lưu ý miễn phí |
| ROI tile | Chuyển sang Marketing; không làm headline Overview V1 | Phân biệt actual/assumed, ngân sách khác phạm vi, không đồng nghĩa lợi nhuận |
| Phễu tuyển sinh | Giữ, thiết kế thanh ngang chung thang đo và tỷ lệ từng bước | Dễ đọc số tuyệt đối và chuyển đổi |
| Tăng trưởng theo thời gian | Giữ, chỉnh tên series và giải thích ngày | Cần xem biến động theo thời gian; không diễn giải ngày paid |
| Segment CRM | Chuyển chi tiết sang Tuyển sinh | Không còn chart stacked riêng trên Overview |
| Kênh thu hút | Chuyển chi tiết sang Truyền thông/Tuyển sinh | Phân biệt final attribution, tránh lặp |
| Ngân sách và doanh thu theo kênh | Chuyển chart chi tiết sang Truyền thông | Tổng quan chỉ tóm tắt kênh/phạm vi có dữ liệu |
| 5 KPI thi và chart xếp loại | Khối tóm tắt 2–3 chỉ số khi CRM chính; chart tùy nhu cầu nếu thi là khối chính | Không trộn hai tập dân số; bảo toàn module |
| Tài trợ 3 KPI | Khối tóm tắt; thêm tiến độ có nhãn nếu có dữ liệu | Không invent reach theo kênh |
| Pipeline | Chuyển sang Chất lượng dữ liệu (admin có quyền); không vẽ KPI riêng | Không lặp liên hệ và không trộn scope |
| Bảng thay thế chart | Giữ cho chart còn lại, toggle gọn | Accessibility và đọc số chính xác |
| Global export 3 nút | Không khôi phục global; hoãn Overview export tới bước kiểm báo cáo | API có thật nhưng báo cáo rộng hơn UI và thiếu ngữ cảnh |

## 5. Ngôn ngữ thiết kế M3 Expressive — triển khai thực sự

### 5.1. Phân cấp và hình dáng

Google mô tả thiết kế expressive qua màu, hình khối, kích thước, chuyển động và cách nhóm nội dung. Áp dụng có chủ đích: hero đăng ký lớn, cụm KPI phụ nhỏ hơn, bề mặt gom nhóm, chart ít màu. Không phải bo mọi thứ thành pill, tăng animation, dùng gradient hoặc tô mọi card một màu. Đọc [Google Design: Expressive Design research](https://design.google/library/expressive-material-design-google-research).

| Thành phần | Định hướng đề xuất |
|---|---|
| Hero | `primary-container` / `on-primary-container`; một số chính dùng display-small hoặc display-medium (36–45px), nhãn rõ; shape extra-large, không thêm ảnh minh họa vô nghĩa |
| KPI phụ | Surface container low/normal, 24–32px số, `tabular-nums`, label body/label medium; không dùng full primary cho mọi ô |
| Cụm KPI liên quan | Grouped/connected containment nếu hợp lý: góc ngoài lớn, góc trong nhỏ, gap nhỏ; không làm button group cho số liệu không tương tác |
| Panel phân tích | Surface container thấp, shape large, ít shadow; title-medium/large, tiêu đề rõ đơn vị và phạm vi |
| Điều hướng chi tiết | Text button hoặc tonal button/link, có arrow đúng hướng; CTA chỉ xuất hiện nếu đi được tới trang đích |
| Trạng thái và lưu ý | Text và icon có nghĩa; error dùng error role; mô phỏng/không có ngân sách dùng neutral/tonal + chữ; không dùng badge trang trí |
| Khoảng cách | Đề xuất hệ 4/8px: gap trong nhóm 8–12, padding 16–24, giữa khối 24–32; tránh nested card chồng nhiều lớp |

### 5.2. Token, typography và component

V9 đã dùng Inter Variable, `expressive.json` khai báo variant/shape/motion `expressive`, `src/styles/globals.css` có `--ex-color-*`, `--ex-type-*`, Tailwind semantic utility. Dùng semantic roles (`bg-surface-container`, `text-on-surface`, `text-on-surface-variant`, `bg-primary-container`, `text-on-primary-container`, `rounded-shape-*` phù hợp class hiện có), không mã màu hex tùy tiện. Không thay font, palette, theme studio hoặc app shell.

Component thực sự có trong V9: Button, IconButton, Menu, Select, TextField, Tooltip, Ripple, Sidebar, TopAppBar, Avatar. Overview chủ yếu dùng Button/Menu/Tooltip đã có. Card, Progress, Button Group chưa có file tương ứng trong archive V9; nếu cần sử dụng registry [Card](https://expressive.grenishrai.pro/docs/components/card), [Progress](https://expressive.grenishrai.pro/docs/components/progress), [Button Group](https://expressive.grenishrai.pro/docs/components/button-group), đọc source trước khi thêm, xem diff CLI, thống nhất với đồng đội để không ghi đè shared component. Không chạy init lại. Không mặc định phải thêm cả registry. Đây là thư viện cộng đồng lấy cảm hứng M3 Expressive, không phải thư viện chính thức của Google.

- Button group chỉ dùng cho toggle biểu đồ “Theo ngày/Luỹ kế” nếu hai chế độ thực sự hữu ích; phải có selected state và tên dễ hiểu. Đọc [Interaction](https://expressive.grenishrai.pro/docs/interaction) và [Motion](https://expressive.grenishrai.pro/docs/motion) để dùng state layer, ripple, focus và motion token.
- Không biến mọi card thành button; nếu panel có link/điều khiển con thì tránh nesting interactive controls. Dùng link chuẩn cho điều hướng và button chuẩn cho hành động.
- Chuyển động chỉ phản hồi press, selection, hoặc loading; không animate số từ 0 gây hiểu nhầm dữ liệu, không spring liên tục, tôn trọng `prefers-reduced-motion`.
- Không cố định màu series theo màu theme chưa kiểm contrast. Cần palette dữ liệu semantic riêng, kiểm ở dark/light và các theme seed. Màu primary có thể dành cho registration, secondary cho contact, tertiary cho paid nếu đủ phân biệt; line style, nhãn trực tiếp và legend dự phòng. Không xem màu đỏ/xanh là dấu hiệu duy nhất.
- Định dạng tiền `vi-VN` có ₫, label đơn vị triệu/tỷ đầy đủ, giá trị chính xác trong tooltip/bảng. Tỷ lệ nhân 100 đúng một lần, null là “—” + ý nghĩa, 0 vẫn là 0.

### 5.3. Biểu đồ: lựa chọn kỹ thuật

Frontend cũ có ECharts; V9 `package.json` chưa có chart lib. Đề xuất dùng **một** thư viện chart chung cho cả nhóm, ưu tiên ECharts modular (`echarts/core` và chỉ register chart/component cần dùng) vì đã có kinh nghiệm trong frontend cũ và cần nhiều loại biểu đồ ở các trang sau. Đây là đề xuất, chưa cài thêm. Nếu timeline đơn giản và SVG đáp ứng keyboard/resize/tooltip/table, có thể dùng SVG cho phễu; không tự viết chart engine tổng quát. Không dùng hai chart lib khác nhau chỉ vì hai thành viên làm riêng. Thống nhất dependency với đồng đội trước commit `package-lock.json`.

Không copy giao diện ChartCard cũ. Có thể tham khảo formatter và cách chart cũ xử lý tooltip/data table. Chọn chart vì câu hỏi:

- Phễu: thanh ngang cùng gốc và thang đo số người, 3 stage, ghi cả số tuyệt đối và tỷ lệ chuyển bước; không hình thang diện tích gây sai tỷ lệ. Nếu mẫu số =0 hiển thị —, không vẽ NaN. Nếu quan hệ count bất thường, báo chất lượng thay vì clamp âm để giấu lỗi.
- Timeline: line chart với 3 series (liên hệ mới, đăng ký web, hồ sơ đăng ký đã đóng phí), hoặc luỹ kế tương ứng; số ngày do response quyết định, tick rõ năm khi cần, không ngầm nối ngày thiếu dữ liệu cá nhân. Bảng thay thế có đầy đủ ngày và values. Thiếu ngày ghi rõ cạnh chart. Không gọi series thứ ba là “Doanh thu/Thanh toán theo ngày”.
- Thi nếu là nhóm chính: grouped bar theo bảng và grade nếu đủ dữ liệu; nếu có grade null/lạ, nhóm “Chưa xếp loại” hoặc ghi rõ số bị loại, bảng phải khớp chart. Không suy ra phân phối điểm từ điểm TB.
- Không vẽ trend/sparkline/target/tăng trưởng % cho KPI nếu không có kỳ so sánh thực. Không vẽ progress giả định 100% hoặc revenue dự báo.

## 6. Hợp đồng dữ liệu và quy tắc mapping

### 6.1. API hiện có

Nguồn: `backend/app/routers/overview.py`, `contacts.py`, `marketing.py`, `filters.py`, `misc.py`, `security.py` trên `main` (link cụ thể trong audit). V1 chỉ đọc JSON `/api/overview`; dùng `/overview` khi gọi `api` hoặc `useResource` vì service V9 tự thêm `/api`.

```ts
// Phác thảo type tối thiểu dựa trên trường thật, không phải code đã commit.
interface OverviewResponse {
  modules: string[];
  viewing_partner: string | null;
  crm?: {
    kpi: {
      total: number; web_registered: number; paid: number;
      paid_rate: number | null; revenue: number;
      unpaid_registered: number; potential_revenue: number; free: number;
      undated_contacts: number; undated_registrations: number; undated_paid: number;
    };
    funnel: {stage: string; value: number}[];
    timeline: {
      date: string; new_contacts: number; registrations: number; paid: number;
      cum_contacts: number; cum_registrations: number; cum_paid: number;
    }[];
  };
  marketing?: {
    kpi: {
      contacts: number; web_registered: number; paid: number; revenue: number;
      budget: number | null; roi_program: number | null;
      roi_paid_channels: number | null; cpa_paid: number | null;
    };
    channels: {
      channel: string; contacts: number; revenue: number;
      assumed_contacts: number; budget_visible: boolean;
      budget: number | null; is_assumed: boolean | null; data_note: string | null;
    }[];
  };
  exams?: {
    kpi: { count: number; avg: number | null; max: number | null;
      finalists: number; certificates: number; cert_rate: number | null };
    grades: { board: string | null; grade: string | null; count: number }[];
  };
  sponsorship?: {
    benefits: { item: string; progress: number; status: string }[];
    avg_progress: number | null; total_reach: number; total_engagement: number;
  };
  pipeline?: unknown | null; // không sử dụng để render KPI Overview V1
}
```

Type này là **projection frontend** cho dữ liệu sử dụng, không phải schema đầy đủ. Các trường breakdown CRM và nhiều field marketing vẫn có trong backend. `benefits` lấy theo documents thực tế; trường item/progress/status được sử dụng trong old Overview/report; cần verify nullable và schema thực trước khi hoàn thiện. Không cast `any` hoặc coi type assertion là runtime validation.

### 6.2. KPI dictionary cho thiết kế

| UI label đề xuất | Field / phép tính | Ngữ nghĩa / hiển thị |
|---|---|---|
| Liên hệ duy nhất | `crm.kpi.total` | Số hồ sơ contacts đã scope, không phải dòng lead thô |
| Đăng ký trên website | `web_registered` | Số liên hệ đã đăng ký web, không đồng nghĩa số dự thi |
| Đã đóng phí | `paid` | Cờ paid backend; không cộng miễn phí thành paid |
| Tỷ lệ đóng phí / đăng ký | `paid_rate` | paid/web_registered; null khi mẫu số 0 |
| Lệ phí ghi nhận | `revenue` | Tổng revenue backend, ₫; không gọi là lợi nhuận |
| Hồ sơ web chưa ghi nhận đóng phí | `unpaid_registered` | web && !paid; có thể gồm miễn phí, không coi toàn bộ là phải thu |
| Lệ phí tương ứng | `potential_revenue` | Tổng fee cho nhóm trên; không cam kết thu được; nếu có free, ghi chú / tránh nhãn “cần thu” |
| Chuyển đổi liên hệ → web | `web_registered / total` | Chỉ tính nếu mẫu số >0, tỷ lệ hợp lệ; ghi mẫu số |
| Chuyển đổi web → paid | `paid_rate` | Không tính lại theo số thí sinh thi |
| Ngân sách nhìn thấy | `marketing.kpi.budget` | null khi không có ngân sách trong scope; 0 vẫn hợp lệ; không phải chi phí thực mọi trường hợp |
| Phân bổ giả định | `channels.some(c => c.is_assumed === true \|\| c.assumed_contacts > 0)` | Chỉ dùng làm dấu hiệu có dữ liệu mô phỏng, không tính “ROI actual” bằng cách bỏ một số row tùy tiện |
| Hồ sơ thi PM119 | `exams.kpi.count` | Count documents; nhãn “dữ liệu mô phỏng” theo UI cũ và nguồn điểm; không hardcode 119 |
| Điểm TB vòng loại | `exams.kpi.avg` | Trung bình qualifier.total, null khác 0 |
| Vào chung kết | `finalists` | Cờ advanced đã tính trên tập thi ban đầu |
| Chứng chỉ COS Pro | `certificates`, `cert_rate` | Backend flag; ETL hiện tại best(VL, CK) ≥600, tỷ lệ trên count; tránh hardcode ngưỡng nếu không có metadata phù hợp |
| Tiến độ quyền lợi (TB) | `avg_progress` | Trung bình progress, 0..1 theo dữ liệu kỳ vọng; không đồng nghĩa tỷ lệ hạng mục hoàn thành |
| Hạng mục hoàn thành | `benefits.filter(b => b.progress >= 1).length` | Đếm theo quy ước progress cũ; kiểm dữ liệu; mẫu số benefits.length |
| Tổng lượt tiếp cận/tương tác | `total_reach`, `total_engagement` | Tổng lượt qua kênh, không phải người duy nhất; không ghi “5 kênh”; API chưa phân biệt thiếu reach với tổng 0 |

Không gọi `crm.by_channel` là kênh tiếp xúc đầu tiên. Nếu cần cấp độ chi tiết đó, backend hiện không cung cấp `channel_base` breakdown ở Overview. Quy tắc grade hiện tại: Giỏi ≥800, Khá ≥650, Trung bình ≥500, Yếu dưới 500 (ETL `grade_of`). Chỉ hiển thị chú thích khi đã xác nhận quy tắc cho dataset; không tự phân hạng lại từ aggregate.

### 6.3. Trạng thái màn hình

| Trạng thái | UX |
|---|---|
| Chờ scope | Placeholder có status, không gọi API bằng scope chưa xác định |
| Initial loading / đổi scope | Skeleton theo cấu trúc nếu biết; nếu không biết role content thì một loading container trung tính, không dữ liệu cũ |
| Ready | Nội dung theo module, số 0 hợp lệ và label đúng |
| Retry cùng path | Giữ dữ liệu cũ cùng phạm vi, báo đang cập nhật tinh tế |
| Retry thất bại | Hiển thị `refreshError`, giữ dữ liệu cùng path, có nút thử lại |
| Lỗi initial | Error state rõ, retry; 401 do app xử lý; 403 không giả lập |
| Empty group | Không có dữ liệu trong scope, giữ nhóm nếu có quyền; không nhầm 0 với null |
| Không có module tương ứng | Không render card bị cấm; thông báo nếu tất cả không có |

Không hiện thời gian cập nhật dữ liệu nguồn nếu API không cung cấp. Nếu cần “Tải lúc…” phải nói là thời điểm request hoàn tất, không phải lần import cuối.

## 7. Điều hướng và export

Dùng routes hiện có của V9, đọc `src/features/*/routes.ts` và `workspace.destinations`; Overview route `/` đã có. Link CRM dẫn đến màn hình liên hệ; truyền thông `/kenh-roi`, thi `/diem-thi`, tài trợ `/tai-tro`. Không hardcode query filters chưa được thống nhất với trang đích. CTA hồ sơ chưa paid trước mắt “Xem danh sách liên hệ”, **không** nói đã lọc đúng nhóm nếu trang đích chưa hỗ trợ. Khi Contacts hoàn thành, thống nhất deep link theo `payment_status` hoặc filter đúng nhóm; chú ý miễn phí và khác biệt với `!paid`.

Export là khả năng có thật (`GET /api/overview/export?format=xlsx|docx|pdf&partner=...`), nhưng UI V9 đã bỏ nút global. V1 chưa bật lại cho đến khi kiểm rõ nội dung báo cáo với scope, dữ liệu giả định và quyền. Nếu được duyệt, chỉ có một menu “Xuất báo cáo tổng quan” ở Overview, 3 format, không hiểu là xuất chart đang xem. Báo cáo rộng hơn UI (segment/channel/pipeline...), backend không cung cấp tùy chọn chọn khối. Download qua response blob với cookie same-origin, xử lý 401 tương đương service; không dùng helper JSON để đọc binary. Không gửi contact filters bị bỏ qua. Disable khi scope chưa ready, loading khi export, báo lỗi, không tuyên bố xuất thành công trước response. Nếu cần sửa báo cáo backend, ghi issue riêng và không sửa trong PR này.

## 8. Kế hoạch code — modular, không over-engineer

### 8.1. Phạm vi file đề xuất

```text
frontend-redesign/
├── docs/
│   └── overview/
│       ├── overview-issues.md
│       └── overview-plan.md
└── src/
    └── features/overview/
        ├── routes.ts              # giữ nguyên nếu route không đổi
        ├── Overview.tsx           # orchestrate scope, resource, layout
        ├── types.ts               # projection của API
        ├── model.ts               # mapping, format/ratio, group selection
        ├── components/            # tạo khi có nhu cầu thực
        │   ├── AdmissionsSummary.tsx
        │   ├── AdmissionsFunnel.tsx
        │   ├── AdmissionsTimeline.tsx
        │   └── DomainSummary.tsx  # composition, có thể tách theo module nếu dài
        └── overview.css           # chỉ nếu utility/token hiện có chưa đủ
```

Không bắt buộc tạo hết file ngay; mỗi file có trách nhiệm rõ. `Overview.tsx` gọi hook, render state và nhóm, không chứa hàng trăm dòng option chart. Model pure functions dễ test, không chứa React. Components nhận dữ liệu đã mapping qua props, không fetch lại. Chart wrapper/KPI shared chỉ tách thành `src/shared/` hoặc shared components khi có từ hai tính năng dùng thật, thống nhất với đồng đội. Component mang nghiệp vụ tuyển sinh vẫn thuộc feature, không đặt hết vào `components/expressive/`.

### 8.2. Luồng triển khai

```text
App + Shell V9 (auth, scope, navigation)
    ↓ useWorkspace()
Overview.tsx → useResource<OverviewResponse>(path)
    ↓ API /overview qua services/api.ts
FastAPI /api/overview (enforce module + scope)
    ↓ JSON
model.ts → group selection / field mapping / safe ratios
    ↓
components → M3 cards, funnel, timeline, links
```

Ví dụ path (phác thảo):

```ts
const { user, partner, scopeStatus } = useWorkspace();
const params = new URLSearchParams();
if (user.role === 'admin' && partner) params.set('partner', partner);
const query = params.toString();
const path = user.role === 'admin' && scopeStatus !== 'ready'
  ? null : `/overview${query ? `?${query}` : ''}`;
const result = useResource<OverviewResponse>(path);
```

Vẫn gọi hook vô điều kiện; phân nhánh render scope error/loading sau đó. Code không yêu cầu người dùng cung cấp token, không tạo login mới. `useResource` V9 abort request cũ, trả loading khi path khác, giữ snapshot chỉ khi retry cùng path; cần test thực tế.

### 8.3. Coordination với teammate

Không sửa Marketing.tsx hoặc Sponsorship.tsx; overview sử dụng response và local summary riêng, không import page component của teammate. Thống nhất trước: chart library, semantic chart palette, formatter, loading/empty pattern, dependency mới và liên kết drill-down. Không áp dụng theme mới chỉ cho Overview, không reinitialize Expressive, không thay sidebar để hợp mockup. Tài liệu này không cho phép thay đổi phạm vi ngoài frontend-redesign.

## 9. Milestone và PR

| Bước | Deliverable | Điều kiện qua bước |
|---|---|---|
| M0 — audit & review | Hai file Markdown này | Chốt vai trò Overview, scope-only V1 và các mục giữ/chuyển/hoãn |
| M1 — thiết kế | Wireframe desktop/compact + token/component decisions; có thể prototype trực tiếp React sau khi chốt | Kiểm thứ tự đọc, role variants, dark/light; không demo thành dữ liệu sản phẩm |
| M2 — dữ liệu | Types, mapping, hook integration, loading/error/empty | Real API auth/scope; P0 về scope và ngữ nghĩa được kiểm |
| M3 — UI chính | Hero, KPI, funnel, timeline, drill-down | M3 visual hierarchy, chart accessible; mobile/tablet không overflow |
| M4 — các nhóm khác | Snapshot thi/marketing/sponsor; ưu tiên khi không CRM | Module tùy chỉnh, DN, no-budget, giả định, 0/null đúng |
| M5 — review | Build, test logic, browser real backend, screenshots review | Checklist §10 pass; ghi rõ test chưa chạy; export chỉ khi được duyệt |

Commit đề xuất (không thực hiện trong lượt lập kế hoạch):

```text
docs(frontend): audit and plan overview redesign
feat(frontend): integrate scoped overview data
feat(frontend): build expressive admissions overview
feat(frontend): add permission-aware domain summaries
test(frontend): verify overview data and responsive states
```

Nếu làm trên branch riêng `feature/overview`, base là `frontend-redesign` của fork `chiinthedesert/neu_python_master_dashboard`, không phải `main`. Chỉ stage các file liên quan `frontend-redesign/`, tránh file Excel hoặc phần teammate. Có thể chia các commit theo trạng thái build được thay vì bắt buộc đúng 5 commit. Không push tự động. `npm run test:local`, `npm run build`, `npm run dev` là lệnh thực có trong V9; kiểm Node version và log thực trước khi tuyên bố pass. V9 README nói full build và live integration chưa chạy trong môi trường đóng gói.

## 10. Definition of Done

### 10.1. Data correctness / integration

- [ ] Admin toàn hệ thống và admin chọn DN/NEU trả đúng modules/viewing_partner; scope đổi trong loading/error không hiện số liệu trước.
- [ ] Partner account trực tiếp: không render module bị cấm; server quyết định scope, không chỉ dựa vào client.
- [ ] CRM-only, exams-only, sponsor-only, marketing-only, overview-only và empty response có bố cục hợp lý. Thiếu group không crash.
- [ ] Số KPI khớp API trực tiếp cùng phạm vi; null, 0, array rỗng, mẫu số 0 được xử lý riêng.
- [ ] Không label thanh toán theo ngày tiền về; timeline có note thiếu ngày, bảng khớp chart.
- [ ] Không ROI/CPA headline giả tạo, không “lợi nhuận”, không giả định tất cả là actual; ngân sách null khác 0.
- [ ] Không hardcode 119/5 kênh; chú thích grade đúng nguồn, chứng chỉ không bị diễn giải chỉ theo VL.
- [ ] Không hiểu unpaid_registered là tất cả người nợ tiền nếu có free; có test fixture với free.
- [ ] Link route có quyền; không hứa filter chưa hỗ trợ. Không tạo số liệu lead mới bằng total - web rồi gọi là số dòng lead.
- [ ] Nếu export được chấp thuận: tải đúng format/phạm vi, kiểm report content và lỗi; nếu hoãn thì không có nút giả.

### 10.2. UX / visual review

- [ ] Ở 1280×720 và 1440px, người xem nhận biết nhóm chính ngay mà không cần đọc toàn trang; xem được tình hình tuyển sinh và hành động tiếp theo.
- [ ] Hero rõ hơn KPI phụ qua scale, containment và semantic color, không phải nhiều màu ngẫu nhiên.
- [ ] Mỗi panel trả lời một câu hỏi; không có chart trang trí, thẻ vô nghĩa hoặc lặp H1/scope.
- [ ] Inter Variable, light/dark và theme seed hiện hữu đều giữ đúng contrast; chữ nhỏ vẫn đọc rõ, số căn theo tabular numbers.
- [ ] Focus visible, bàn phím Tab/Enter/Space/Escape phù hợp, toggle có accessible name/selected state, icon trang trí aria-hidden.
- [ ] Chart có text/table tương đương, nhãn đơn vị, không dựa màu/hover duy nhất. Mục tiêu WCAG AA contrast 4.5:1 với chữ thường, 3:1 với chữ lớn và các thành phần đồ họa/điều khiển liên quan.
- [ ] 360px, 768px, 1280px sidebar mở/đóng, 1440px, zoom 200%: không cắt nội dung, không horizontal scroll toàn trang; chart resize đúng.
- [ ] Reduced motion: không animation thừa; skeleton/refresh không nhấp nháy hoặc làm layout jump đáng kể.
- [ ] Thử tác vụ: “có bao nhiêu đăng ký?”, “tỷ lệ đóng phí là bao nhiêu?”, “tôi muốn xem hồ sơ chưa đóng phí ở đâu?”, “dữ liệu thi có phải dữ liệu thật?”, “đang xem scope nào?”. Mục tiêu đọc/định hướng trong khoảng 10 giây cho câu hỏi chính là tiêu chí thiết kế cần kiểm, không phải kết quả nghiên cứu đã có.

### 10.3. Kỹ thuật

- [ ] Unit/fixture test model ratios, group selection, null, giả định; fixture không chứa PII và không dùng làm data production.
- [ ] Test chuyển scope nhanh + response đảo thứ tự + failed refresh; kiểm network requests không lặp vô ích.
- [ ] Kiểm build và script `npm run test:local` trên môi trường thật, ghi kết quả; không suy từ source audit rằng test đã pass.
- [ ] Review git diff: không thay backend, old frontend, Excel, shell hoặc feature teammate ngoài thay đổi shared đã thống nhất.

## 11. Quyết định cần duyệt trước khi viết code

Đề xuất duyệt đồng thời 3 điểm: (1) scope-only Overview V1; (2) hero tuyển sinh + phễu + timeline, các domain khác tóm tắt theo quyền; (3) một chart library dùng chung, M3 Expressive token/component hiện có. Export để milestone riêng nếu cần. Sau khi chốt, bắt đầu M1: dựng layout với đúng shell V9, thử trên các role khác nhau trước khi tối ưu chi tiết giao diện.

**Không thêm tính năng hoặc sửa code trong lượt audit này.** Phương án còn là đề xuất, có thể điều chỉnh khi nhìn thấy màn hình chạy thật.
