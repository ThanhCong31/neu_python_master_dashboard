# V21–V23 — Lead từ biểu mẫu

Baseline: V20 (workspace V19 + patch V20). Thiết kế theo docs/leads, bao gồm leads-design-review.md. Chỉ sửa feature Leads; không sửa backend, Shell, Contacts, routes, dependencies hoặc các feature khác. Không gộp các patch tài liệu thiết kế vào patch code.

## V21 — Records

- `/lead` dùng cùng hai chế độ và PageRefresh của V20; fetch `/meta/options`, `/leads/list` hoặc `/leads/summary` theo view. Scope do workspace và server xác định, không lấy partner trong URL. Boundary theo tài khoản, quyền PII và scope; reset state khi đổi identity.
- 9 nhóm lọc (ngày gửi và 8 nhóm đa chọn) có draft, Apply, Cancel, chip và clear. Khoảng ngày mở, kiểm tra lịch; không hardcode min/max. Search debounce 300 ms, trong memory, chỉ list/CSV. Page reset khi query/sort/size đổi. Options scope không hợp lệ chặn request.
- 4 cột mặc định, thêm optional columns; sort theo allowlist server. Dưới 680px chiều rộng record panel chuyển list, không mount table. Chi tiết chỉ đọc từ row snapshot, đóng khi snapshot/query đổi; không dùng Contact ID làm ID duy nhất cho lượt gửi.
- CSV cho quyền can_view_pii, mọi dòng match theo thứ tự ngày gửi tăng dần, không gửi sort/page. Abort khi query/disabled/mode/unmount; kiểm tra MIME và dung lượng. Cảnh báo dữ liệu cá nhân. Native confirmation là bước bảo vệ trước khi tải; dialog chi tiết/lọc theo theme. Masked role không hiển thị question/note hoặc nút CSV.

## V22 — Analytics

- Tổng dòng lead và số Contact ID duy nhất có giá trị, không suy ra số người trùng bằng phép trừ. Kết quả đối soát là phân loại, không funnel. Giữ nhóm khác/unknown, kiểm tra tổng và không vẽ khi sai invariant.
- Biểu đồ đối soát theo nguồn; bảng đầy đủ khi nhiều nhóm/nhãn quá dài. Nguồn thực từ API. Tuần ISO UTC với tuần trống giữa các mốc, hỗ trợ đổi năm và tuần 53; tối đa 52 tuần cuối trong chart nếu span dài, bảng vẫn giữ tất cả row. Chú thích timestamp thiếu và fallback ETL. Không dùng start làm Monday.
- Một dimension selector thay thế nhiều chart; top 10 nhóm nếu cần, bảng đầy đủ, tỷ lệ có mẫu số rõ. Drilldown chỉ với filter server hỗ trợ, giữ điều kiện khác, thu hẹp nhóm hiện tại. Không drilldown câu hỏi, tự khai, heard_from. Tự khai không phải CRM verified. Không hiển thị by_question.
- ECharts lazy mount, theme tokens và responsive host V16, bảng thay thế khi lỗi; không load chart ở Records. Không thêm dependency hoặc dữ liệu giả trong app.

## V23 — Review evidence (24/11/2026)

| Kiểm tra | Kết quả |
|---|---|
| `node --experimental-strip-types scripts/test-leads.mjs` | PASS: filter/query, CSV parity, sort, PII UI guard, exact drilldown, ISO week, missing/unknown, responsive thresholds |
| `node --experimental-strip-types scripts/test-contacts.mjs` | PASS |
| `npm run test:overview` | PASS |
| `npm run test:theme` | PASS |
| `npm run test:api` | PASS |
| Global TypeScript 5.8.3 strict check model/query/analytics | PASS, dependency-free logic only |
| TypeScript syntax & local import resolution | PASS, 93 source modules; not full typecheck |
| Chromium static HTML/CSS fixtures | PASS, 56 width/theme/view combinations, 28 dialog checks. 320–1920 content width, light/dark, long labels, default table and document no horizontal overflow. Markup replicated with sample data; not React/Base UI/ECharts runtime |
| `npm run build` | BLOCKED: TS2688 missing node and vite/client type definitions; dependencies not installed in isolated workspace |
| Live backend, all five palettes, actual ECharts rendering, keyboard/touch, browser zoom, slow network/scope races | NOT RUN — required for release acceptance |

## Remaining review on actual application

From frontend-redesign: `node --experimental-strip-types scripts/test-leads.mjs`, `npm run test:local`, `npm run build`, `npm run dev`. Run API and DB as in existing project. Verify two modes, duplicate Contact ID detail, filters/apply/cancel, page changes, scope changes, masked/full permission CSV, same-query refresh, 320–1920 px including content width around 680/1000, sidebar, 200% zoom and keyboard. Verify ECharts long source legends, zero weeks, tooltip, theme switching and full table alternative. Test Contacts and Overview navigation/refresh. Do not mark release fully accepted before these pass.

## Backend follow-up (not fixed by UI)

Direct `/leads/list` and CSV endpoints still expose `question` for masked accounts under current backend policy; summary also returns `by_question`. UI suppression is not authorization. Review server-side redaction, export authorization and CSV spreadsheet formula injection before production. Search q still includes email on server even for masked accounts. Need stable lead ID and exact contact lookup API before linking one lead directly to CRM record. Timestamp provenance and inconsistent ETL source labels also remain data-layer issues. No changes to backend in this patch.
