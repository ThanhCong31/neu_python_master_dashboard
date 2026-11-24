# V26–V28 — Design system foundation (bản triển khai có điều kiện)

Baseline: V25 (snapshot đã giao). Không thay đổi API, routes, scope, PII permission, lockfile, backend, Shell V20 hoặc Marketing/Sponsorship. Bản này không tự động cập nhật registry. Chưa nghiệm thu runtime.

## Nguồn và quyết định tích hợp

Đã đọc registry `Grenish/expressive` tại commit `eb96d3df46790079ae5bf7b22d721491260c1485`, các file `packages/registry/src/components/{button-group,chip,checkbox,dialog,table,pagination,tabs}.tsx`. Tài liệu: https://expressive.grenishrai.pro/docs/components/button-group ; https://expressive.grenishrai.pro/docs/components/chip ; https://expressive.grenishrai.pro/docs/components/checkbox ; https://expressive.grenishrai.pro/docs/components/dialog ; https://expressive.grenishrai.pro/docs/components/table ; https://expressive.grenishrai.pro/docs/components/pagination ; https://expressive.grenishrai.pro/docs/components/tabs . CLI local khóa 0.0.1; không chứng minh được tương thích toàn bộ snapshot mới (thiếu node_modules). Không ghi đè source registry cũ. Các component bổ sung là adaptation có chủ đích, không phải tuyên bố copy nguyên bản.

| Thành phần | Thực hiện / lý do |
|---|---|
| ConnectedButtonGroup / ConnectedButton | Adaptation theo registry: single selection, không deselect, 2px gap, không outer track. Dùng ToggleGroup/Base UI + ToggleButton local để bảo toàn V25; tránh width morph của action group. ViewSwitch dùng chung Overview/Contacts/Leads. |
| Checkbox | Native input có label, 20px mark trong target 40px/row 48px, theme tokens, focus-visible. Không dùng fluid pop của upstream. Contacts/Leads filters & column selection, System Checkbox. |
| InputChip | Adaptation của registry: label + trailing remove action, accessible label, Delete/Backspace. Không dùng FilterChip cho điều kiện đã áp dụng. |
| Select | Dùng Select đã có (Base UI) qua WorkspaceSelect, label above, standard motion; sort, page size, nhóm phân tích. Không dùng popup portal bên trong native dialog. |
| Dialog | Shared ResponsiveDialog native top layer; giữ focus/restore và không dismiss ngoài backdrop như V25. Full-screen compact; header/body/footer. Không migrate admin mutation hoặc ThemeStudio trước runtime gate. |
| Table/list | Shared semantic RecordTable/RecordList, feature cung cấp render/identity/sort. Sticky header, aria-sort, icon slot cố định; mobile record list. Không thêm TanStack Table. |
| Pagination | Shared compact pager, 1-based, range đúng, page size, icon-only accessible. Không thêm danh sách số trang dày trên mobile. System pager cũ giữ. |
| StatusLabel | Non-interactive span, shared shape/text, tone do nghiệp vụ quyết định. System Chip dùng facade mới. |
| CsvDownload | Shared lifecycle abort, MIME, filename, status; Leads giữ confirmation và quyền PII, Contacts giữ filename. |

## Quy chuẩn sử dụng

- `ViewSwitch` cho hai mode, `compact` cho chart toolbar; không thêm vỏ nền hoặc CSS override pressed state ở feature.
- `Checkbox` cho draft nhiều lựa chọn, `InputChip` cho filter đang áp dụng. Xóa chip phải do feature cập nhật đúng nhóm.
- `WorkspaceSelect<T>` nhận options/value/onChange. Dùng Select gốc ngoài native modal, không thay native date input bằng date picker chưa kiểm thử.
- `RecordTable<Row>` nhận columns/rows/rowKey/sort/onSort/action/label. Không quản lý query hay quyền. `RecordList` nhận rows/key/render/action. Feature chọn layout theo width thực của panel; giữ <680px compact, >=1000px expanded. Trường tùy chọn có thể cuộn ngang cục bộ.
- `WorkspacePagination` nhận page/pages/size/total/pending và callbacks; feature reset page khi đổi size.
- `ResponsiveDialog` có title/children/footer/onClose/dismissible. Native dialog không dùng backdrop-click để đóng. Admin mutation dialog cũ chưa được migrate.
- `CsvDownload` nhận path, disabled, filename và optional confirmMessage. Feature vẫn kiểm tra permission và filter parity; không dùng shared component để mở rộng quyền.
- Giữ page refresh V20, theme tokens, ECharts V16, login, route và sidebar. Standard motion áp dụng cho thao tác Contacts/Leads, không sửa theme toàn cục.

## Review thực hiện

- PASS: test Contacts, Leads, Overview, theme, API service (chạy từng script bằng Node 22.16.0).
- PASS: transpile syntax và local import resolution 101 modules (TypeScript 5.8.3 global; không phải full typecheck).
- PASS: 44 HTML/CSS fixture cases (11 viewport widths × 2 màu sáng/tối đại diện × 2 feature), không whole-page overflow hoặc table mặc định overflow trong fixture; modal bounds, checkbox native click, kích thước ViewSwitch không đổi khi đổi aria-pressed. Fixtures giả lập markup, không chạy React/Base UI/ECharts và không phải toàn bộ 5 palette.
- `npm run build` BLOCKED: TS2688 thiếu type definitions `node` và `vite/client` (node_modules chưa có). `npm run test:local` mới gọi cả test Contacts/Leads nhưng source gate cũng cần dependency thật; không tuyên bố pass full suite.
- Chưa xác nhận popup Select, focus restoration, keyboard navigation, zoom 200%, touch thật, 5 palette, screen reader, real API/CSV, mutation dialogs. Không đánh dấu V28 product gate là hoàn thành.

## Hạng mục hoãn có chủ đích

Tabs Admin/Quality (dirty guard), Admin mutation/AlertDialog, ThemeStudio, System table/pager, shared resource-state/alert và analytics tables vẫn giữ. Không thay tất cả bằng registry chưa kiểm chứng. Giữ ButtonGroup action cũ để tránh phá consumer bên đồng đội; không dùng cho exclusive switch. Kiểm tra các CSS còn dùng trong analytics trước khi xóa. Không tự sửa backend hoặc PII issues đã ghi trong Contacts/Leads docs.

## Nghiệm thu trên máy phát triển trước Exams

1. `npm run build` và `npm run test:local` từ frontend-redesign. Nếu thiếu dependencies, `npm ci` trước. Không cần đổi lockfile vì patch chỉ thêm scripts.
2. Kiểm tra Overview daily/cumulative, legend, export; Contacts/Leads switch, multi-select Apply/Cancel/Reset, remove chip, sort, dropdown keyboard, page size, CSV cùng filter, detail focus restore, scope switch; Leads PII guard vẫn giữ.
3. Viewport 320/360/390/430/600/768/1024/1280/1440/1920, sidebar expanded/rail, 5 palettes sáng/tối, system theme, zoom 200%, reduced motion, title dài và dữ liệu dài. Kiểm tra dropdown khi sát mép, dialog native khi bàn phím mở, table default không scroll ngang và optional columns scroll cục bộ.
4. Admin/Quality: checkbox permission, status labels, dirty guard, busy dismiss guard. Login và Account smoke test. Chỉ migrate Tabs/AlertDialog/ResourceState còn lại sau khi gate này pass.
