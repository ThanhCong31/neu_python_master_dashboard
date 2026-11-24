> **V12 — Tổng quan:** xem [REDESIGN-V12.md](./REDESIGN-V12.md) cho phạm vi, hướng dẫn tích hợp và kết quả kiểm thử. Overview dùng API thực; biểu đồ ECharts 6.1.0.

> **Revision 3:** See [REDESIGN-V3.md](./REDESIGN-V3.md) for the restored favicon, simplified profile-only theme controls, saved preferences, system API review, and test commands. Frontend-only; backend untouched.

> **Revision 2:** See [REDESIGN-V2.md](./REDESIGN-V2.md) for partner permission UX fixes, verified save, M3 Expressive dropdowns, theme color picker, and QA checklist. Frontend-only; backend untouched.

# NEU Admissions BI — Expressive app shell

Khung ứng dụng React 19 + TypeScript + Vite + Tailwind CSS v4, sử dụng thư viện [Expressive của Grenish](https://expressive.grenishrai.pro/docs/installation).

Các component UI được cài bằng CLI của Expressive và nằm trực tiếp trong source. Đây là cách phân phối của thư viện. Có thể kiểm tra cấu hình ở `expressive.json`, component ở `src/components/expressive/` và token ở `src/lib/expressive/`. CLI `@grenishrai/expressive` cũng có trong devDependencies.

## Chạy

Cần Node.js >= 22.16.0 (xem `engines` trong `package.json`); sử dụng phiên bản tương thích với lockfile.

```sh
npm ci
npm run dev
```

Mở http://localhost:5174. Thử trên điện thoại cùng Wi-Fi bằng `npm run dev -- --host 0.0.0.0`, rồi mở địa chỉ Network mà Vite hiển thị.

`npm run build` kiểm tra TypeScript và tạo `dist/`. `npm run preview` mở bản build.

## Khung ứng dụng có kết nối backend

Chạy backend FastAPI hiện có trên cổng 8000 với MongoDB và tài khoản đã được tạo. Vite chuyển tiếp request `/api` tới `http://127.0.0.1:8000`. Đăng nhập bằng tài khoản hiện có, giống frontend cũ. Bản build cần được phục vụ cùng origin với API hoặc có reverse proxy cho `/api`.

- Khôi phục phiên qua `GET /api/auth/me` mỗi lần mở ứng dụng.
- Đăng nhập qua `POST /api/auth/login`, đăng xuất qua `POST /api/auth/logout`.
- Khi API trả 401, quay về đăng nhập. Khi máy chủ lỗi hoặc mất kết nối, hiện nút thử lại.
- Danh sách route và menu được lọc theo `user.modules`. Quản trị yêu cầu thêm vai trò admin.
- Admin lấy đối tác từ `GET /api/meta/options`; chọn phạm vi và giữ khi chuyển trang.
- Tài khoản có đổi mật khẩu qua `POST /api/auth/change-password`.
- Gửi cookie phiên cùng origin. Frontend không lưu mật khẩu hay token vào localStorage.
- Backend tiếp tục quyết định quyền trên từng request.

Tổng quan, Liên hệ & chuyển đổi, Lead từ biểu mẫu, Kết quả thi, Chất lượng dữ liệu, Quản trị, Đăng nhập và Tài khoản đã có implementation API. Truyền thông và Nhà tài trợ thuộc nhánh của đồng đội; chưa nằm trong nghiệm thu V37. Xem [REDESIGN-V37.md](./REDESIGN-V37.md) để biết điều kiện còn mở trước release. Điểm thi là dữ liệu giả lập, không dùng để công bố hoặc đánh giá cá nhân.

## Điều hướng

Tuyển sinh là một nút menu cha có hai mục con thụt vào, có đường nối và trạng thái được chọn riêng. Có thể mở/đóng nhóm. Trong rail thu gọn, bấm Tuyển sinh sẽ mở rộng sidebar để thấy hai mục con. Các mục độc lập tiếp tục ở cấp trên. Hệ thống có đường phân cách và nhãn riêng.

Dưới 768 px, dùng drawer của Expressive. Từ 768 px, sidebar thu gọn được. Mặc định mở từ 1200 px, có lưu lựa chọn. Dùng nút bật/tắt sidebar trên Top App Bar (phím tắt sidebar đang tắt). Avatar mở menu tài khoản, theme và đăng xuất.

## Kiểm tra đã thực hiện

```sh
npm run test:local
npm run build
```

`test:local` gồm kiểm tra TypeScript và các test logic/theme/API/charts/reliability. V37 có test độc lập chạy qua, nhưng full build và tích hợp React/FastAPI/MongoDB chưa được xác nhận trong workspace đóng gói. Không bỏ qua lỗi compiler. Kiểm tra trực tiếp browser theo `docs/final-review/release-checklist.md` trước khi merge/deploy. Xác nhận backend thực tế phục vụ `frontend-redesign/dist` hoặc dùng reverse proxy cùng origin (không giả định backend đã đổi đường dẫn phục vụ frontend cũ).

## Cấu trúc và phân công

| Đường dẫn | Trách nhiệm |
|---|---|
| `src/app/` | Router, registry route, kiểu dữ liệu, workspace context |
| `src/shell/` | Tích hợp sidebar, app bar, profile, scope và theme |
| `src/components/expressive/` | Source UI do CLI của Expressive cài |
| `src/lib/expressive/` | Source token, motion và helper của Expressive |
| `src/styles/globals.css` | Tailwind, theme được CLI sinh và CSS nền |
| `src/styles/expressive.css` | Utility của Expressive |
| `src/features/admissions/` | Liên hệ & chuyển đổi, Lead từ biểu mẫu |
| `src/features/communications/` | Truyền thông, Nhà tài trợ |
| `src/features/overview/`, `src/features/results/` | Tổng quan, Kết quả thi |
| `src/features/system/` | Chất lượng dữ liệu, Quản trị, các màn Tài khoản/Đối tác/Dữ liệu/Nhật ký và shared UI |
| `src/features/account/` | Tài khoản |
| `src/services/` | HTTP client và hook tải dữ liệu, có hủy request khi unmount |
| `src/shared/Icons.tsx` | Ánh xạ icon Lucide cho module |

Mỗi thành viên có thể nhận 2–3 màn hình. Triển khai trong file màn hình tương ứng và đặt component, CSS, hook riêng cạnh nó. Mỗi nhóm có `routes.ts` sở hữu nhãn, URL và component của nhóm đó. Shell có sẵn app bar và phạm vi dữ liệu.

Thêm màn hình bằng cách khai báo trong `routes.ts` của feature rồi đăng ký ở `src/app/destinations.ts`. Với module mới, cập nhật `ModuleId` trong `src/app/model.ts`. Menu và router lấy cùng danh sách sau khi lọc quyền.

`useWorkspace()` cung cấp người dùng, danh sách route được phép và đối tác đang xem.

## Component và theme thực sự được dùng

| Component hoặc hệ thống | Điểm tích hợp |
|---|---|
| SidebarProvider, Sidebar, SidebarInset, SidebarTrigger | `src/shell/Shell.tsx` |
| SidebarContent, SidebarGroup, SidebarMenuButton | `src/shell/Navigation.tsx` |
| TopAppBar | `src/shell/Shell.tsx` |
| Menu, MenuRadioGroup, MenuRadioItem | `src/shell/Profile.tsx` |
| Avatar, IconButton | `src/shell/Profile.tsx`, `src/shell/Shell.tsx` |
| Select | `src/shell/ScopeSelect.tsx` |
| Expressive color/motion/shape theme | `expressive.json`, `src/styles/globals.css` |
| Inter Variable, tự phục vụ cả bộ ký tự tiếng Việt | `src/main.tsx` |

Chọn seed mặc định #6750A4, color variant expressive, motion scheme expressive, motion engine CSS và shape scale expressive. Font Inter được nạp từ Fontsource. Icon ứng dụng dùng Lucide. Giấy phép MIT của thư viện nằm trong `EXPRESSIVE-LICENSE`.

Các file trong `components/expressive/` và `lib/expressive/` gồm source từ CLI và các adaptation đã được review; không ghi đè bằng registry khi chưa kiểm tra diff. `NavigationTrigger` trong shell truyền aria-expanded theo trạng thái drawer trên mobile và đóng drawer khi chuyển sang desktop.

## Thêm component và cập nhật theme

```sh
npm run ui -- add pagination
npm run ui -- diff sidebar
npm run ui -- theme --seed "#6750A4" --variant expressive
```

Hệ thống đã có bảng phân trang bằng API ở Chất lượng dữ liệu, và phân trang trên 200 bản ghi gần nhất ở Nhật ký. Pagination CLI chưa được cài (đã dùng nút Expressive tự triển khai). Khi phát triển trang, dùng component từ `@/components/expressive/` và utility token như `bg-surface`, `text-body-large`, `rounded-shape-large`, `spring-spatial-fast`. Đặt CSS tùy chỉnh sau `expressive:theme:end` để CLI có thể tái sinh theme.

Tài liệu gốc — [Installation](https://expressive.grenishrai.pro/docs/installation), [Sidebar](https://expressive.grenishrai.pro/docs/components/sidebar), [Theming](https://expressive.grenishrai.pro/docs/theming).


## Bản mở rộng: Hệ thống thực sự hoạt động

Hai màn ở `src/features/system/` dùng endpoint sẵn có của backend `main`, không dùng dữ liệu demo.

- **Chất lượng dữ liệu (`/chat-luong`)**: tổng hợp lỗi/duplicate/flag/merged_distribution; phân tích số lượng theo loại; bảng `issues` và `duplicates` lọc `source`/`issue`, phân trang phía server; trạng thái và kiểm tra của lần import gần nhất (chỉ admin). Nếu đang xem bằng tài khoản đối tác, KHÔNG hiển thị các KPI toàn hệ thống (`pipeline`, `last_import`).
- **Quản trị (`/quan-tri?tab=...`)**: bốn khu vực có deep link query `users`, `partners`, `data`, `audit`. Tài khoản có tạo, sửa họ tên, chuyển đối tác (theo quyền backend), khóa/mở khóa, đặt lại mật khẩu. Đối tác có chỉnh quyền module, PII và trạng thái. Dữ liệu có xem trạng thái, lịch sử import, nạp lại ETL, upload Excel với bước xác nhận. Nhật ký có lọc và xem JSON chi tiết.

### API sử dụng

| Tính năng | Backend API |
|---|---|
| Lỗi/nhật ký chất lượng | `GET /api/quality/summary`, `GET /api/quality/list` |
| Tài khoản | `GET/POST /api/admin/users`, `PATCH /api/admin/users/{username}`, `POST /api/admin/users/{username}/reset-password` |
| Đối tác | `GET /api/admin/partners`, `PATCH /api/admin/partners/{code}` |
| Dữ liệu | `GET /api/admin/data-status`, `GET /api/admin/imports`, `POST /api/admin/reload-data`, `POST /api/admin/upload-file?filename=...` |
| Nhật ký truy cập | `GET /api/admin/audit?limit=200` |

UI có trạng thái loading/error/empty, retry, xác nhận trước hành động nguy hiểm, thông báo thành công/lỗi. Quyền luôn được backend quyết định; frontend chỉ bổ trợ UX.

### Phạm vi của nhóm frontend và lưu ý tích hợp

**Bản này chỉ thay đổi `frontend-redesign/`; không chỉnh sửa `backend/`, ETL, database hay hợp đồng API.** Các thành phần đều gọi đúng các endpoint có sẵn trên nhánh `main`.

- **D24 — Upload:** API `/api/admin/upload-file` hiện xử lý tên tệp đích từ query. UI chỉ gửi hai tên tệp ETL cố định và yêu cầu xác nhận, **nhưng điều đó không sửa được rủi ro ở backend**. Không xem UI validation là một biện pháp bảo vệ phía server. Cần thông báo cho nhóm backend và tránh đưa upload lên môi trường công khai khi chưa được đánh giá an toàn.
- **D25 — Quality:** API `/api/quality/summary` có các trường `pipeline` và `last_import` chứa metadata toàn hệ thống. Frontend chỉ hiển thị chúng cho admin và ghi rõ phạm vi; **API gốc vẫn trả chúng theo hành vi hiện có**, nên frontend không thể đảm bảo giới hạn truy cập dữ liệu ở cấp server. Chuyển phát hiện này cho nhóm backend xử lý riêng nếu cần.
- **D23 — ETL:** `reload-data` và `upload-file` chạy thao tác ghi dữ liệu thật. UI có hộp xác nhận, không có dry-run hay rollback vì các API hiện tại không hỗ trợ. Chỉ kiểm thử trên dữ liệu thử nghiệm hoặc sau khi sao lưu.

Khi API thiếu chức năng hoặc trả dữ liệu không đúng phạm vi, ghi nhận thành vấn đề tích hợp, **không tự tạo endpoint mới, không sửa mã nguồn backend và không giả lập dữ liệu**.

### Kiểm tra thực tế cần chạy trên máy của bạn

```sh
cd frontend-redesign
npm ci
npm run build
npm run dev
```

Đồng thời chạy backend FastAPI và MongoDB từ repository hiện có. Kiểm thử với **admin**, **partner có quyền quality** và **partner không có quyền quality**:

1. Admin xem được mọi tab trong Quản trị, partner không nhìn thấy điều hướng Quản trị.
2. Tạo/sửa/khóa tài khoản, reset mật khẩu. Kiểm thử 403/401 và lỗi khi trùng username.
3. Thay quyền module/PII/active của đối tác; đăng nhập lại bằng tài khoản đối tác để kiểm tra quyền backend đã cập nhật.
4. Chuyển scope admin rồi kiểm tra chỉ số thuộc đối tác trong bảng nhật ký quality; pipeline tổng thể luôn được ghi nhãn toàn hệ thống.
5. Thử filter và phân trang của quality; tài khoản thiếu PII không nhìn thấy dữ liệu đã bị API che.
6. Kiểm thử import có xác nhận bằng dữ liệu test và **backup MongoDB**; không thử upload file không tin cậy lên backend chưa được vá.
7. Xem danh sách audit, lọc sự kiện, xem chi tiết, thử lại khi API lỗi; kiểm tra responsive và keyboard navigation.

**Mức kiểm thử khi bàn giao bản ZIP này:** đã kiểm tra cú pháp TS/TSX và đường dẫn import nội bộ. Trong môi trường tạo gói không có npm dependencies hoặc MongoDB của dự án nên **chưa chạy build đầy đủ hoặc kiểm thử E2E**. Không nên coi đây là bản đã QA production.
