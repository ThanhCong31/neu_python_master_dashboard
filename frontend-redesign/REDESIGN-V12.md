# V12 — Tổng quan: bản tích hợp sau 3 vòng thiết kế và review

## Phạm vi

Baseline: `neu-dashboard-m3-expressive-v9-selection-cleanup.zip`. Ba snapshot V10 → V11 → V12 được triển khai và commit trong workspace tách biệt. Xem `REDESIGN-V10.md`, `REDESIGN-V11.md`, `docs/overview/overview-issues.md`, `docs/overview/overview-plan.md`. Bản cuối thực hiện các quyết định IA/VD sau audit; khi kế hoạch ban đầu khác implementation cuối, tài liệu V12 này mô tả quyết định cuối. Không sửa backend, data, app shell, authentication, quyền, routes, các màn hình hệ thống hay màn hình communications của đồng đội.

## Quyết định thiết kế cuối cùng

- Executive BI dashboard: một cụm KPI liên kết (đăng ký web nổi bật; liên hệ, đóng phí, lệ phí ghi nhận hỗ trợ), phễu và hồ sơ cần đối soát, timeline, tóm tắt lĩnh vực. Không có filter toàn trang vì các nhóm dữ liệu dùng ngữ nghĩa thời gian khác nhau. Scope dùng từ Shell hiện có. Không đặt thêm H1.
- M3 Expressive: outer corners lớn, inner corners nhỏ cho nhóm liên quan; dùng Material semantic roles và display weight; bề mặt tonal có mục đích, không gradient hay màu brand tùy tiện; hiển thị số vi-VN, đơn vị và ngữ nghĩa chính xác. Container queries dựa trên chiều rộng nội dung. V12 giảm nested cards và thu gọn tóm tắt tài trợ; desktop có connected action group, mobile có menu, không dùng selected state cho export.
- Ba định dạng Excel, Word, PDF chỉ ở Overview, sử dụng API xuất báo cáo thật. Đây là báo cáo nghiệp vụ đầy đủ theo scope, không phải bản in giao diện. Báo cáo do server tạo có thể gồm dữ liệu giả lập/giả định và ROI; frontend không sửa nội dung báo cáo. Backend cần bổ sung caveat vào báo cáo nếu muốn cam kết tính nhất quán tuyệt đối.
- ECharts 6.1.0 lấy phiên bản và integrity từ lockfile frontend main. Dùng modular import, lazy chunk, adapter lấy CSS color roles, line styles khác nhau, bảng HTML tương đương, ResizeObserver, dispose, cập nhật khi đổi palette và html.dark, tôn trọng reduced motion. Chart không tải được vẫn cho xem bảng. Phễu dùng CSS vì chỉ có ba mốc, tránh kéo thêm engine cho trực quan đơn giản.
- Adaptive primary: CRM → Exams → Sponsorship → Marketing tùy `data.modules`, `user.modules`, section thực có. Không hardcode đối tác, không hiển thị dữ liệu trái scope. Scope mismatch hiện lỗi và retry. Khi đổi scope, chart/control state reset và export đang chạy bị hủy; useResource của V9 bỏ dữ liệu từ path cũ.
- CRM: paid là đóng phí; `unpaid_registered` có thể bao gồm miễn phí, không gọi là nợ. Không coi `potential_revenue` là dự báo. Timeline paid được nhóm theo ngày đăng ký web, không phải ngày giao dịch; thiếu ngày được ghi chú. Không thêm phần trăm tăng trưởng, target hoặc sparkline giả. Grade dùng ngưỡng 800/650/500 theo ETL main; gom grade null/lạ vào chưa xếp loại, PM119 ghi giả lập. Reach là tổng lượt, không phải người duy nhất. ROI chuyển về Truyền thông, Pipeline chuyển về Chất lượng dữ liệu.

## File và trách nhiệm

| File | Trách nhiệm |
|---|---|
| `src/features/overview/Overview.tsx` | Scope, request, phân quyền section, layout, trạng thái |
| `src/features/overview/model.ts` | Contract tối thiểu, hàm thuần về phạm vi, phễu, grade, export |
| `src/features/overview/components/Metrics.tsx` | Cụm KPI |
| `src/features/overview/components/Analysis.tsx` | Phễu, follow-up, timeline, grade, bảng và chart boundary |
| `src/features/overview/components/Domains.tsx` | Tóm tắt nghiệp vụ theo module |
| `src/features/overview/components/ExportActions.tsx` | Connected actions / menu, download, trạng thái, abort |
| `src/features/overview/overview.css` | Styles cục bộ, responsive container queries |
| `src/shared/charts/Chart.tsx`, `theme.ts` | ECharts lifecycle và theme adapter dùng chung |
| `src/shared/format.ts` | Formatter vi-VN dùng chung |
| `src/components/expressive/button-group.tsx`, `src/styles/globals.css` | Nhóm Button primitives hiện có, CSS nối góc |
| `src/services/api.ts` | Thêm `apiFile`, vẫn dùng chung HTTP error/session handling |
| `package.json`, `package-lock.json` | ECharts + test script; không thay dependency khác |
| `scripts/test-overview.mjs`, `scripts/test-api-service.mjs` | Unit tests thuần và kiểm thử HTTP blob |

Đồng đội có thể import `Chart` (default export; dùng lazy như Analysis), `useChartPalette`, `chartBase`, formatter và ButtonGroup. Component biểu đồ nhận `makeOption(palette)`; từng feature chịu trách nhiệm định nghĩa series, đơn vị, ngữ nghĩa, bảng thay thế. Không thay đổi API contract của hook `useResource`. Không xây dựng thêm generic component nếu chưa có nhu cầu.

## Kết quả kiểm thử thực tế trong workspace

| Kiểm tra | Kết quả |
|---|---|
| `npm run test:overview` | PASS: module/scope selection, URL/MIME, tỷ lệ, bất thường phễu, grade, vi-VN |
| `npm run test:api` | PASS: JSON hiện có + blob, cookie cùng origin, 401 |
| `npm run test:theme` | PASS: theme, persistence và system mode theo unit test V9 |
| TypeScript parser và local import resolution (74 modules) | PASS: không có lỗi cú pháp/import cục bộ; không phải full type check |
| `npm install --package-lock-only --offline --ignore-scripts` | Exit 0; sau đó giữ lại metadata libc của V9 mà npm cũ loại bỏ; chưa tải package tarballs |
| Chromium static layout fixture | PASS: 1440, 1280, 390, 360 px × light/dark, không tràn ngang document; fixture dùng markup component KPI/phễu/domain và CSS thật, shell/button/chart minh họa. Không phải chạy React/ECharts thực, chưa kiểm tra đủ 5 palette, keyboard, hover, resize chart thật |
| `npm run build` | CHƯA PASS: registry DNS EAI_AGAIN, không có npm dependencies; compiler thiếu `node`/`vite/client` type definitions |
| Backend FastAPI/MongoDB, đăng nhập, export tài liệu thật | CHƯA CHẠY: không có backend hoặc dữ liệu dự án trong workspace |

Không ghi rằng sản phẩm đã hoàn thành QA tích hợp hoặc production-ready. Dữ liệu fixture chỉ phục vụ kiểm tra CSS ngoài source giao hàng, không có mock trong production. Các ảnh review là bố cục tĩnh, dùng bảng màu CSS baseline, không phải ảnh chụp ứng dụng đang chạy.

## Tích hợp vào repository đang làm việc

**Ưu tiên patch/overlay**, không giải nén cả baseline V9 lên nhánh có code đồng đội. Patch có đường dẫn `frontend-redesign/` từ root repo. Lưu file patch ngoài repo rồi chạy `git apply --check /duong-dan/neu-overview-v12.patch`; nếu pass, `git apply /duong-dan/neu-overview-v12.patch`. Nếu conflict (đặc biệt package/README/shared service), xem diff và hợp nhất có chủ đích; không dùng reset/checkout toàn bộ. ZIP overlay chứa đúng file đổi, không có node_modules/dist/git. Không dùng cả patch lẫn ZIP trên cùng một bản.

Chạy từ thư mục `frontend-redesign/` trên Node >=22.16 (ưu tiên Node 22 LTS tương thích test loader V9):

```sh
npm ci
npm run build
npm run test:local
npm run dev
```

Kiểm tra backend cổng 8000 đã chạy và Vite 5174. Trước khi commit, xem `git diff --stat` và chỉ stage `frontend-redesign/`. Nếu đồng đội đã thay package lock, hợp nhất dependency trước khi chạy npm install; không overwrite lockfile. Các file hướng dẫn AGENTS/CONTRIBUTING và phần communications không có trong overlay vì không thay đổi.

## Checklist nghiệm thu trên máy phát triển

- [ ] `npm ci` và full TypeScript/Vite build chạy thành công; xác nhận ECharts chunk lazy load.
- [ ] Admin toàn hệ thống, admin xem DN, NEU, METAADS; tài khoản đối tác thật; trường hợp module bị thu hồi, chỉ Overview, response mismatch. Không thấy số liệu cũ khi đổi scope nhanh; lỗi mạng hiển thị retry.
- [ ] So sánh KPI với Swagger `/api/overview`, không cộng CRM với PM119; kiểm tra số 0/null, miễn phí, thiếu ngày, grade lạ, ngân sách null. Không suy diễn ROI.
- [ ] ECharts chart/table đối chiếu từng ngày, chế độ ngày/lũy kế, tooltip, ResizeObserver khi thu/mở sidebar, theme 5 palette × sáng/tối, system mode và reduced motion.
- [ ] Tải xlsx/docx/pdf, kiểm nội dung và phạm vi, đổi scope khi tải, HTTP 401/403, lỗi mạng. Không tuyên bố đã lưu file khi trình duyệt chưa xác nhận.
- [ ] Tab/Shift+Tab, Enter/Space, focus visible, menu export keyboard, screen reader, 200% zoom, 360/390/768/1280/1440px. Kiểm tra thật với Inter Variable và Shell.
- [ ] Các link nghiệp vụ dùng route hiện có; những màn hình còn placeholder sẽ được hoàn thiện ở bước tiếp theo.

## Commit đề xuất

Sau khi review và build trên máy phát triển: `feat(overview): implement expressive executive dashboard`. Có thể tách commit shared chart/export foundation nếu cần, nhưng không stage `data/` hoặc code ngoài phạm vi.
