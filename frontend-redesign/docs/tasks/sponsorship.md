# Đặc tả triển khai: Nhà tài trợ

> **Giao cho:** thành viên phụ trách màn hình Nhà tài trợ (nên làm tính năng này trước Truyền thông).
>
> **Đọc trước:** [`../../AGENTS.md`](../../AGENTS.md), [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
>
> **Đích PR:** `chiinthedesert/neu_python_master_dashboard`, **base `frontend-redesign`**, branch đề xuất **`feature/sponsorship`**.
>
> **Trạng thái lúc soạn:** `src/features/communications/Sponsorship.tsx` trong snapshot V9 chỉ `return null`; route `/tai-tro` đã có. Chỉ bắt đầu sau khi branch đích trên GitHub được đồng bộ V9.

## 1. Mục tiêu của màn hình

Màn hình cho phép đối tác hoặc quản trị viên theo dõi:

1. Những **quyền lợi nhà tài trợ** nào đã hoàn thành, đang thực hiện hoặc chưa thực hiện?
2. Mỗi hạng mục có **tiến độ thực tế** bao nhiêu, được triển khai ở đâu/khi nào, có ghi chú gì?
3. Những kênh truyền thông liên quan tạo ra bao nhiêu **lượt tiếp cận** và **lượt tương tác**, tỷ lệ tương tác ra sao?

Đây là **màn hình chỉ đọc**. Không thêm chức năng sửa trạng thái, duyệt cam kết, upload, xuất Word/PDF/Excel hoặc tạo báo cáo server riêng vì backend không có endpoint cho các thao tác đó.

## 2. API và cách giới hạn phạm vi dữ liệu

**`GET /api/sponsorship/summary`**

Backend nguồn: `backend/app/routers/misc.py`, hàm `sponsorship`, sử dụng `require_module("sponsorship")` và `scope_match(user, partner)`. API trả về hai mảng:

```ts
interface SponsorBenefit {
  item: string;
  status: string;
  progress: number;
  placement: string;
  schedule: string;
  note: string;
}

interface MediaReach {
  channel: string;
  reach: number;
  engagement: number;
  engagement_rate: number;
  importance: number;
}

interface SponsorshipSummary {
  benefits: SponsorBenefit[];
  reach: MediaReach[];
}
```

Các thuộc tính trên dựa vào backend và frontend cũ ở `frontend/src/pages/Sponsorship.tsx`. **Phải xác minh response thực tế:** nguồn MongoDB có thể để thiếu/null ở một vài field; khi đó type và UI phải phản ánh thực tế thay vì cưỡng ép hoặc để crash. `note`, `placement`, `schedule`, `importance` có thể cần fallback hiển thị "Chưa có thông tin".

**Chỉ có một query scope đáng dùng:** `partner` (dành cho admin). Backend **không có filter date/search/channel** cho endpoint này. Không thêm thanh filter giả.

- Admin `partner === null` → toàn hệ thống.
- Admin chọn mã đối tác → `?partner=MA_DOI_TAC` và API scope các bản ghi tương ứng.
- Tài khoản partner → không tự gửi partner khác; FastAPI dùng mã của tài khoản.
- Các collection dữ liệu là `sponsor_benefits` và `media_reach`; không chỉnh chúng trong task này.

## 3. Quy tắc nghiệp vụ cần giữ

### 3.1 Quyền lợi và tiến độ

- `progress` được frontend cũ diễn giải là số từ `0` đến `1` và hiển thị theo `%` (ví dụ `0.75` → `75%`). Kiểm tra dữ liệu thật trước khi render. Không hiển thị 75 thành 7500%.
- `status` là trường nghiệp vụ riêng do nguồn trả về; **không tự thay thế status bằng suy luận từ progress** nếu hai giá trị không khớp. Có thể dùng tiến độ để hiển thị thanh tiến độ và trạng thái gốc để hiển thị chip.
- Trạng thái phải dễ hiểu bằng chữ, không chỉ màu đỏ/xanh/vàng. Tránh sáng tạo enum status khi API trả những chuỗi khác nhau.
- Nếu chọn tổng hợp "Hạng mục hoàn thành", cần nêu rõ định nghĩa; nếu dựa trên `progress >= 1` thì nhãn phải nhất quán với cách tính, không nói đó là số hoàn thành theo field `status` nếu chưa đối chiếu.
- Tiến độ trung bình = trung bình `progress` của những hạng mục có số hợp lệ, **không tự coi hạng mục thiếu progress là 0**. Nếu không có mẫu số: `—`.

### 3.2 Reach và engagement

- `reach`: số lượt tiếp cận được nguồn cung cấp. Không tự gọi tổng của các kênh là **số người duy nhất** (một người có thể xuất hiện ở nhiều kênh).
- `engagement`: lượt tương tác, có thể nhiều lượt từ một người.
- `engagement_rate`: tỷ lệ của từng kênh, thường có dạng `0.12` → `12%`. **Không cộng các tỷ lệ kênh**; nếu muốn KPI tổng tỷ lệ, phải giải thích cách tính và kiểm tra đơn vị.
- `importance`: điểm khảo sát 1–5 trong frontend cũ, **không phải %**. Chỉ hiển thị khi giá trị và thang điểm có ý nghĩa; chú giải "Mức độ quan trọng (1–5)".
- Không gọi biểu đồ "Hiệu quả chuyển đổi" vì endpoint này **không có dữ liệu conversion**.

### 3.3 Giá trị 0 và dữ liệu thiếu

| API | Hiển thị đúng |
|---|---|
| `progress: 0` | `0%`, nếu hạng mục thực sự chưa bắt đầu |
| `progress: null`/thiếu | `—`, không mặc định `0%` |
| `benefits: []` | "Chưa có dữ liệu quyền lợi nhà tài trợ" |
| `reach: []` | "Chưa có dữ liệu truyền thông" |
| `reach: 0` | `0 lượt` |
| `engagement_rate` thiếu | `—`, không mặc định `0%` |

## 4. Thiết kế UI đề xuất

Đây là một màn hình read-only, **không cần nhiều thao tác**. Đề xuất bố cục:

**A. Khối tóm tắt (2–3 KPI)**

- **Tiến độ quyền lợi trung bình**, nếu có dữ liệu.
- **Hạng mục hoàn thành** với mẫu số rõ ràng (`X/Y hạng mục`).
- **Tổng lượt tiếp cận hoặc tương tác** theo các kênh mà API trả về. Khi cộng lượt tiếp cận, ghi rõ "Tổng lượt tiếp cận theo kênh" (không phải người duy nhất).

**B. Danh sách quyền lợi**

- Mỗi hàng/card: tên hạng mục, trạng thái, thanh tiến độ có nhãn `%`, vị trí triển khai (`placement`), kế hoạch (`schedule`), ghi chú (`note`).
- Phân cấp thị giác: tên và trạng thái quan trọng nhất; progress kế tiếp; metadata thu gọn.
- Không làm mỗi hạng mục thành một modal. Không tạo nút "Cập nhật trạng thái" giả.
- Phải đọc tốt cả khi mô tả dài hoặc danh sách nhiều hạng mục; có thể dùng card hoặc danh sách có phân cách.

**C. Kênh truyền thông**

- Một bảng ngắn hoặc các thanh so sánh theo `channel` chứa `reach`, `engagement`, `engagement_rate`, tùy chỗ có thể thêm `importance`.
- Khi biểu đồ có nhiều đơn vị khác nhau, **không dùng chung một trục không ghi chú**. Có thể tách reach và engagement thành hai phép so sánh.
- Nếu dữ liệu ít, bảng rõ ràng có thể hữu ích hơn 4 biểu đồ lặp lại cùng thông tin.

**D. Trạng thái API**

- Có loading/skeleton; khi lỗi hiển thị thông báo và nút Thử lại.
- Nếu chỉ `benefits` rỗng mà `reach` có dữ liệu, vẫn hiển thị phần truyền thông; và ngược lại.
- Không thêm nút "Làm mới" thường trực không cần thiết. `useResource()` tải khi mở trang/đổi scope; retry dùng khi lỗi.
- **Không thêm 3 nút xuất báo cáo**: Excel/Word/PDF hiện thuộc `/api/overview/export` (Tổng quan), không phải endpoint Nhà tài trợ.

### Yêu cầu phong cách

Tái sử dụng component từ `src/components/expressive/` và các token semantic M3; Inter Variable; button/hover tiết chế; không vẽ thêm sidebar/header. Không tạo gradient/trang trí che khuất ý nghĩa dữ liệu. Kiểm tra desktop, 768px, 375px; dark mode; focus, reduced-motion, nhãn hỗ trợ screen reader.

## 5. Tích hợp vào project đang có

File chính: `src/features/communications/Sponsorship.tsx`. Tạo subcomponent/type/style bên trong cùng feature khi cần.

```tsx
import { useWorkspace } from "@/app/workspace";
import { useResource } from "@/services/useResource";

export default function Sponsorship() {
  const { partner } = useWorkspace();
  const params = new URLSearchParams();
  if (partner) params.set("partner", partner);
  const query = params.toString();
  const resource = useResource<SponsorshipSummary>(
    `/sponsorship/summary${query ? `?${query}` : ""}`,
  );

  // TODO: màn hình hoàn thiện phải render loading, error, ready, benefits và reach.
  return null;
}
```

**Đây chỉ là ví dụ luồng tích hợp, không phải thành phẩm.** Không để `return null` sau khi nộp PR. Type `SponsorshipSummary` phải được khai báo/import từ file trong module.

`src/features/communications/routes.ts` đã đăng ký `/tai-tro`; không cần thêm route, icon/menu hay sửa shell.

## 6. Test case bắt buộc

1. **Mở màn hình `/tai-tro`** bằng tài khoản có quyền `sponsorship`: API được gọi và UI render.
2. **Admin toàn hệ thống**: không kèm `partner`, hiển thị tổng dữ liệu có quyền xem.
3. **Admin chọn đối tác**: path đổi query scope; không hiện nháy dữ liệu scope cũ.
4. **Partner có quyền**: chỉ thấy bản ghi scope do backend chọn; không tạo bộ chọn scope trong feature.
5. **Module không được cấp**: menu/route được app kiểm soát; không giả định mọi tài khoản đều có `sponsorship`.
6. **Một mảng rỗng**: vẫn render mảng còn dữ liệu, có empty state theo khu vực.
7. **Cả hai mảng rỗng**: hiển thị thông điệp rõ ràng, không số KPI tự tạo.
8. **Progress 0, 0.5, 1, thiếu**: test định dạng và trạng thái đúng.
9. **Status lạ so với progress**: giữ status gốc, không tự ghi "Hoàn thành" trái nguồn.
10. **Lỗi mạng/HTTP**: nội dung tiếng Việt, retry hoạt động, không trắng màn hình.
11. **Số lớn / văn bản dài**: layout không vỡ, có đơn vị, không làm tràn viewport.
12. **Chế độ sáng/tối, desktop/mobile, bàn phím**: không có hover/motion gây khó dùng.
13. **Live API không khả dụng**: báo rõ đã test đến đâu và phần nào chỉ có kiểm tra code.

## 7. Acceptance criteria

- [ ] `/tai-tro` render đầy đủ theo JSON thật từ `/api/sponsorship/summary`.
- [ ] Có quyền lợi và truyền thông dưới dạng thông tin dễ hiểu, không quá tải biểu đồ.
- [ ] Progress/status được diễn giải trung thực; không nhầm reach với người duy nhất.
- [ ] Có loading, empty tách riêng từng nhóm, error và retry.
- [ ] Scope admin/partner đúng; không thêm filter hoặc export chưa có API.
- [ ] Responsive, light/dark, keyboard, semantic labels.
- [ ] TypeScript strict, `npm run build` pass, không thêm dependency.
- [ ] PR chỉ sửa module communications, nhắm `chiinthedesert/neu_python_master_dashboard:frontend-redesign`.

## 8. Prompt giao cho LLM của đồng đội

> Hãy đọc `frontend-redesign/AGENTS.md`, `frontend-redesign/docs/CONTRIBUTING.md`, `frontend-redesign/docs/tasks/sponsorship.md`. Sau đó đọc `Sponsorship.tsx`, `src/services/useResource.ts`, các component M3 Expressive hiện có, cùng endpoint `backend/app/routers/misc.py` và frontend cũ `frontend/src/pages/Sponsorship.tsx` để hiểu dữ liệu, không sao chép giao diện. Hãy lập kế hoạch ngắn trước khi code. Hoàn thiện màn hình `/tai-tro` bằng API thật, giữ nguyên backend/shell/routes/dependencies, chú trọng status và progress, scope, empty/error/mobile. Chạy build, báo cáo test trung thực và mở PR từ `feature/sponsorship` vào nhánh `frontend-redesign` trên fork `chiinthedesert`. Toàn bộ UI và mô tả PR dùng tiếng Việt.
