# V17–V19 — Liên hệ & chuyển đổi (Contacts)

Baseline: V16 local (`/crm` còn placeholder), đối chiếu branch `frontend-redesign` đã đọc (tree `bee42d6f18451102bc815b1693b8103bd58de232`). Dùng 7 tài liệu Contacts đã chốt, đặc biệt design-review. Patch chỉ sửa entry Contacts và thêm source riêng, test độc lập và báo cáo này; không sửa Leads, Shell, Overview, shared chart, package/lock, backend, data hay tài liệu đã có trên máy người dùng. Không push remote.

## V17 — Records

- Default Hồ sơ; một filter form với 10 nhóm, 11 key, áp dụng theo lô, option theo scope, chip xóa từng nhóm. URL lưu cấu trúc/view, không lưu q. Invalid URL chặn request, không mở rộng kết quả âm thầm. Ngày tiếp xúc đầu tiên, không phải ngày đăng ký.
- Model/query tách biệt, real endpoints `/meta/options`, `/contacts/list`, CSV qua `apiFile`. List và CSV cùng committed filters/q; CSV không page/sort (backend luôn sort mã). Disable export khi q đang debounce, filter form mở, data chưa tải/xảy ra lỗi refresh. Abort khi query/scope thay đổi. Không dùng dữ liệu giả trong app.
- Table có cột chọn thêm, sort whitelist, server pagination 10/20/50/100. Mobile semantic list theo actual panel width; không hai cây tương tác cùng lúc. Read-only detail lấy row đang hiển thị, quyền PII hạn chế trường nhạy cảm/free text. Native dialog và focus restore. Không tạo endpoint/detail mutation giả.

## V18 — Analysis

- Lazy-load Analytics khi chọn Phân tích; chỉ mount view đang dùng. KPI từ summary, không từ page. Q riêng bảng, notice khi tồn tại q. Theme qua shared V16 Chart, responsive tick helper; stacked bars cho count theo ngày/phân nhóm, không thêm engine.
- Funnel kiểm tra quan hệ total >= web >= paid. Không vẽ đoạn âm; bất thường daily/grouping fallback bảng gốc. Miễn phí khác đóng phí; nhóm chưa ghi nhận phí có thể gồm miễn phí; không dùng payment_status để drill-down giả. Daily là trạng thái hiện tại theo ngày đăng ký, không ngày giao dịch; giữ tất cả mốc ngày, ngày thiếu có ghi chú.
- Một grouping panel chọn bảng/miền/tỉnh/segment/PIC/tổ hợp nguồn/kênh. Top 10 theo count chỉ để vẽ, bảng đủ nhóm. Drilldown từ bảng chỉ khi mapping chính xác, có option hợp lệ; source combo không drilldown, null PIC dùng __none__. Drilldown thay đúng chiều đang chọn, giữ các chiều khác, xóa q và chuyển Records page 1. Quality count và count từng cờ riêng.

## V19 — Review và hardening

- Identity boundary theo user/role/effective partner/quyền PII; khi đổi scope, ẩn view cũ trước khi xóa filters URL, remount, tải options mới; không dùng lại row/data cũ. `useResource` giữ snapshot chỉ cùng path. Debounce q và reset page, page state theo query key, clamp khi total giảm. Detail chỉ đọc row thuộc path hiện tại. Cột hiển thị là preference riêng.
- Filter/refresh cùng hàng trên compact; chip wrap. Panel <680px list, 680–999 table cột cơ bản, >=1000 thêm PIC mặc định. Scroll ngang chỉ trong bảng khi thêm cột; các action touch target >=44px. Dialog full screen khi viewport <=680; footer không cuộn theo body. M3 token và Button/ToggleButton/TextField; native select/checkbox/date có style cục bộ, không thêm library.
- Known limitations backend: không exact web_registered/paid/flagged filter, không boolean đăng ký trong list, không mutation, không payment event date, CSV formula injection và search email gốc trước mask cần review backend riêng. Không thay backend hay tuyên bố fix các giới hạn này.

## Bằng chứng kiểm tra thực hiện trong workspace

| Kiểm tra | Kết quả |
|---|---|
| `node --experimental-strip-types scripts/test-contacts.mjs` | PASS query/date/option/sort/paging/CSV parity, q isolation, exact drilldown, fixture paid/free, null/zero, breakpoints |
| `node --experimental-strip-types scripts/test-overview.mjs` | PASS logic, theme chart, responsive helper |
| `node scripts/test-api-service.mjs` | PASS API and binary/session handling |
| `node scripts/test-theme.mjs` | PASS theme logic |
| Global TypeScript compiler `--noEmit --strict` model.ts/query.ts | PASS (pure modules only) |
| Global TypeScript transpileModule + local import check | PASS 83 source modules; not full semantic TS check |
| Chromium static fixture + actual contacts.css | PASS 44 cases: 320,360,390,430,600,680,768,1024,1280,1440,1920 px x light/dark x records/analysis; 22 dialog footer checks. Long text, no whole-page horizontal overflow. Fixture uses representative tokens and approximate primitive markup; no React, Base UI or ECharts runtime. Not live screenshots. |
| `npm ci --offline` | BLOCKED: ENOTCACHED zrender-6.1.0.tgz. Online retry timed out. |
| `npm run build` | BLOCKED: missing node/vite/client types (dependencies absent); full build not verified. |
| FastAPI/MongoDB runtime, scope race, keyboard/focus, 5 themes, touch, CSV content | NOT RUN; require actual app. |

## Nghiệm thu trên máy dự án

```bash
cd frontend-redesign
node --experimental-strip-types scripts/test-contacts.mjs
npm run test:local
npm run build
npm run dev
```

Không cần dependency mới; chỉ npm ci nếu node_modules chưa đồng bộ. Mở `/crm` với backend thật, dùng `docs/contacts/contacts-review.md` (F01–F20, S01–S09, R01–R14). Kiểm tra admin toàn hệ thống và partner có/không PII; đặc biệt đổi scope nhanh, URL filters invalid, q pending CSV, mobile 320/390, sidebar mở/đóng, theme switch chart, scroll/focus dialog và zoom 200%. Không seed/ghi đè DB để test. Bản patch này là implementation candidate V19, chưa đạt cổng nghiệm thu runtime; không gọi là ready to merge trước khi build và kiểm thử thật thành công.
