# V30–V32 — Kết quả thi

Baseline: snapshot V29 từ git index `design-system-work` (V28 + V29 patch). Thiết kế theo `docs/exams/`, đặc biệt `exams-design-review.md`. Không sửa backend, Shell, Contacts, Leads, Overview, shared components hoặc dependencies. `package.json` chỉ thêm script test.

## Phạm vi
- V30: danh mục dataset theo scope (không chọn từ summary), URL validation, options theo dataset, reset khi đổi dataset/scope, debounce search, filter draft, bảng 4/5 cột, mobile list, chi tiết từ row, CSV có xác nhận cảnh báo và quyền UI.
- V31: 4 KPI, histogram VL có table alternate, xếp loại và từng phần thi theo vòng, bảng phân nhóm và drill-down exact filter. Không dùng scatter cá nhân, boxplot hoặc paid-score comparison. Không suy đoán final presence từ advanced, không tính lại hạng/chứng chỉ. Không dùng ngưỡng 600/10% cứng.
- V32: V29 search/compact select, ViewSwitch, InputChip, Checkbox, ResponsiveDialog, RecordTable/RecordList, WorkspacePagination, CsvDownload, StatusLabel, PageRefresh. CSS riêng feature; default table fixed geometry; optional columns local scroll.
- Dataset switch giữ mode, sort và page size, reset search/page/filters; scope change remount. Refresh cùng scope/queries dùng useResource; CSV bị chặn khi metadata hoặc search pending, lỗi refresh hoặc empty. Cảnh báo giả lập ở mọi trạng thái và detail/export.
- UI restricted CSV/Email guard không phải authorization. Backend vẫn cần kiểm tra quyền/PII/search/CSV injection và simulated metadata. Không claim CSV server được sửa.

## Bằng chứng kiểm thử trong workspace
| Gate | Kết quả |
|---|---|
| `npm run test:exams` | PASS — dataset resolution, scope echo validation, filter booleans/Unicode, CSV parity, sort whitelist, exact drilldown, score zero/null/fraction, histogram invalid bins/coverage, unknown grades, section ratio, breakpoints |
| `npm run test:overview`, `test:contacts`, `test:leads`, `test:theme`, `test:api` | PASS — từng script chạy độc lập |
| Strict TS check model/query/analytics với global tsc | PASS |
| TS/TSX transpile syntax + local import resolution (108 modules) | PASS — không phải full typecheck |
| Chromium HTML/CSS fixture | PASS — 14 widths (320,360,390,430,600,679,680,768,999,1000,1024,1280,1440,1920), light/dark representative, records/analysis = 56; 28 modal bounds. Kiểm tra default table không tràn và search 48px; fixture không mount React/Base UI/ECharts |
| `npm run build` | BLOCKED — TS2688 thiếu `node` và `vite/client` type definitions |
| `npm run test:local` full source gate | NOT RUN / cần dependencies; không suy từ test logic sang full build |
| Actual API, scope races, CSV download, focus/keyboard, touch, ECharts runtime, all five themes, zoom 200%, screen reader | NOT RUN — release gate còn mở |

## Nghiệm thu trên máy phát triển
Từ `frontend-redesign`: `npm run test:exams`, `npm run test:local`, `npm run build`, `npm run dev`. Không thêm dependency, lockfile không đổi. Kiểm tra Network với admin và partner có một dataset, không dataset; đổi A→B→A nhanh và đổi partner khi đang tải/CSV; kiểm tra PM119/A24/B95 nếu có theo backend thực tế, không seed lại để test. Xem bảng ở content 679/680/999/1000, mở detail cả hai vòng, lọc rồi kiểm tra rank không đổi; kiểm tra zero/null, threshold động, unknown grades, thiếu cấu trúc và empty. Thử tất cả theme/mode, zoom và keyboard theo `exams-review.md`. Không công bố kết quả thi giả lập. Không coi V32 là release đã nghiệm thu khi các runtime gate chưa chạy.
