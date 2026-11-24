# Contacts — kế hoạch triển khai V17 → V19

**Chưa viết code.** Đây là kế hoạch execution sau khi người dùng duyệt IA/VD. Bắt đầu từ V16 thực tế của project; workspace V16 hiện chỉ là baseline đã kiểm tra tĩnh. Các mốc phiên bản là vòng review, không buộc tạo ba commit trên branch người dùng.

## 1. Phạm vi và nguyên tắc

- Chỉ `frontend-redesign`; Contacts `/crm` là phạm vi chính. Leads `/lead`, Marketing, Sponsorship, Exams, System, shell, auth, backend, data không sửa. Không ghi đè code teammate, không thêm dependency trước khi kiểm tra dependency hiện có.
- Tái sử dụng V16 `api`, `apiFile`, `useResource`, workspace context, shared format, chart wrapper và responsive helper; primitives Button, IconButton, TextField, Select, Menu, ButtonGroup theo API thực. Đã có ECharts 6.1.0 trong package V16; không thêm chart engine khác. V16 Chart đăng ký LineChart, BarChart và các component cần thiết; heatmap chưa đăng ký, không import vô ích.
- `src/features/system/components/Elements.tsx` có table/pager/dialog theo CSS `sys-*`; tham khảo hành vi, không import system-specific UI vào admissions để tránh coupling. Chỉ extract shared primitive nếu có trách nhiệm chung và regression tests; không rewrite System để phục vụ Contacts.
- M3 Expressive theo token V9–V16; không biến feature CSS thành global overrides. Tách business logic và presentational code vừa đủ; không generic hóa chưa có use case.
- Dùng dữ liệu server thật trong production, fixtures chỉ trong test; không tự thêm 145, 119, 66 làm fallback. Mọi API contract thay đổi phải được duyệt riêng. Không báo test pass nếu chưa chạy.

## 2. Cấu trúc source dự kiến (không phải file đã tạo)

```
frontend-redesign/
  docs/contacts/                 # bộ tài liệu này
  src/features/admissions/
    Contacts.tsx                 # entry hiện có; phối hợp scope, view, resources
    Leads.tsx                    # không sửa
    routes.ts                    # /crm đã đăng ký; không cần sửa
    contacts/
      model.ts                   # ContactRow, Options, Summary, typed validators
      query.ts                   # parse/serialize, allowlist, filter semantics, paths
      useContactsState.ts        # committed/draft, search, page/sort/view, selection
      contacts.css               # .ct-*; container query, dialog/table/list/chart styles
      components/
        Filters.tsx              # filter summary, draft form, options state
        Records.tsx              # search, count, table/mobile list, columns, pager
        ContactDetail.tsx        # read-only modal từ row
        ExportCsv.tsx            # API file, cancellation, snapshot, feedback
        Analytics.tsx            # metrics + funnel + grouping + daily chart
        ChartPanel.tsx           # chart/table toggle chỉ Contacts ban đầu
  src/shared/
    charts/                      # giữ V16; chỉ chỉnh nếu có lý do và review
    format.ts                    # reuse; thêm helper nếu thật sự dùng chung
  scripts/
    test-contacts.mjs            # pure logic fixtures / contracts
  package.json                   # thêm test:contacts vào test:local nếu duyệt
  REDESIGN-V17.md / V18.md / V19.md  # review logs khi có thay đổi thực
```

Đường dẫn lựa chọn để không đụng Leads chung folder; có thể gộp file nhỏ. Không tạo 20 component một dòng. Mỗi module có trách nhiệm và test được.

## 3. Luồng dữ liệu và state

```
Workspace scope + identity
  → scope ready? → options by scope
  → normalize structural filters (URL)
  → view=records? → listPath(filters, qApplied, page, pageSize, sort)
  → view=analysis? → summaryPath(filters)
  → useResource(path | null)
  → đúng snapshot? → render
  → CSV = list filter + qApplied + scope (không page, không sort)
```

`Contacts.tsx` là boundary. Scope key bao gồm identity và effective partner; không đọc scope từ URL. Reset state ở boundary khi đổi account/scope; không để route params của scope cũ tạo request sai. `useResource` V16 chỉ giữ dữ liệu cùng path khi refresh, abort request khác path; cần kiểm tra remount/invalid scope và key theo identity. `path=null` nghĩa disabled nhưng hook trả loading; view không dùng thì không show loading giả. `options.viewing_partner` có echo; summary/list không có. Query builder stable theo multi-value ordering, không gửi undefined/null, không tự tạo field không có trong contract.

State responsibilities: structural filters & view trong URL; applied q trong memory, draft q UI, debounce commit atomically page=1; page/pageSize/sort trong reducer hoặc một update atomic; detail row key thuộc snapshot, đóng khi path đổi; column visibility riêng UI không ảnh hưởng API. Filters draft chỉ tồn tại khi form mở. Refresh current view + options khi cần; cùng path refresh lỗi giữ data có nhãn cũ và retry, khác path loading skeleton không show data cũ. 401 do service dispatch session-expired, 403 báo không có quyền, 422/400 validation rõ. Không dùng setInterval/polling.

## 4. Các vòng triển khai và review gate

### V17 — Workbench foundation & dữ liệu thật

Mục tiêu: hoàn thành hành trình tra cứu cơ bản trên desktop **và mobile**, không chờ V19 mới responsive.

1. Xác nhận baseline, chạy test:local/build hiện có trên môi trường deps đầy đủ nếu có. Kiểm tra AGENTS/handoff và file teammate. Lưu `git diff --stat` đầu vào; tạo workspace/branch riêng hoặc bản sao, không commit/push repo user.
2. Model/types, query builders, options mapper, filter draft+URL, scope guard. Test serialize Unicode, multi, sentinel, dates, search page reset; unit test invariants, zero/null. Không thay backend.
3. Records mode: text search, 4 cột + chi tiết action, responsive list, sort, pager, empty/loading/error. Real `/contacts/list`; mode switch có thể chỉ xuất hiện khi Analytics sẵn sàng hoặc báo đang phát triển trong workspace, không ship button chết.
4. Filter form đầy đủ 10 nhóm, label ngày tiếp xúc đầu, áp dụng theo lô. Export CSV đúng scope/filter/q, abort khi path thay đổi; sử dụng V14 menu principle nhưng một định dạng thì một nút, không dropdown dư.
5. Detail read-only, close/reopen/focus, PII minimization. Kiểm tra responsive 320–1440 và keyboard ngay trong vòng.

**Gate V17:** user lookup + apply filters + page/sort + CSV + detail hoạt động; scope race không show hồ sơ cũ; không full-page horizontal overflow; P0 theo API semantics; ghi bằng chứng. Nếu chưa chạy browser/backend, chỉ gọi “implementation ready for runtime test”, không tuyên bố done.

### V18 — Analytical workspace & visual system

1. Thêm view phân tích dùng `/contacts/summary`, không ảnh hưởng list, filter giữ nguyên. Q table-only hiển thị scope rõ. Không mount chart trong mode records.
2. KPI cluster (total/web/paid/rate/revenue) và phụ (unpaid/free/flagged), không lặp toàn bộ Overview; phễu đúng mẫu số, tiền tiềm năng ghi chú. Bảng số liệu khi null/invariant lỗi. Kết quả thu được từ API, không derive từ page.
3. Daily registrations: chart ngày liên tục, phần đã đóng phí hiện tại theo ngày đăng ký; label miễn phí và undated. Chart panel grouping theo board/region/province/segment/PIC/source_combo, chỉ một chart; chọn data key rõ, full table; drilldown chỉ exact mapping.
4. Theme adapter V16 với line solid/tonal colors, chart size theo container, legend/tooltip/a11y. Dùng ECharts components đã registered, không thêm heatmap. Data table alternative available khi chart fail.
5. Review typography/containment/spacing giữa V16 Overview và Contacts; không duplicate CSS một cách không cần thiết. Kiểm tra cả 5 theme seeds đang có (xem actual theme config) x light/dark, system mode, font loading. Không đổi palette cố định.

**Gate V18:** đầy đủ tác vụ phân tích thực, sum/ratio kiểm chứng, date semantics đúng, không chart tràn hay quá dày; view chuyển không mất filter; Overview vẫn hoạt động; có screenshot desktop/mobile thật nếu chạy được.

### V19 — Product review, hardening, patch

1. Theo `contacts-review.md` chạy test full: scope rapid switch, empty options, delayed responses, 401/403/400/500, CSV race, back/forward, focus, reduced motion, viewport resize và sidebar. Kiểm tra export q và page mismatch, masked account. Không tự sửa data nguồn.
2. Review bằng 5 góc nhìn BA, UX, VD, architect, QA. Tinh chỉnh typography, row height, long text, modal, scroll, tab layout, mobile pager. Đánh giá task time/number of actions với dữ liệu thật; không coi static screenshot là runtime test.
3. Chạy typecheck/build/test:local, inspect actual network, test các fixture. Nếu không cài được dependencies, ghi log và trạng thái chưa kiểm thử; không sửa lockfile bằng suy đoán. Không gọi seed trên DB user để lấy dữ liệu thử.
4. Xuất patch từ baseline V16 đã verify (hoặc patch tăng dần nếu user đang ở V17/V18), dùng `git diff --binary --full-index` với file thêm mới đã intent-to-add trong workspace riêng. Không ZIP đè repo. Test `git apply --check` trên bản sao clean và review `git apply --stat`; không thêm node_modules, dist, screenshot, data, .env vào patch. Tạo review log thực tế: baseline, files, test command/output, blockers, screenshots nếu thật sự có, remaining risks.

**Gate V19:** tất cả acceptance bắt buộc đạt, ngoại lệ do giới hạn backend phải ghi rõ và không tạo UI misleading. Chỉ gọi “ready to merge” khi full build và runtime đã xác nhận. Người dùng sẽ review bằng Lazygit, commit riêng, push theo workflow đã thống nhất; agent không push tự động.

## 5. Cách phối hợp với teammate

Contacts sở hữu `src/features/admissions/Contacts.tsx` và `contacts/`; không động `Leads.tsx` dù cùng folder. Teammate làm communications. Shared chart/format hoặc test scripts có thể tạo conflict; trước chỉnh đọc diff remote/local, communicate API component contract, không replace toàn package. Giữ dependency ECharts hiện tại, không thêm UI library. Nếu cần primitive dùng chung (filter dialog, table pager) thì triển khai Contacts trước, sau đó xem nhu cầu thực của Leads/Exams, extract với test hồi quy ở vòng sau. Không biến `src/shared` thành kho nghiệp vụ.

## 6. Báo cáo vòng lặp (template)

Mỗi version ghi: mục tiêu → thay đổi → issue IDs giải quyết → quyết định khác spec → test thực chạy + kết quả → screenshot/runtime nếu có → vấn đề mới và phương án vòng sau. Mọi test chưa chạy ghi “NOT RUN” và lý do, không gộp kiểm thử CSS mock với React/ECharts live. Trước patch cuối, đối chiếu checklists và loại bỏ code chết. Đọc [review](contacts-review.md) trước khi bắt đầu V17 để thiết kế testable ngay từ đầu.
