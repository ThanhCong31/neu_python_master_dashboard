# NEU Admissions BI — Design system audit (V25)

Ngày review: 24/11/2026. Phạm vi: frontend-redesign trong snapshot V25 đã giao (workspace `v25-work.Qm6Gsv`, V24 + delta V25). Đây là audit source, chưa phải visual/accessibility audit của React đang chạy trên máy người dùng. Không sửa source trong vòng này. Marketing, Sponsorship và Exams là placeholder trong snapshot này; không kết luận về code riêng đồng đội có thể đã phát triển.

## 1. Kết luận và nguồn chuẩn

Expressive của Grenish Rai là registry/CLI copy source React + Tailwind, lấy cảm hứng từ Material 3 Expressive (không phải Google official). `expressive.json` chọn Vite, CSS motion, expressive shape/scheme, Inter Variable; `package-lock.json` khóa `@grenishrai/expressive` 0.0.1. Runtime sử dụng source local, Base UI, token và CSS; không coi devDependency là bằng chứng mọi UI đang dùng component registry. Tài liệu public hiện hành cung cấp nhiều component hơn snapshot local; chưa xác nhận toàn bộ source hiện hành tương thích với CLI 0.0.1 và Base UI đang khóa. Không tự động cập nhật CLI/lockfile hay overwrite component.

**Nguyên tắc:** registry-first, app adaptation khi có lý do, giữ nghiệp vụ ở feature. Không đồng nhất tất cả mọi component bằng một hình dạng, không viết lại UI tốt chỉ để tăng tỉ lệ component registry.

Mức ưu tiên: P1 = trước Exams; P2 = sau foundation, nếu regression gate đạt; P3 = giữ/hoãn. “Có” dưới đây chỉ nói về file/usage đã kiểm tra trong snapshot, không khẳng định giống upstream từng byte.

## 2. Inventory 12 file TSX hiện có trong components/expressive

| File | Usage / provenance | Đánh giá | Quyết định |
|---|---|---|---|
| button.tsx | Button, ToggleButton; BaseButton/BaseToggle, CVA, Ripple, useFluidPress; login, account, mọi feature | Nền tảng tốt; size sm=40px, md=56px, nhiều feature thêm min-height riêng | Giữ; thống nhất policy density, dùng motion standard cho thao tác thường xuyên, không ép tất cả nút thành 48px bằng selector rộng |
| icon-button.tsx | Shell, ThemeStudio, PageActions | Đúng ngữ nghĩa cho icon-only; nhiều nơi khác vẫn dùng Button icon-only | Giữ; chuyển các nút đóng, xem chi tiết, phân trang icon-only có accessible label |
| button-group.tsx | Wrapper `ex-connected-actions` cho action, không phải toggle registry; rg không thấy usage ngoài định nghĩa trong V25 | Tên dễ nhầm với ButtonGroup upstream | P1: nhập ConnectedButtonGroup/ConnectedButton có chọn lọc; bỏ wrapper cũ nếu xác nhận không có consumer mới |
| view-switch.tsx | V25 adaptation ToggleGroup + ToggleButton + CSS; Contacts/Leads | Hình dạng và selected state đã cải thiện, vẫn là adaptation; Overview còn control khác | P1: facade dùng connected registry; giữ check slot, chiều rộng ổn định, 48px, wrap, one selection |
| menu.tsx | ScopeSelect, Profile, Overview ExportActions | Registry-style Base UI, item/radio group/portal | Giữ; test menu hẹp, scroll, selected state, focus, tránh thay bằng select khi là action |
| select.tsx | SystemSelect adapter ở Admin/Quality | Có filled/outlined, labelPlacement above/floating, BaseSelect | P1: dùng cho sort/page size/group selector với density phù hợp; sửa accessibility label ở wrapper nếu cần sau test |
| text-field.tsx | Login, Account, Audit, tìm kiếm Contacts/Leads | Đã dùng nhiều, labelPlacement above/floating | Giữ; đồng bộ search field, hỗ trợ lỗi; không dùng placeholder thay label |
| sidebar.tsx | Shell, Navigation, Profile | Đã thích ứng rail/mobile, custom route tree và permissions | Giữ, không đổi sang navigation-drawer/rail chỉ vì registry có; test focus/inert, group Tuyển sinh, mobile |
| top-app-bar.tsx | Shell V20 | Page title duy nhất và page action slot | Giữ; test title dài + scope + refresh ở 320px/zoom; không thêm heading trùng |
| avatar.tsx | Profile | Fallback initials, Material shape | Giữ; không cần avatar trong mọi row hồ sơ |
| tooltip.tsx | PageActions, sidebar/primitive | Base UI portal | Giữ; dùng cho icon-only nhưng label không phụ thuộc tooltip; không giấu thông tin nghiệp vụ trong hover |
| ripple.tsx | Button/toggle và các primitive | Imperative animation, reduced motion | Giữ; test pointer cancel, unmount khi đổi view, không thêm ripple chồng lên ripple |

`view-switch.css` là file đi kèm, không tính vào 12 TSX. `styles/expressive.css` ánh xạ token vào utility; `styles/globals.css` chứa theme/motion alias và một số CSS action riêng. `lib/expressive/` là foundation, không phải feature.

## 3. Các UI family tự viết / chưa dùng registry

| Family | Bằng chứng source V25 | Registry đối chiếu | Quyết định |
|---|---|---|---|
| Connected selection | `overview/components/Analysis.tsx`: hai ToggleButton riêng trong `ov-chart-controls`; Contacts/Leads dùng ViewSwitch | button-group (ConnectedButtonGroup/ConnectedButton) | P1: một primitive connected, hai context density; không group motion làm nút rộng ra; không outer track thừa |
| Tabs điều hướng panel | `system/components/Elements.tsx::Tabs` tự xử lý role/tabindex/arrow/Home/End; Admin, Quality | tabs | P1: Base UI Tabs adapter; panel association, preserve unsaved-change guard Admin; activation không tự commit thay đổi |
| Filter đã áp dụng | `contacts/components/Filters.tsx` nút `ct-chip`; Leads `ld-chip` cùng logic remove | chip / InputChip, AssistChip, FilterChip | P1: InputChip cho điều kiện có X để xóa; FilterChip chỉ binary toggle; nút Bộ lọc giữ Button hoặc AssistChip nếu cùng semantics |
| Checkbox | Native checkbox ở hai Filters/Records (cột); System Elements/Partners | checkbox | P1: chung labeled Checkbox, giữ controlled checked, disabled, group legend; không dùng Switch cho draft |
| Radio / lựa chọn độc quyền | Scope, Profile dùng MenuRadioGroup đúng; ThemeStudio dùng button + aria-pressed | radio-group, menu | Giữ menu; ThemeStudio preview là custom card choice, xem xét radio semantics, không biến thành menu text |
| Select | Native select trong Records (sort/page-size), Analytics (dimension); SystemSelect đã có | select | P1: dùng Select local hoặc adapter compact; kiểm tra popup width, static label, focus; không import SystemSelect ngược từ feature hệ thống |
| Khoảng ngày | Hai native input type=date trong Contacts/Leads | date-picker, calendar | P2: thử picker theo YYYY-MM-DD, locale vi, range, keyboard; giữ native nếu tốt hơn mobile. Không tự đoán min/max; không timezone shift |
| Dialog | `contacts/components/Dialog.tsx`, `leads/components/Dialog.tsx` gần như giống nhau (showModal, focus restore); System Elements và ThemeStudio có biến thể native | dialog, alert-dialog, side-sheet | P1: shared responsive dialog facade; thử registry DialogContent. Bảo toàn busy/dismissible của Admin và focus. Confirmation ngắn có thể dùng AlertDialog; detail/filter dài cần layout body scroll, footer, full screen mobile. Native dialog là phương án hợp lệ nếu không đạt gate |
| Table | `Records.tsx` mỗi feature có table riêng; System DataTable; Overview/Analytics table số liệu riêng | table | P1: shared table primitives/chrome, không generic data engine; library Table chỉ trình bày, không phân trang/sort dữ liệu. Giữ semantics và logic API tại feature |
| Mobile list | Contacts/Leads responsive list trong Records | list | P1/P2: shared record-list row layout; thử ListItem render action, không thay cả hàng bằng nested buttons. Giữ chi tiết riêng, không bắt scroll ngang |
| Pagination | Contacts/Leads prev-next + size; System Pager số trang, prev-next | pagination | P1: shared pager adapter 1-based, compact prev/next; kiểm tra registry controlled API, page clamp và total=0; không tải thêm request |
| Status label | Payment, Result và system Chip (span) | badge | P1: StatusLabel noninteractive. Không dùng filter chip/button cho payment/result; badge registry chỉ nếu phù hợp hiển thị text status (không ép count badge) |
| Card/surface | `.ov-panel`, `.ct-panel`, `.ld-panel`, `.sys-section`, login panel | card | P2: dùng Card/panel token chung cho surface thường; giữ bento và KPI layout đặc thù. Không bọc mỗi số thành card |
| Divider | CSS border / SidebarSeparator | divider | P3: chuẩn hóa outline-variant ở section/table, giữ border khi là đường cấu trúc |
| State/alert | `State`, `Notice` system; `.ov-error`, `.ct-error`, `.ld-error` và state riêng | alert, loading, progress, snackbar/toast | P1/P2: shared ResourceState + inline Alert. Loading initial skeleton; refresh giữ data + busy indicator; error không tự biến mất. Không toast lỗi quan trọng, không thêm toast provider nếu không cần |
| Progress | Overview funnel, analytics bars, system bars là số liệu nghiệp vụ | progress / loading | Giữ custom chart/bars có số và đơn vị; Progress chỉ task completion/loading hoặc chỉ số thực sự là tỷ lệ hoàn thành. Không gán role progressbar cho mọi thống kê |
| Toolbar | Feature toolbars Flex CSS; V20 PageRefresh | toolbar | P2: shared responsive TableToolbar/layout slots; không floating toolbar cho BI. Nút xuất ở toolbar của dataset |
| Export | Overview ExportActions menu đúng; Contacts/Leads ExportCsv gần giống nhau | button/menu (không có CSV business component) | P2: share download lifecycle/hook nếu kiểm thử abort, MIME, permission; giữ tên file, scope, filter, quyền từng feature |
| Account/forms | Login/Account TextField, Button; account notice role status chung cho lỗi và thành công; Admin custom file upload | text-field, alert, checkbox | P2: phân biệt error/success, giữ native file input và form submit/password autocomplete |
| Theme chooser | ThemeStudio native dialog + preview tự vẽ | dialog / radio-group | P2: shared dialog; giữ preview vì nghiệp vụ riêng. Năm palette, system/light/dark |
| Data charts | `shared/charts/Chart.tsx`, theme.ts, responsive.ts | Không thay thế bằng primitive registry | Giữ ECharts V16, palette theo theme, compact ticks, accessible table, reduced motion. Legend là series toggle đa chọn, không phải view switch |

## 4. Vấn đề xuyên suốt và bằng chứng

- Các selector `.ct-page button,.ct-dialog button` và `.ld-page button,.ld-dialog button` áp min-height 44px lên cả primitive, cộng với `view-switch.css` 48px. Đây là nguy cơ style cascade khi thêm registry chip/pagination; không phải bằng chứng mọi nút đang lỗi. Thay bằng size prop/token hoặc selector đúng slot.
- CSS `sys-tabs` có outer track + selected pill, Overview timeline là hai nút rời, ViewSwitch V25 connected. Ba kiểu điều khiển cần phân loại theo nhiệm vụ: connected mode, tabs panel, multi-select legend. Không dùng ViewSwitch thay toàn bộ Tabs.
- `ct-dialog`/`ld-dialog` có cùng width 640px, max-height 86dvh/800px, fullscreen <=680px; System Dialog có width và dismissible khác. Hợp nhất behavior trước, layout variant sau. Kiểm tra viewport/keyboard/safe area ở browser thật, không chỉ HTML fixture.
- `buttonVariants` có spring spatial và pressed shape; ViewSwitch thêm transition 140/120ms riêng. `motion="standard"` đã là lựa chọn ở V25, nhưng CSS transition custom là lớp override; mục tiêu tiếp theo là một policy có token và computed style kiểm tra được, không thêm override nối tiếp.
- `button-group.tsx` tên trùng registry, nhưng export/API khác. Import registry mới bằng staging branch, diff source, xác định dependencies; không chạy CLI ghi đè trực tiếp ở main workspace.
- Shape scale local: 4/8/12/16/20/28/32/48/full. Các CSS cục bộ dùng cả số trực tiếp; chuyển surface/chip/dialog theo token, không sửa bán kính chart geometry nếu có lý do.
- Design system test thiếu: các test hiện có kiểm tra model/theme/API, không chứng minh browser focus trap, key navigation, runtime motion, computed selected colors hay React render.
- `test:local` chưa bao gồm `test-contacts.mjs` và `test-leads.mjs` trong package.json V25; kế hoạch bổ sung entry test chính thức, không bỏ qua kiểm thử hiện tại.

## 5. Không cần đưa vào dự án ngay

FAB, FAB menu, carousel, navigation bar, breadcrumb, slider, shape decoration, split button không có tác vụ nghiệp vụ cần thiết trong phạm vi hiện tại. Không import toàn bộ registry. Bottom sheet/side sheet chỉ cân nhắc khi detail/filter thật sự hưởng lợi; không bắt buộc. Không thay sidebar V20 hoặc chart foundation vì mục tiêu tăng số lượng component thư viện.

## 6. Nguồn tham chiếu public đã kiểm tra

- [Introduction](https://expressive.grenishrai.pro/docs), [Why Expressive](https://expressive.grenishrai.pro/docs/why), [Installation](https://expressive.grenishrai.pro/docs/installation)
- [Button group](https://expressive.grenishrai.pro/docs/components/button-group), [Button](https://expressive.grenishrai.pro/docs/components/button), [Tabs](https://expressive.grenishrai.pro/docs/components/tabs), [Chip](https://expressive.grenishrai.pro/docs/components/chip)
- [Checkbox](https://expressive.grenishrai.pro/docs/components/checkbox), [Select](https://expressive.grenishrai.pro/docs/components/select), [Date picker](https://expressive.grenishrai.pro/docs/components/date-picker), [Dialog](https://expressive.grenishrai.pro/docs/components/dialog), [Alert dialog](https://expressive.grenishrai.pro/docs/components/alert-dialog)
- [Table](https://expressive.grenishrai.pro/docs/components/table), [List](https://expressive.grenishrai.pro/docs/components/list), [Pagination](https://expressive.grenishrai.pro/docs/components/pagination), [Card](https://expressive.grenishrai.pro/docs/components/card)
- [Sidebar](https://expressive.grenishrai.pro/docs/components/sidebar), [Alert](https://expressive.grenishrai.pro/docs/components/alert), [Loading](https://expressive.grenishrai.pro/docs/components/loading), [Progress](https://expressive.grenishrai.pro/docs/components/progress), [Motion](https://expressive.grenishrai.pro/docs/motion), [Accessibility](https://expressive.grenishrai.pro/docs/accessibility)

## 7. Baseline kiểm thử đã chạy trong workspace V25

Node 22.16.0: `node --experimental-strip-types scripts/test-contacts.mjs`, `test-leads.mjs`, `test-overview.mjs`; `node scripts/test-theme.mjs`, `test-api-service.mjs` đều exit 0. Chỉ xác nhận các test hiện có, không xác nhận full build hay browser. `git diff --check` không báo lỗi trên delta V25. Không sửa app hoặc backend trong audit.
