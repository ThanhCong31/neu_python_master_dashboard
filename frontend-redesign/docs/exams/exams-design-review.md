# Design Review — Kết quả thi / V29 → V30–V32

Trạng thái: chốt thiết kế, chưa sửa application code. Tài liệu này ưu tiên khi có khác biệt với bản đề xuất trong [exams-design.md](exams-design.md). Đọc cùng [exams-api-contract.md](exams-api-contract.md), [exams-plan.md](exams-plan.md), [exams-review.md](exams-review.md), [exams-issues.md](exams-issues.md).

## 1. Evidence và phạm vi
- Review sáu tài liệu Exams và source local V29 trong `design-system-work/frontend-redesign`: V28 commit `49c5aaf` + staged V29 diff. `features/results/Exams.tsx` trả null; route `/diem-thi`, id `exams` đã có. Không giả định remote đã đồng bộ.
- Đối chiếu contract từ main đã fetch ở audit: `routers/exams.py`, `filters.py`, `routers/misc.py`, `etl/loaders.py`, `process_and_seed.py`, `DATA_DICTIONARY.md`. Không có API mới hoặc DB snapshot được kiểm tra ở vòng review này.
- Đọc `shared/DataWorkspace.tsx`, `data-workspace.css`, `WorkspaceSelect.tsx`, `ResponsiveDialog.tsx`, `CsvDownload.tsx`, `PageActions.tsx`, `services/useResource.ts`, `components/expressive/view-switch.tsx`, `shared/charts/{Chart,responsive,theme}.ts(x)`.
- Không đổi Shell, Overview, Contacts, Leads, màn hình đồng đội, backend, dữ liệu, dependencies hoặc lockfile. Tái sử dụng foundation; mọi adaptation riêng thuộc feature results. Chỉ mở rộng shared primitive sau khi xác định cần thiết và có regression test.

## 2. IA đã chốt
1. Shell V20 là tiêu đề duy nhất và vị trí duy nhất của PageRefresh. Không thêm mục con sidebar, không thêm page heading/refresh lặp.
2. Dòng cảnh báo cố định nhưng gọn: “Điểm thi giả lập — không dùng để công bố hoặc đánh giá cá nhân.” Hiển thị cả loading/error/empty, detail và trước export. Không gắn nhãn cảnh báo trên từng dòng bảng.
3. Dataset selector là context cấp feature, đặt ngay trước ViewSwitch. Dùng WorkspaceSelect compact; label “Bộ dữ liệu”; tên từ meta, mô tả liên kết CRM hoặc độc lập từ linked. Không dùng tên rút gọn làm số đếm scope. Không đưa vào filter dialog hay clear-all.
4. ViewSwitch hai lựa chọn “Bảng điểm” (default) / “Phân tích kết quả”; cùng M3 geometry/motion V29. Filter button và InputChip ở dòng riêng; không thêm nhiều toggle cạnh nhau. Bộ lọc chung gồm 9 nhóm từ contract, áp dụng theo lô.
5. Không global round switch: bảng hiển thị hai vòng cạnh nhau. Chỉ có round selector cục bộ trong khối Xếp loại & phần thi. Không tạo filter “Có điểm CK” vì API không có; advanced là cờ vào CK, grade là xếp loại VL.
6. Search chỉ records/CSV, q không đưa vào URL; đổi view giữ search nhưng analysis không nhận q. Dùng helper ngắn, không chiếm một hàng toolbar nếu đủ chỗ. Không tạo action edit, cấp chứng chỉ, công bố hoặc tải PDF.

## 3. Dataset state machine (blocking)
- Scoped discovery `/meta/options?dataset=PM119` (partner chỉ từ Shell admin). Response `viewing_partner` phải khớp effective scope; lấy `exams.datasets` (không lấy summary.datasets). PM119 chỉ là discovery default, không gọi data PM119 khi không được phép.
- Resolve selection: URL hợp lệ trong danh mục -> dùng; không có URL -> PM119 nếu có, nếu không first available theo thứ tự API; URL không hợp lệ -> thông báo và replace bằng dataset được phép, xóa filter phụ thuộc. Không có dataset -> empty state với refresh, không gọi list/summary/CSV. Không có exams object hoặc scope echo sai -> lỗi contract, không coi là danh sách rỗng.
- Khi chọn dataset khác: đóng detail/filter draft, hủy export, reset q và page, clear structural filters, giữ view; đặt URL trong một update. Chờ options của đúng dataset/path trước khi cho phép data request. Với sort/page size, giữ preference nếu hợp lệ. Không dùng filter options của dataset trước.
- Scope/identity đổi: unmount workbench theo key username/role/effectivePartner/can_view_pii; reset dataset selection về discovery, filters, q, page, dialogs, export. Không để stale response từ A→B→A render; kiểm thử abort và snapshot identity/path. Không tự gọi retry lặp.
- Refresh: options + active resource; nếu options loại dataset đang chọn, invalidate data và thực hiện resolve lại, không giữ snapshot sai context. Refresh lỗi cùng path hiển thị thông báo cũ; không biến metadata chưa xác thực thành permission mới. Dùng `useResource` clearWhenDisabled ở list/summary khi cần; chỉ active view phát request. Không gọi summary để lấy metadata cho detail records.

## 4. Bảng điểm: giữ thông tin, giảm bề rộng
Source V29 `RecordTable` dùng table thực, first-cell min 180px, other data-cell min 104px, action icon 48px + padding; bảng 5 cột + action có lower bound khoảng 652px chưa tính header dài/border/panel padding. Do đó không thể giả định bảng 5 cột sẽ vừa content width 680px. Các breakpoint tính theo container, kiểm tra cả panel padding thực.

| Content width | Default presentation |
|---|---|
| <680px | RecordList: tên/mã, bảng, VL/CK có nhãn, chứng chỉ, detail action; không cuộn ngang |
| 680–999px | Table 4 cột: Thí sinh (tên/mã/bảng), Điểm VL, Điểm CK, Chứng chỉ; action riêng |
| ≥1000px | Table 5 cột: Thí sinh, Bảng, Điểm VL, Điểm CK, Chứng chỉ; action riêng |

- Bảng thi không biến mất ở medium, chuyển vào identity. Hạng VL có thể là secondary text dưới điểm nếu vừa; luôn ghi “Hạng … trong bảng” ở detail. Không gộp hạng giữa bảng hoặc tính lại khi lọc; không dùng medal/trophy cho người có điểm cao.
- Trạng thái chứng chỉ: “Đạt ngưỡng” / “Chưa đạt ngưỡng” / “Chưa có dữ liệu”; flag backend quyết định, không suy từ điểm VL. Null điểm là — (có giải thích), zero là 0. Giữ chữ số thập phân có ý nghĩa; không làm 599.9 thành 600.
- Cột bổ sung theo user preference; chỉ cột bổ sung được phép gây local horizontal scroll. Cột thiết yếu không được bỏ; mobile detail giữ toàn bộ trường. Không sort final.rank, board hoặc certificate ở server nếu không được hỗ trợ. Default -qualifier.total, label “Điểm VL ↓” không gọi bảng xếp hạng toàn hệ thống.
- Dùng `dw-record-toolbar`, TextField search pill, WorkspaceSelect compact, Cột và CsvDownload. Cao 48px; gap 12px; label/trigger cùng hàng khi đủ chỗ; wrap tự nhiên. Không tạo outer container cho ViewSwitch hoặc thêm form fields 56px vào toolbar.
- Empty: nếu không có điều kiện tìm/ lọc, thông báo không có thí sinh trong dataset/scope, không hiện nút xóa lọc vô nghĩa. Nếu có điều kiện, có reset. Không hiển thị pager 1/1 khi total=0; pager bình thường dùng WorkspacePagination.

## 5. Chi tiết thí sinh và xuất dữ liệu
- `ResponsiveDialog` native: header tên + dataset/STT/bảng, dòng cảnh báo, thông tin hồ sơ, hai panel VL/CK, chứng chỉ. 640px modal hiện tại: ưu tiên hai panel xếp dọc; chỉ side-by-side khi thực sự đủ rộng (không cần nới shared dialog). Mobile full screen, body cuộn, close/Escape/focus restore.
- Mỗi vòng hiển thị level, total, hạng trong bảng, grade, điểm phần thi. Không hardcode điểm tối đa từng phần: meta options không có structure. Không gọi summary ẩn; không biến partial section thành điểm 0. Không có final + advanced=true: “Vào chung kết · Chưa có điểm CK”; false: “Không ghi nhận điểm CK”; final có nhưng advanced=false: note dữ liệu không nhất quán. Missing flag không phải false.
- `contact_id` chỉ khi có và dataset linked; không tạo liên kết hồ sơ CRM chính xác vì chưa có endpoint lookup. Email chỉ hiển thị khi can_view_pii, không gửi raw names/PII sang telemetry hoặc chart labels. Không suy từ cờ paid thành đủ điều kiện.
- Dùng CsvDownload hiện có, `confirmMessage` cảnh báo điểm giả lập + PII, filename gợi ý `diem_thi_<validated-code>_gia-lap.csv` (chỉ tên file local, backend vẫn trả format cố định). CSV chứa tất cả dòng khớp filter/q, thứ tự board rồi qualifier.rank, không theo trang hoặc cột ẩn. Không sửa nội dung CSV để giả vờ server đã bảo vệ; file hiện không có cột simulated. Restricted export không cung cấp cho tới khi owner xác nhận policy; đây là UI mitigation, API vẫn cần kiểm tra PII và CSV injection. Disable khi zero, pending q, invalid context, data mismatch. Abort on query/scope/dataset change. Không coi browser download request là lưu thành công.

## 6. Phân tích — hierarchy, không thêm chart vô nghĩa
- Hero count “Thí sinh trong phạm vi”, avg VL, advanced, certificate. Không thêm KPI doanh thu/paid; min/max và avg CK chỉ bổ trợ nếu có. Count matched documents, avg excludes null, cert_rate denominator all matched records. Dùng số server, không tính lại grade/advanced/certificate. Rule note chỉ từ params hợp lệ; thiếu metadata thì không tự gán 600/10%.
- Histogram VL: một Bar chart ECharts V16, 10 bins (0–<100 … >=900), grouped/stacked theo board thực. Ưu tiên stacked count vì đơn vị chung, không giả tạo final histogram. Tooltip có đầy đủ khoảng điểm; table alternate luôn truy cập. Tổng histogram vs count để minh bạch coverage; invalid bins cảnh báo. Giảm nhãn theo chart host, không giảm dữ liệu. Màu Material palette, legend text rõ; no hardcoded theme colors.
- Xếp loại & phần thi: local round selector (ViewSwitch compact), hai subareas đọc dọc khi hẹp. Grade counts/share theo classified rows; unknown grades không bị mất. Sections avg/max và pct từ API, theo board và vòng, không so sánh raw điểm giữa cấu trúc khác nhau, không suy ra tiến bộ cá nhân khi cohort thay đổi. Dùng HTML bars/table để tránh phụ thuộc chart type mới. Missing/invalid denominator => dash, không zero/100% giả. Hiển thị count đúng nghĩa group entries, không khẳng định n non-null.
- Phân bố theo nhóm: Compact Select board/school/school_type/province/region; mặc định board. Table có count, avg VL, certificates, finalists. Nếu bar top-N, chọn theo count (không theo avg để tránh ranking trường), nói rõ N/tổng, bảng đầy đủ; avg null không vẽ bar. Drill-down chỉ từ field/value valid meta, no comma/null/unknown, giữ dataset + filters khác, clear q, page=1, switch records.
- Hoãn scatter cá nhân, boxplot và paid-score comparison. Shared Chart chỉ register LineChart/BarChart; không thêm ECharts module/dependency. Không render finalists.full_name hay dữ liệu cá nhân trong phân tích.

## 7. Review gates và bàn giao
- V30: model/query/state tests đầu tiên, records + detail + CSV + dataset switching; review at 320/390/680/768/1024/1280, options mismatch and no datasets. Kiểm tra cột thực với 679/680/999/1000 content, panel padding. Nếu bảng mặc định tràn, sửa feature geometry trước khi V31.
- V31: analytics + round selector, histogram, grade/section denominators, breakdown. Test unknown bins/grades, missing scores/metadata, tie rank, distinct final cohort; resize 339/340/479/480 chart host, all data retained. No inactive list request.
- V32: thực hiện toàn bộ exams-review.md, thêm dataset race + CSV warning/filename + 4-column medium coverage. Regression Overview/Contacts/Leads, shared controls V29. Full build, real backend, keyboard/touch, five themes light/dark/system, zoom 200% là release gate. Static CSS/logic checks chỉ evidence riêng; nếu không chạy được thì NOT RUN, không ghi PASS.
- One patch V29→V32 cho implementation, docs riêng. Verify git apply against clean V29 and git diff --check. Không push hoặc commit thay user. Không tuyên bố hoàn thành implementation ở vòng review này.
