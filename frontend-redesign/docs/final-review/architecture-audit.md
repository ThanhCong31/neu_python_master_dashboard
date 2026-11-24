# Architecture, Performance & Reliability

Giữ React + TS + Vite + Base UI + Expressive + ECharts; không đổi stack hoặc tạo generic framework mới.

| ID | Mức / loại | Bằng chứng source | Hướng xử lý / test |
|---|---|---|---|
| A01 | P1 C/R | App Workspace lấy sessionStorage partner trước meta; scopeStatus ready trước effect reset partner không tồn tại; Quality không gate (U03) | Xác thực scope đồng bộ trước mount/request, fail closed với code sai; test saved code bị xóa và metadata lỗi. Backend cũng phải từ chối scope trái phép. |
| A02 | P1 R | `useResource` abort trong effect cleanup, snapshot keyed theo path/attempt; no cache dedup | Test A→B→A với delayed response, retry nhanh, unmount, clearWhenDisabled; xác định stale same-path behavior. Không thay bằng query library nếu không cần. |
| A03 | P1 R | `api.ts` phát session-expired khi 401 bất kể signal abort xảy ra trong lúc đọc error payload | Test response 401 muộn từ request cũ sau đổi session; chỉ dispatch khi request còn hợp lệ. Không tự retry mutation. |
| A04 | P2 C | destinations import tất cả routes, routes import screens eager; Analytics của ba feature lazy nhưng Overview import chart | Đo production chunks trước, cân nhắc route-level lazy/Suspense; không claim giảm bundle khi chưa build. |
| A05 | P2 C/R | App admin `/meta/options` và feature options cùng endpoint nhưng payload rộng, nhiều module; Exams A24/B95 gọi discovery + options riêng | Đo Network requests, payload; cân nhắc cache theo identity/scope/dataset; giữ dataset discovery đúng scope, không reuse dữ liệu khác quyền. |
| A06 | P1 R | Chart.tsx init/resize catch setError; nếu init thất bại không có retry rõ, nếu setOption lỗi chỉ thông báo; chart host error position absolute | Test ResizeObserver, zero width, init/setOption failure, font ready, unmount, strict mode. Cần retry hoặc table fallback; không loop resize. |
| A07 | P2 C | `useChartPalette` mỗi chart một MutationObserver và neu-theme-change listener; chart.setOption notMerge mỗi thay đổi | Profile số chart, observer cleanup, resize; chỉ tối ưu khi có đo đạc. |
| A08 | P2 C | Feature CSS và shared CSS cùng tồn tại; system Components.Elements Dialog/DataTable/Pager/Tabs khác foundation | Migration có giới hạn, giữ semantic riêng của admin; bỏ wrapper/re-export chỉ khi tất cả callsite được kiểm tra. |
| A09 | P2 R | Shared RecordTable và CSS dùng cả native table + list; render nhiều optional columns | Test page size 100 với all columns, responsive, keyboard. Không virtualize nếu chưa thấy chi phí. |
| A10 | P0 C | Workspace thiếu node_modules; `test:source` yêu cầu TypeScript CLI, build thiếu type definitions | Bắt buộc `npm ci`, source gate, production build trên môi trường đủ deps, không sửa tsconfig để che lỗi. |
| A11 | P2 R | README/version docs và code nhiều vòng patch | Đối chiếu scripts, Node engine, proxy, build path, backend serving; lint dead import/CSS bằng công cụ thích hợp sau full build, không xóa theo grep đơn thuần. |
| A12 | P1 R | Admin mutation và account forms async, shared Dialog giữ dismissible | Test pending network, route leave, auth expiry, reload; tránh duplicate writes, đảm bảo response lỗi hiện đúng. |

## Baseline test thực thi
Node 22.16.0. `npm run test:theme`, `test:api`, `test:overview`, `test:contacts`, `test:leads`, `test:exams`, `test:charts`: exit 0. `npm run test:local`: exit lỗi ngay source gate thiếu compiler trong node_modules. `npm run build`: TS2688 node và vite/client. Không có production bundle để đo; không có runtime backend để xác nhận hiệu năng.

## Benchmark cần chạy
- Production build: ghi raw/gzip chunk sizes, route đầu tiên, lazy imports. Dev server không đại diện production.
- Network: login, navigation, refresh, filter batch, debounce search, scope switch; một request hợp lý cho resource active, không gọi summary khi chỉ xem records.
- Performance: browser mid-tier mobile emulation, 100 rows, 365 điểm, 5 theme; ghi long tasks, layout shift, heap sau 20 lần mount/unmount; so trước/sau trong cùng điều kiện.
- API latency: test delay 0/500/2000ms, 401/403/500, offline và retry; đo thực tế trước đặt budget.
