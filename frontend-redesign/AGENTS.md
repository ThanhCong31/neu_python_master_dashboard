# Hướng dẫn cộng tác dành cho lập trình viên và AI coding agent

> **Phạm vi:** dự án **NEU Admissions BI — frontend redesign**, thư mục `frontend-redesign/` trong repository `chiinthedesert/neu_python_master_dashboard`.
>
> **Ngôn ngữ:** giải thích, nội dung UI, nhãn, thông báo lỗi và mô tả Pull Request bằng **tiếng Việt**; tên biến/hàm/type theo quy ước tiếng Anh của mã nguồn.
>
> **Đọc trước khi làm:** `AGENTS.md` (tệp này) → `docs/CONTRIBUTING.md` → `docs/tasks/<tính-năng>.md` → **mã nguồn thực tế**.

## 1. Mục tiêu sản phẩm và nguyên tắc bất biến

NEU Admissions BI là workspace phân tích dữ liệu tuyển sinh Python Master. Ứng dụng phục vụ quản trị viên và các tài khoản đối tác với quyền xem module và phạm vi dữ liệu khác nhau. Chúng ta đang **thiết kế lại frontend**, không sao chép giao diện cũ; có thể tra cứu frontend cũ để hiểu nghiệp vụ, nhưng không xem cấu trúc/giao diện cũ là chuẩn phải giữ.

**Quy tắc cứng:**

- **Không sửa backend**, MongoDB, ETL, dữ liệu seed, phân quyền phía server hay endpoint hiện hữu.
- **Không tạo dữ liệu giả** để làm cho màn hình nhìn có vẻ hoàn thiện. Chỉ dùng response của API thật; mock chỉ dùng trong test có đánh dấu.
- Không làm thay đổi luồng đăng nhập, scope, điều hướng, theme, hoặc các màn hình của người khác chỉ để hoàn thành tính năng mình.
- Không tự ý cài thư viện, thay package manager, đổi `package.json`, `package-lock.json`, `tsconfig.json` hoặc Vite config.
- Không làm nút không có tác dụng. Không thêm filter, xuất báo cáo, sửa bản ghi, làm mới hoặc biểu đồ mà API không hỗ trợ hoặc chưa có hành vi rõ ràng.
- Không nhập dữ liệu cá nhân của người dùng vào fixture, log, ảnh PR hay báo cáo lỗi. Tôn trọng phân quyền PII do API áp dụng.

## 2. Nguồn chân lý và lưu ý quan trọng về phiên bản

- Repository đích: **`https://github.com/chiinthedesert/neu_python_master_dashboard`** — đây là **fork của người quản lý**.
- Nhánh làm việc/nhận PR: **`frontend-redesign`** trong fork trên. **Không PR vào `main`**, cũng không PR nhầm vào repository gốc mà fork này xuất phát từ.
- Ứng dụng redesign nằm trong `frontend-redesign/`; backend và frontend cũ nằm ở các thư mục khác của cùng repository.
- **Lưu ý ngày 23/11/2026:** mã trên nhánh GitHub `frontend-redesign` khi được kiểm tra vẫn là bộ khung **cũ**, chưa có `src/features/communications/`. Cấu trúc trong tài liệu này được xác minh trên gói **V9 selection-cleanup** mới hơn. **Người quản lý phải đồng bộ V9 lên nhánh GitHub đích trước khi đồng đội bắt đầu.** Không tự làm việc trên bản cũ rồi tự thiết kế lại kiến trúc.
- Tài liệu có thể lỗi thời. Trước khi sửa code, hãy kiểm tra `git branch --show-current`, `git status`, `package.json`, cây thư mục và các file thật. Nếu khác bản mô tả, báo chênh lệch trong kế hoạch; **không tự viết lại cấu trúc để khớp tài liệu**.

### Các lệnh kiểm tra nhanh (ở gốc repository)

```bash
git remote -v
git branch --show-current
git status --short
test -f frontend-redesign/src/app/App.tsx && echo 'Đã có cấu trúc V9'
test -f frontend-redesign/src/features/communications/Marketing.tsx && echo 'Đã có module communications'
```

**Nếu thiếu các file trên, dừng việc triển khai tính năng** và đề nghị người quản lý cập nhật nhánh nền.

## 3. Công nghệ và cấu trúc đã kiểm tra trên V9

- React 19, TypeScript 7 (strict), Vite 8, React Router 7, Tailwind CSS v4.
- M3 Expressive qua các **component wrapper hiện hữu** `src/components/expressive/`, sử dụng `@base-ui/react`, `lucide-react`, token local. Có dependency `@grenishrai/expressive`, **không có nghĩa được tự ý dùng API của thư viện mà chưa kiểm tra cách project đang dùng**.
- Font `Inter Variable` được import trong `src/main.tsx`; theme M3 được khởi tạo bằng `initializeTheme()`.
- Dữ liệu qua FastAPI, phiên đăng nhập duy trì bằng cookie HttpOnly; frontend gọi `fetch` với `credentials: "same-origin"`.

```text
neu_python_master_dashboard/
├── backend/                       # FastAPI — không sửa
├── frontend/                      # frontend cũ — chỉ tham khảo nghiệp vụ
└── frontend-redesign/
    ├── AGENTS.md                   # quy tắc chung
    ├── docs/
    │   ├── CONTRIBUTING.md        # quy trình branch/PR
    │   └── tasks/                 # đặc tả từng tính năng
    ├── src/
    │   ├── app/                   # App, route registry, User, WorkspaceContext
    │   ├── shell/                 # sidebar, header, scope, profile, theme
    │   ├── components/expressive/ # component UI tái sử dụng
    │   ├── services/              # api.ts, useResource.ts
    │   ├── shared/                # icon, screen error boundary
    │   ├── features/
    │   │   ├── overview/
    │   │   ├── admissions/
    │   │   ├── communications/    # nhiệm vụ Truyền thông + Nhà tài trợ
    │   │   ├── results/
    │   │   ├── system/
    │   │   └── account/
    │   ├── styles/                # token và CSS dùng toàn ứng dụng
    │   └── main.tsx
    ├── scripts/                   # kiểm tra local (xem mục 9)
    ├── package.json
    └── vite.config.ts
```

### Module và tuyến đường liên quan

`src/features/communications/routes.ts` đã định nghĩa:

- `marketing`: `/kenh-roi`, nhãn **Truyền thông**, component `Marketing`.
- `sponsorship`: `/tai-tro`, nhãn **Nhà tài trợ**, component `Sponsorship`.

`src/app/destinations.ts` hợp nhất các module và kiểm soát menu theo `user.modules`. Không thêm lại route hoặc menu khi implement hai màn hình này.

`src/shell/Shell.tsx` chịu trách nhiệm tiêu đề màn hình và phạm vi dữ liệu trên topbar. **Không vẽ thêm một header cấp ứng dụng trong màn hình feature.**

## 4. Luồng dữ liệu, API và đăng nhập

```text
Đăng nhập → App gọi GET /api/auth/me → WorkspaceContext
                                      ↓
                            Route theo user.modules
                                      ↓
                       Feature dùng useWorkspace()
                                      ↓
                      useResource<T>("/endpoint?..." )
                                      ↓
                     api<T>() → GET /api/endpoint
                                      ↓
                         FastAPI áp quyền + scope
```

### API client

`src/services/api.ts` đã thêm prefix `/api`. **Dùng** `api<SomeType>("/marketing/summary")`, **không** `api("/api/marketing/summary")`.

```ts
import { api } from "@/services/api";

const result = await api<{ ok: boolean }>("/example");
```

Đoạn trên chỉ minh họa cách gọi, **`/example` không phải endpoint tồn tại**. Với màn hình đọc dữ liệu, ưu tiên `useResource` thay vì tự quản lý `fetch` + `useEffect`.

### Hook tải dữ liệu

`useResource<T>(path: string | null)` (`src/services/useResource.ts`) trả về union trạng thái:

- `state === "loading"`: đang tải lần đầu.
- `state === "error"`: `message`, `retry()`.
- `state === "ready"`: `data`, `refreshing`, `refreshError`, `retry()`.

Khi `path` thay đổi (chẳng hạn admin đổi partner), hook **không dùng lại dữ liệu của scope trước**. Khi làm mới cùng đường dẫn mà request lỗi, hook có thể giữ dữ liệu cũ và trả `refreshError`; UI phải nói rõ dữ liệu đó chưa được cập nhật. Không gọi `retry()` lặp vô hạn.

Ví dụ cấu trúc xử lý:

```tsx
const resource = useResource<MyResponse>(path);
if (resource.state === "loading") return <p role="status">Đang tải dữ liệu…</p>;
if (resource.state === "error") return (
  <section role="alert">
    <p>{resource.message}</p>
    <button type="button" onClick={resource.retry}>Thử lại</button>
  </section>
);
// Tại đây TypeScript biết resource.state === "ready".
const { data, refreshing, refreshError } = resource;
```

Đây là ví dụ về **điều khiển trạng thái**; khi triển khai thực tế hãy dùng `Button` Expressive và giao diện đồng nhất với dự án.

### Phạm vi dữ liệu

`const { user, partner } = useWorkspace()`.

- `user.role === "admin"`: `partner === null` nghĩa là **toàn hệ thống**; chuỗi mã đối tác nghĩa là admin đang xem scope đã chọn.
- `user.role === "partner"`: `partner` trong workspace là `null`, **không có nghĩa được xem toàn hệ thống**. FastAPI xác định scope dựa vào tài khoản đăng nhập.
- Khi API hỗ trợ query `partner`, admin gửi mã đang chọn; với `null`, bỏ tham số này.
- Không cho người dùng tự nhập mã đối tác, tự diễn giải `user.modules` thành quyền ghi, hoặc tạo cơ chế giả lập đăng nhập đối tác.
- Kiểm soát cuối cùng ở backend (`require_module`, `scope_match`). Menu ẩn không phải lớp bảo mật.

Ví dụ tạo query an toàn:

```ts
const { partner } = useWorkspace();
const params = new URLSearchParams();
if (partner) params.set("partner", partner);
const query = params.toString();
const path = `/sponsorship/summary${query ? `?${query}` : ""}`;
const resource = useResource<SponsorshipSummary>(path);
```

Không copy ví dụ nguyên xi nếu TypeScript type hoặc React lifecycle của feature đã thay đổi; luôn kiểm tra file nguồn.

## 5. Quy tắc UI/UX: M3 Expressive nhưng tối giản

1. **Dùng lại** `Button`, `TextField`, `Select`, `Menu`, `IconButton`, `Tooltip` từ `src/components/expressive/` khi phù hợp. Kiểm tra props thật trước khi dùng.
2. Dùng token semantic (`bg-surface`, `bg-surface-container-*`, `text-on-surface`, `text-primary`, `border-outline-variant`…) thay vì mã hex tự đặt. Inter Variable là font chuẩn.
3. Biểu đồ phải có nhãn, đơn vị, trạng thái dữ liệu trống và phương án đọc số liệu không phụ thuộc màu; responsive ở màn hình hẹp. **V9 không có thư viện chart chuyên biệt trong dependencies**; ưu tiên so sánh bằng CSS/HTML phù hợp trước khi đề xuất thêm thư viện.
4. Nút chỉ xuất hiện khi có giá trị thực: **không thêm nút Làm mới hàng loạt**, export giả, modal vô nghĩa, floating-label thiếu khoảng trống hay hiệu ứng đổi hình dạng quá mức khi hover.
5. Khác biệt thống kê phải thể hiện rõ: **`null` ≠ `0`**; dữ liệu giả định/ước tính phải được gắn nhãn; không tính lại KPI nếu API đã cung cấp số chính thức.
6. M3 Expressive không đồng nghĩa mọi nút đều cần animation phức tạp. Chuyển động phải phục vụ thay đổi trạng thái, hỗ trợ `prefers-reduced-motion` và không gây rung/nhảy bố cục.
7. Tối thiểu kiểm tra light/dark theme, bàn phím, focus, 375px/768px/desktop, loading, lỗi HTTP và response rỗng.
8. **Nội dung UI hoàn toàn bằng tiếng Việt**; thuật ngữ ROI, CPA có thể giữ nhưng cần chú giải ngắn.

### Bố cục một trang phân tích

Nên có: giới thiệu ngắn có ích → KPI chính (không tràn lan) → 1–2 biểu đồ so sánh có nghĩa → chi tiết hoặc danh sách. Không biến mỗi trường API thành một card riêng. Cân nhắc hiển thị dữ liệu chưa có bằng `—` và giải thích thay vì bỏ trống im lặng.

## 6. Quy tắc lập trình và chia nhỏ component

- Giữ TypeScript strict, định nghĩa type phản ánh JSON response thực; field có thể null phải được khai báo `number | null`, không `as number` để ép qua lỗi.
- Tách component khi có hành vi có thể tái sử dụng hoặc khi JSX vượt quá khả năng đọc; tránh trừu tượng hóa chỉ dùng một lần.
- Có thể thêm `communications/components/` hoặc `communications/communications.css` nếu thật sự cần. Ưu tiên CSS local trong module, tránh global selector gây ảnh hưởng Hệ thống.
- Giảm tạo `new URLSearchParams()` hoặc object khác trong dependency mảng effect làm request lặp; `path` nên là string ổn định theo scope/filter.
- Các hook phải được gọi ở top level, không gọi trong điều kiện; dữ liệu chưa sẵn sàng xử lý bằng nhánh render sau hook.
- Hiển thị số và tỷ lệ bằng `Intl.NumberFormat('vi-VN')` hoặc helper local có giải thích. API trả tỷ lệ thập phân (`0.2` = `20%`). Không hiển thị `NaN`, `Infinity`, hoặc `0` thay cho thiếu dữ liệu.
- Không đưa thông tin PII vào frontend chỉ để làm biểu đồ. Tôn trọng kết quả API đã scope và mask.
- Lỗi hiển thị rõ ràng, thao tác retry đúng API, không làm crash toàn màn hình. App có `ScreenErrorBoundary` nhưng đây là lớp phòng hộ cuối cùng, không thay thế xử lý lỗi ở feature.

## 7. Ranh giới chỉnh sửa của người nhận hai nhiệm vụ

**Cho phép:**

- `src/features/communications/Marketing.tsx`
- `src/features/communications/Sponsorship.tsx`
- Component/type/CSS mới **bên trong** `src/features/communications/`
- Tệp kiểm thử mới liên quan trực tiếp tính năng, nếu không phải thay shared config

**Không tự sửa:**

- `backend/`, `frontend/` cũ, dữ liệu MongoDB/ETL
- `src/app/`, `src/shell/`, `src/services/`, `src/styles/`, `src/components/expressive/`
- `src/features/system/`, `src/features/admissions/`, `src/features/results/`, `src/features/overview/`
- `src/features/communications/routes.ts`, trừ khi người quản lý duyệt đề xuất
- `package.json`, lockfile, test scripts, Vite/TS config

Nếu bị chặn vì API thiếu dữ liệu, chưa có component chung, hoặc dependency cần bổ sung: **ghi rõ vấn đề và đề xuất** trong PR; không tự ý đổi phạm vi công việc.

## 8. Cách cộng tác với LLM

Khi bắt đầu một nhiệm vụ, LLM phải:

1. Đọc tài liệu này, `docs/CONTRIBUTING.md`, brief nhiệm vụ, cùng file source thực tế.
2. Xác nhận branch đang checkout đúng base V9; kiểm tra endpoint trong backend để biết dữ liệu/kiểu/null.
3. Tóm tắt **điểm sẽ hiển thị, luồng dữ liệu, component dự kiến, rủi ro nghiệp vụ**, rồi mới sửa code.
4. Chỉ sửa file nằm trong phạm vi; chạy `npm run build`; nêu rõ test nào đã chạy và test nào chưa thể chạy.
5. Báo lại danh sách file thay đổi, ảnh chụp UI (không lộ PII), các trường hợp lỗi/empty, cách kiểm tra thủ công.
6. Chuẩn bị Pull Request **vào `chiinthedesert/neu_python_master_dashboard:frontend-redesign`** theo `docs/CONTRIBUTING.md`. Không tự merge.

**Prompt ngắn để giao cho LLM:**

> Hãy đọc `frontend-redesign/AGENTS.md`, `frontend-redesign/docs/CONTRIBUTING.md` và tệp brief tính năng được giao. Kiểm tra source/branch hiện tại trước. Trình bày kế hoạch triển khai ngắn, sau đó code đúng phạm vi, sử dụng API thật, build và báo cáo kiểm thử. Không đụng backend, shell hoặc package dependencies. Viết UI và PR bằng tiếng Việt.

## 9. Chạy và kiểm chứng

Từ thư mục `frontend-redesign/`:

```bash
npm ci
npm run build
npm run dev
```

Vite development mặc định `http://localhost:5174`; proxy `/api` → `http://127.0.0.1:8000` (xem `vite.config.ts`). Cần FastAPI/MongoDB và tài khoản phù hợp để kiểm tra dữ liệu thật; không cần DB chỉ để TypeScript build.

**Tình trạng công cụ V9 đã biết:** trên Node.js **v26.13.1**, `npm run test:source` và `npm run build` đã được người quản lý chạy thành công; `npm run test:local` **chưa chạy hết** vì `scripts/test-loader.mjs` dùng `stripTypeScriptTypes(..., {mode: 'transform'})` mà Node chỉ hỗ trợ `strip` trên bản máy được báo cáo. **Không ghi PR là toàn bộ test đã pass** và không tự sửa scripts ngoài phạm vi tính năng. Có thể chạy riêng `npm run test:source` và `npm run build`; nêu rõ hạn chế trong PR.

Kiểm thử chức năng phải có dữ liệu từ API, vì `npm run build` chỉ chứng minh build được; **không chứng minh số liệu đúng hay UI dùng được**.

## 10. Tiêu chí hoàn thành tối thiểu

- [ ] Nhánh feature xuất phát từ **fork đích** `frontend-redesign` đã được cập nhật V9.
- [ ] Không sửa backend, shell, route chung, dependencies ngoài phạm vi.
- [ ] Dùng response thật, đúng quyền module và scope của admin/đối tác.
- [ ] Đúng ý nghĩa KPI, `null`, giá trị ước tính và đơn vị.
- [ ] Có loading, empty, error, retry; không có nút giả.
- [ ] Responsive, dark/light, bàn phím, reduced-motion.
- [ ] `npm run build` thành công; ghi tình trạng kiểm thử trung thực.
- [ ] Có ảnh chụp hoặc ghi chú thử nghiệm không lộ PII.
- [ ] PR nhắm tới **`frontend-redesign`**, có mô tả thay đổi, cách test, giới hạn và rủi ro.
