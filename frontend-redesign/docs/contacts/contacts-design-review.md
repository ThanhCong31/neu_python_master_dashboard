# Contacts — Design Review Gate trước V17

**Baseline:** V16 · `/crm` (Liên hệ & chuyển đổi). **Trạng thái:** quyết định thiết kế sau review tĩnh; chưa implement và chưa nghiệm thu runtime. Tài liệu này bổ sung và ưu tiên hơn các chi tiết IA/VD tương ứng trong `contacts-design.md`; API contract vẫn là ràng buộc bắt buộc. Không thay đổi scope của Leads, Truyền thông, Nhà tài trợ, Kết quả thi, System hay Shell.

## 1. Xác minh đầu vào

- Đã mở lại sáu Markdown trong workspace: README, issues, API contract, design, plan, review. Đối chiếu với audit `main` (tree `89ec8638ddc751f03c38ce4ea0bdb2ca79be0464`) và các router nguồn đã đọc: `contacts.py`, `filters.py`, `misc.py`, ETL. Đây là review tĩnh; không có response MongoDB thực nghiệm mới.
- Đã đọc cây GitHub `chiinthedesert/neu_python_master_dashboard`, ref `frontend-redesign`, tree `bee42d6f18451102bc815b1693b8103bd58de232` (tree SHA, không phải commit SHA). Tại snapshot này chưa thấy `frontend-redesign/docs/contacts/`, nhưng vẫn có tài liệu local. Không suy ra người dùng chưa commit/push ở máy họ; có thể khác thời điểm hoặc ref. `Contacts.tsx` trên remote vẫn `return null`, route `/crm` có sẵn. `shared/charts/responsive.ts` có helper V16; Overview `FollowUp` đã link tới Contacts mà không tạo filter sai nghĩa.
- Đối chiếu workspace V16: `useResource`, `useWorkspace`, ECharts wrapper, theme/responsive helper, Expressive Menu và ButtonGroup, System native dialog, package.json. `ButtonGroup` hiện là nhóm action (`role=group`), không phải tabs hay segmented selection. Dùng đúng semantics thay vì gắn nhãn selected tùy ý vào action group. AGENTS/CONTRIBUTING remote vẫn có vài ghi chú V9 cũ; source thực là chuẩn về API primitive/dependencies.
- Không fetch thêm API, không thay source hoặc git remote trong review này. Trước V17 xác nhận baseline và không ghi đè teammate.

## 2. IA được chốt

Một route `/crm`, hai view độc lập, chung bộ lọc cấu trúc, không thêm sidebar destination. **Hồ sơ** là mặc định; **Phân tích** cho nhiệm vụ chuyển đổi. View switch nằm đầu feature, ngay dưới title do Shell cung cấp; filter bar tiếp theo, trước nội dung đang chọn. Không lặp H1, không lặp partner selector, không đặt hero KPI ở view Hồ sơ. Không đặt export Overview ở đây.

| Quyết định | Kết luận review | Lý do |
|---|---|---|
| D01 | Giữ hai view; tab Hồ sơ / Phân tích | Lookup và phân tích là hai nhiệm vụ khác nhau. Cùng route và filter. |
| D02 | Giữ q chỉ list/CSV; không truyền q cho summary | Tránh lẫn phạm vi và PII. Count danh sách theo q, phân tích theo bộ lọc cấu trúc; thông báo rõ khi q đang tồn tại. |
| D03 | **Tinh chỉnh: một nút Bộ lọc mở một form duy nhất**, bên cạnh các chip đang áp dụng; không hiển thị ba trigger mở trùng form mặc định | Tiết kiệm chiều ngang, nhất quán desktop/mobile. Có thể thêm shortcut thật sau review task, không tạo nhiều control chỉ để trang trí. |
| D04 | Giữ 4 nhóm cột + action trên wide; medium giảm cột PIC; mobile semantic list | Các trường còn lại xem ở detail, optional columns trên desktop. |
| D05 | Detail chỉ đọc, dùng row đã tải | Không có endpoint get-by-id hay mutation; không tạo edit/call/email/bulk action giả. |
| D06 | Phân tích: KPI, funnel, đăng ký theo ngày, một grouping panel, quality note | Không sao chép 11 chart cũ. Heatmap/drip/venue chưa cần biểu đồ riêng. |
| D07 | Dùng theme V16 cho chart, không màu series hardcode | Giữ preference người dùng; solid line nếu dùng line, bar được ưu tiên cho count theo ngày. |
| D08 | CSV chỉ ở Hồ sơ, một action trực tiếp, tất cả dòng khớp | Không dùng menu nhiều format hay tạo export toàn bộ Overview. |

## 3. Visual hierarchy và bố cục đích

### Expanded — content width >= 1000 px

```text
H1 từ Shell: Liên hệ & chuyển đổi
[ Hồ sơ liên hệ ● ] [ Phân tích tuyển sinh ]       [ Cập nhật ↻ ]
[ Bộ lọc · 2 ] [ Bảng A × ] [ Chưa thanh toán × ] [ Xóa lọc ]
┌ Danh sách liên hệ ─────────────────────── 128 hồ sơ phù hợp ┐
│ [ Tìm mã, họ tên, email ...                ] [Cột] [Xuất CSV] │
│ [Sắp xếp: Mã ↑] (chỉ nếu cần chọn field khác cột hiện có)     │
│ Họ tên / Mã      Bảng       Thanh toán       Phụ trách       │
│ Hồ sơ A          Bảng A     Đã thanh toán    Ban tuyển sinh >│
│ PT-001                      500.000 ₫                        │
│ ─────────────────────────────────────────────────────────── │
│ …                                                           │
│ 1–20 / 128       Số dòng [20]                    ‹ 1/7 ›    │
└─────────────────────────────────────────────────────────────┘
```

- Tabs có selected surface/indicator và trạng thái focus rõ, không giống nút export. Chọn một view và keyboard semantics nhất quán (Base UI Tabs nếu xác minh API, hoặc group các nút `aria-pressed` nếu dùng selection control thực; không giả role=tab thiếu hành vi).
- Toolbar chỉ có một primary/tonal action rõ ràng ở table (Xuất CSV); filter và các display controls trung tính. Không đặt search/filter vào mỗi card. Count luôn ở gần list, không dùng con số mock. Các kích thước là mục tiêu thiết kế, kiểm tra actual content width sau khi Shell trừ sidebar.
- `Cột` là display preference, không filter data. Sort header cho field đang hiện, có nút chọn thứ tự đầy đủ (mã/doanh thu/ngày...) khi cần. Không chọn hàng vì không có bulk action. Row action là nút mở detail với tên truy cập được; không biến tất cả cell thành link.
- Dùng một surface bảng, header rõ, divider nhẹ; name 15–16px, body >=14px, tiền tabular, căn phải nếu cột tiền riêng. Row có 2 dòng khoảng 60–72px, không ép height nếu text dài. Không tô toàn bộ hàng theo trạng thái.

### Compact — content width < 680 px

```text
[ Hồ sơ liên hệ | Phân tích ]
[ Bộ lọc · 2 ]                 [ Cập nhật ]
[ Bảng A × ] [ Chưa thanh toán × ]
[ Tìm mã hoặc họ tên                  ]
128 hồ sơ             [ Sắp xếp ] [ CSV ]
┌ Hồ sơ A                              > ┐
│ PT-001 · Bảng A                        │
│ Đã thanh toán · 500.000 ₫               │
│ Ban tuyển sinh                         │
├────────────────────────────────────────┤
│ Hồ sơ B                              > │
└────────────────────────────────────────┘
1–20 / 128                 [‹] 1/7 [›]
Số dòng [20]
```

- Các nút có thể wrap thành hai hàng ở 320px; label và action không bị cắt. Nút filter và chip wrap; nhiều lựa chọn cùng nhóm hiển thị `Bảng thi · 2`, mở form để xem danh sách; tên và giá trị phải có trong accessible label/description. Nếu chip quá dài, wrap hoặc hiển thị count, không tooltip hover-only.
- Mobile list giữ cùng sort, page, filter và data snapshot với table; không fetch khác chỉ vì resize, không tạo hai cây tương tác cùng lúc. Identity/name, mã, bảng, trạng thái và revenue luôn đọc được; PIC phụ. Chi tiết chứa các field còn lại. Mobile không có menu cột vì không hiển thị table.
- Dialog filter/chi tiết: desktop max width khoảng 560–640px; compact gần full screen, safe-area, sticky header/footer khi cần, body scroll, không ẩn Apply/Cancel khi keyboard xuất hiện. Escape, focus restore, long content và zoom 200% phải test. Có thể dùng native dialog với `showModal` tương tự System nhưng không import system-specific component; ưu tiên đơn giản, không tạo thư viện dialog mới trước nhu cầu chung.

### Medium — 680–999 px

Table với danh tính, bảng, payment, action; PIC là cột tùy chọn hoặc xem chi tiết. Search xuống hàng riêng khi không đủ chỗ. Cột tùy chọn nhiều chỉ scroll trong table region có label/focus; không scroll ngang toàn trang. Khi đổi width từ 679 sang 680 và 999 sang 1000, không reset view hoặc state.

## 4. Filter interaction — một nguồn sự thật

Form chia section: Thời gian; Hồ sơ (Bảng, Miền, Tỉnh/TP); Thanh toán; Nguồn và nhóm (Segment, Kênh, Nguồn); Vận hành (PIC, Điểm thi). Tổng 10 nhóm, 11 key cấu trúc. Dùng checkbox group có label cho multi, tìm option khi dài; Date range với label hai đầu. Đặt action **Áp dụng** và **Hủy** cố định ở footer; Reset trong form chỉ đổi draft. Nút Áp dụng có thể disabled nếu không thay đổi hoặc ngày đảo. Đóng/Escape không commit. Mở lại form thấy committed values. Chip ngoài form có thể xóa nhóm tức thời, nút Xóa lọc xóa toàn bộ cấu trúc nhưng không reset scope/tab/search.

- Date filter chính xác là **Ngày tiếp xúc đầu tiên**. Không gọi chung là thời gian đăng ký. Mặc định toàn bộ dữ liệu, không dùng preset 7 ngày gần đây mặc định. Bounds chỉ là gợi ý; date range một đầu hợp lệ.
- q là tìm trong bảng (mã, tên, email theo quyền); input có label; debounce và page reset trong một lần cập nhật. Khi q tồn tại, view Phân tích hiển thị một dòng giải thích “Tìm kiếm hồ sơ không áp dụng cho phân tích”. Không đưa tên/email vào URL. q từ backend tìm trên email gốc dù bị mask là rủi ro backend, không khẳng định frontend đã sửa.
- Scope đổi → reset draft, applied q, filter/page, close detail/export, đợi danh mục và scope hợp lệ trước request; không show count/rows cũ. Options scoped nhưng không cascade theo filter; lỗi options không tự xóa lựa chọn rồi fetch toàn scope. URL filter invalid cần báo, tránh mở rộng tập dữ liệu im lặng.
- Chỉ mount/request view đang dùng. Reload là cập nhật view hiện tại, không bắn tất cả endpoints. Same-path refresh có thể giữ dữ liệu với cảnh báo cũ; khác query/scope không giữ. List/summary không echo scope: dùng identity boundary + path key + abort. Khi total giảm, clamp page một lần.

## 5. Phân tích — BA/VD review

```text
[ Hồ sơ liên hệ | Phân tích tuyển sinh ● ]
[ Bộ lọc · 1 ] [ Bảng A × ]
┌ Đăng ký web (hero) ─┐ ┌ Đã đóng phí / tỷ lệ ┐ ┌ Lệ phí ghi nhận ┐
│ Liên hệ duy nhất    │ │ Miễn phí (riêng)     │ │ Số tiền         │
└─────────────────────┘ └─────────────────────┘ └─────────────────┘
[ Phễu 3 thanh: số hồ sơ + mẫu số ] [ Chưa ghi nhận phí: chú thích ]
[ Đăng ký theo ngày — chart + bảng số liệu ]
[ Phân bố & chuyển đổi — Nhóm theo Bảng thi ▾ | Bảng số liệu ]
[ Chất lượng: hồ sơ có cờ / số cờ (không đồng nhất) ]
```

- Không biến 3 KPI thành 6–10 card cùng cấp. Hero là đăng ký web, phụ là paid/rate/revenue; tổng liên hệ đi kèm để giữ mẫu số. Nếu `paid_rate=null`, hiện “—”, không 0%; `free` có nhãn riêng, không suy valid registration từ paid/free nếu giao nhau chưa xác định.
- Phễu React/CSS cùng logic an toàn V16, total >= web >= paid; nếu dữ liệu bất thường, fallback bảng và thông báo, không vẽ đoạn âm. “Chưa ghi nhận đóng phí” có thể gồm miễn phí. Không gọi khoản lệ phí nhóm này là doanh thu chắc chắn.
- Daily bar: mỗi ngày có đăng ký và trạng thái đóng phí hiện tại của các hồ sơ đó; không gọi là thanh toán phát sinh theo ngày. Backend chọn cohort theo first_touch nên điểm registration có thể nằm ngoài date range đang lọc. Giữ zero days và ghi rõ hồ sơ thiếu ngày. Trục/tooltip/bảng cùng nghĩa.
- Group panel mặc định Bảng thi; các chiều miền, tỉnh, segment, PIC, tổ hợp nguồn. Một chart/one table toggle; danh sách nhóm dài có giới hạn top-N rõ và full table. Source combo không phải channel attribution. Không drill down source combo nếu không có exact filter; chỉ dùng field mapping thật.
- V16 chart palette `primary`, `secondary`, `onSecondaryContainer`, `tertiary`, `text`, `muted`, `grid`, `surface`, `outline` resolve CSS. Dùng role mapping nhất quán, legend chữ 14–15px, màu data theo theme, không dùng màu là dấu hiệu duy nhất. ECharts wrapper đã register LineChart/BarChart, không thêm heatmap hay chart library. `makeOption(palette,layout)`; chart host width quyết định tick budget 3–9, tooltip confined, mobile hỗ trợ touch; không bỏ điểm. Chart lỗi có bảng thay thế. V16 wrapper có class `ov-note` trong lỗi, cần kiểm tra hiển thị ở Contacts (không phụ thuộc CSS nghiệp vụ Overview; nếu cần sửa shared class thì review regression nhỏ).

## 6. Nghiệp vụ và bảo mật — điểm không được mở rộng ngầm

| Tình huống | Quyết định |
|---|---|
| Link Overview “Hồ sơ chưa ghi nhận đóng phí” | Giữ link `/crm` chung. Không tạo `payment_status=Chưa thanh toán` rồi tuyên bố exact cohort. API không có filter web_registered/paid, row không có hai boolean đó; lead chưa web có thể cùng status. |
| Contact detail | Chỉ dùng fields thực tế trong LIST_FIELDS; không suy web_registered từ web_registered_at null. Không hiển thị CCCD, DOB, notes, question mặc định. Không lưu row PII lâu dài, không log q. |
| Admin scope đối tác | Row scope theo mã đã chọn, quyền API của admin vẫn là admin. Không nói đang impersonate quyền/module/PII của partner. |
| CSV | Tất cả rows khớp filter/q, thứ tự mã, không phải page/sort đang thấy. Export disabled khi snapshot chưa nhất quán, hủy khi đổi scope/query. Backend formula injection là rủi ro cần báo riêng, không claim đã fix. |
| 0, null, thiếu field | 0 ₫ khác “—”; flag trống khác flag missing; unknown status trung tính. |
| PII và quyền | API là boundary, không tự reveal/mask reverse. Tài khoản không contacts không thấy route; backend 403 có trạng thái rõ. |

## 7. Cổng bắt đầu V17 và review thực nghiệm

V17 bắt đầu từ source V16 đã kiểm tra. Thực hiện Records mode trước; chưa expose tab phân tích nếu chưa có chức năng. Nếu cần giao V17 độc lập, chưa có selector view hoàn chỉnh cho đến V18, nhưng state model phải giữ khả năng mở rộng. Không để nút chết. V18 thêm analysis; V19 hardening. Không sửa docs bằng cách giả định kết quả kiểm thử đã đạt.

| Review gate | Cách kiểm chứng | Trạng thái hiện tại |
|---|---|---|
| IA/VD | D01–D08 chốt ở tài liệu này | Reviewed tĩnh |
| Contract | Query keys và semantics theo router | Reviewed tĩnh |
| Desktop/mobile task flow | Search → filter → detail → pagination → CSV; 320/390/768/1280/1440 và sidebar | NOT RUN, chưa có implementation |
| Responsive | Matrix R01–R14 trong contacts-review; thêm test 679/680 và 999/1000 host width, focus khi đổi layout | NOT RUN |
| Theme | 5 seed x light/dark/system, contrast, no hardcode, legend/tooltip nhất quán | NOT RUN |
| Security | S01–S09, scope race, masked account, cancel export | NOT RUN |
| Build/runtime | tsc/Vite, test:local, FastAPI/MongoDB thực tế, screenshot không PII | NOT RUN |

Khi coding, giữ thứ tự triển khai và acceptance trong `contacts-plan.md` và `contacts-review.md`. Tạo patch theo baseline thật; không commit/push tự động. Mục tiêu không chỉ đẹp trên 1440px mà hoàn thành lookup trên 320px với đủ hành động. Mọi thay đổi so với D01–D08 phải giải thích và ghi review log, không silently thay IA.
