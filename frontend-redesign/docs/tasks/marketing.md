# Đặc tả triển khai: Truyền thông — Kênh & ROI

> **Giao cho:** thành viên phụ trách giao diện Truyền thông.
>
> **Đọc trước:** [`../../AGENTS.md`](../../AGENTS.md), [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
>
> **Đích PR:** `chiinthedesert/neu_python_master_dashboard`, **base `frontend-redesign`**, branch đề xuất **`feature/marketing`**.
>
> **Trạng thái lúc soạn:** `src/features/communications/Marketing.tsx` trong snapshot V9 chỉ `return null`; route `/kenh-roi` đã tồn tại. Chỉ bắt đầu khi nhánh GitHub đã nhận bản V9 mới.

## 1. Kết quả cần tạo

Một màn hình phân tích **hiệu quả kênh tuyển sinh và truyền thông** giúp người dùng trả lời nhanh:

1. Mỗi kênh mang lại bao nhiêu liên hệ, lượt đăng ký web và người đã thanh toán?
2. Doanh thu lệ phí ghi nhận và ngân sách được nhìn thấy là bao nhiêu?
3. Nếu đủ dữ liệu, ROI/CPA được tính theo mẫu số nào, có áp dụng cho toàn chương trình hay chỉ kênh có ngân sách?
4. Số liệu nào do gán nguồn/giả định, hoặc bị giới hạn theo quyền xem?

**Không cần:** CRM danh sách người dùng, biểu mẫu chỉnh sửa ngân sách, upload, export Word/PDF/Excel, tự đặt lại phân quyền hoặc dashboard KPI từ backend tự tính lại.

UI tiếng Việt, dùng design system V9; không tái hiện nguyên xi trang cũ.

## 2. API nguồn duy nhất cho số liệu chính

**`GET /api/marketing/summary`**

Code backend tham chiếu: `backend/app/routers/marketing.py`, hàm `marketing_summary`, endpoint `summary`; phụ thuộc `backend/app/filters.py` (`ContactFilters`, `scope_match`) và `backend/app/security.py` (`require_module("marketing")`). Dùng `src/services/api.ts` nên **path truyền vào hook là `/marketing/summary`**, không thêm `/api`.

### Query được hỗ trợ bởi `ContactFilters`

`partner` (admin), `date_from`, `date_to`, `board`, `region`, `province`, `payment_status`, `segment`, `channel`, `source`, `pic`, `venue`, `q`.

- Date là `YYYY-MM-DD`; dùng trên trường **`contacts.first_touch`** (theo backend, không phải ngày chi ngân sách).
- Bộ lọc đa giá trị dạng chuỗi phân tách bằng dấu phẩy cho các trường được `add_in` xử lý.
- Với `partner` của admin, chỉ thêm query khi có mã đối tác; tài khoản partner không tự đặt mã, backend sẽ tự scope.
- Danh mục filter có thể lấy từ `GET /api/meta/options` → `contacts`, với cùng `partner`; endpoint này phục vụ lựa chọn giá trị, **không phải dữ liệu KPI**.
- Nên ưu tiên các bộ lọc thật sự có ích, không lấp đầy màn hình bằng tất cả filter.

### Kiểu JSON cần mô hình hóa

Các trường dưới đây được kiểm tra trực tiếp từ backend `marketing.py`; response thực tế có thể có channel bổ sung theo DB:

```ts
interface MarketingSummary {
  kpi: {
    contacts: number;
    web_registered: number;
    paid: number;
    revenue: number;
    budget: number | null;
    roi_program: number | null;
    roi_paid_channels: number | null;
    cpa_paid: number | null;
  };
  channels: MarketingChannel[];
  filtered: boolean;
}

interface MarketingChannel {
  channel: string;
  contacts: number;
  web_registered: number;
  unregistered: number;
  paid: number;
  revenue: number;
  conversion: number | null;
  assumed_contacts: number;
  budget_visible: boolean;
  budget: number | null;
  roi: number | null;
  cpa_lead: number | null;
  cpa_paid: number | null;
  cpa_active: number | null;
  clicks: number | null;
  ctr: number | null;
  active_candidates_assumed: number | null;
  is_assumed: boolean | null;
  data_note: string | null;
  original_report: unknown | null;
}
```

**Lưu ý:** `original_report` do backend chuyển từ collection ngân sách, hình dạng có thể phụ thuộc dữ liệu nguồn. Không thiết kế UI dựa trên schema chưa xác minh; chỉ hiển thị khi đã kiểm tra response. Nếu dữ liệu thực tế có kiểu khác, sửa type theo response thật và ghi thay đổi vào PR.

## 3. Quy tắc nghiệp vụ bắt buộc

### 3.1 Tỷ lệ và công thức

Backend đã trả sẵn tỷ lệ dạng số thập phân; **không tính lại để thay thế dữ liệu chính thức**. Dùng các công thức bên dưới để hiểu và ghi nhãn:

| Trường | Nghĩa theo backend | Cách hiển thị |
|---|---|---|
| `conversion` | `paid / web_registered` của kênh | `%`; null → `—` |
| `roi` của channel | `(revenue - budget) / budget` | `%` có dấu ±, chỉ khi có budget hợp lệ |
| `roi_program` | `(tổng doanh thu - tổng budget nhìn thấy) / tổng budget` | Chỉ có cho admin không chọn partner, khi có budget |
| `roi_paid_channels` | `(doanh thu của kênh có budget - budget) / budget` | Nhãn **ROI các kênh có ngân sách** |
| `cpa_paid` | `budget / số đã thanh toán` | `₫/người đã thanh toán` |
| `cpa_lead` | Backend dùng `budget / web_registered` | Nhãn **Chi phí / đăng ký web**, tránh gọi sai thành mọi lead |
| `cpa_active` | `budget / active_candidates_assumed` | Chỉ hiển thị khi có mẫu số, ghi rõ số lượng ứng viên **ước tính** |

Định nghĩa ROI cần cực kỳ rõ: **ROI toàn chương trình ≠ ROI các kênh có ngân sách**. Không tự chọn số còn lại để lấp KPI bị `null` mà vẫn giữ nguyên nhãn.

### 3.2 Thống kê giả định và gán nguồn

- `assumed_contacts` đếm liên hệ có `channel_is_assumed`, không phải số liên hệ đã được xác minh nguồn.
- `is_assumed`, `data_note`, `original_report`, `active_candidates_assumed` có thể biểu thị **ngân sách/chỉ số tham chiếu được ước tính hoặc lấy từ báo cáo ngoài**.
- Gắn nhãn "Ước tính" hoặc giải thích trong chi tiết khi API đánh dấu; không hiển thị như số liệu đo trực tiếp.
- Không được kết luận kênh này gây ra tất cả doanh thu được gán cho kênh: các số liệu là **attribution theo dữ liệu hiện có**, không chứng minh quan hệ nhân quả.

### 3.3 Ngân sách, ngày và phạm vi

**Cảnh báo quan trọng xác nhận từ mã backend:**

- `contacts` chịu các filter ngày/region/board/channel/… của `ContactFilters`.
- `channel_budgets` chỉ được lọc theo **đối tác** (`partners`); không được chia nhỏ theo ngày/region/board.
- Do đó nếu áp filter ngày hoặc vùng, ROI có thể so sánh **doanh thu đã lọc** với **ngân sách chưa được phân bổ lại**. Nếu bật các filter đó, UI phải kèm chú giải ngay cạnh ROI, ví dụ: "Ngân sách kênh không được phân bổ theo khoảng thời gian/bộ lọc hiện tại".
- `budget_visible: false` nghĩa là không có budget khả dụng trong scope đang xem, **không phải ngân sách bằng 0**. Ẩn ROI/CPA hoặc ghi "Không có dữ liệu ngân sách".
- Admin chọn `partner` → `roi_program` theo API sẽ là `null`; chỉ báo ROI các kênh có ngân sách nếu có.
- Tài khoản partner không được tự chuyển sang Toàn hệ thống bằng query string hoặc UI.

### 3.4 Phân biệt thiếu dữ liệu với 0

| Giá trị | UI |
|---|---|
| `0` người thanh toán | `0` — giá trị đếm thật |
| `revenue: 0` | `0 ₫` nếu API trả 0 |
| `budget: null` | `—` hoặc "Không có ngân sách khả dụng" |
| `roi: null` | `—`, không phải `0%` |
| `conversion: null` | `—` và giải thích thiếu mẫu số |
| `channels: []` | Empty state có nội dung, không tự dựng hàng mẫu |

## 4. Đề xuất thiết kế thông tin

Không nhất thiết copy từng card của frontend cũ. Ưu tiên **một trang phân tích rõ ràng và gọn**:

**A. Mô tả/trạng thái**: 1–2 câu giải thích "Hiệu quả các kênh trong phạm vi dữ liệu đang xem". Khi `filtered` hoặc admin đang chọn partner, ghi ngắn đúng ngữ cảnh. Không lặp lại scope menu trong shell.

**B. KPI**: tối đa khoảng 4–6 chỉ số có ích, chẳng hạn "Liên hệ", "Đăng ký web", "Đã thanh toán", "Doanh thu lệ phí", "Ngân sách khả dụng", ROI phù hợp nếu có. Không hiển thị KPI mơ hồ; khi ROI không có, card giải thích thay vì dùng số giả.

**C. So sánh hiệu quả kênh**: biểu diễn so sánh số đã thanh toán/doanh thu giữa các kênh; chỉ so sánh ROI ở các kênh có budget. Với ít kênh có thể dùng thanh ngang HTML/CSS; không tự cài chart library. Kênh thiếu budget phải được phân biệt.

**D. Bảng theo kênh**: các cột quan trọng (Kênh, Liên hệ, Đăng ký web, Đã thanh toán, Tỷ lệ chuyển đổi, Doanh thu, Ngân sách/ROI nếu có). Trên điện thoại có thể cuộn ngang **trong bảng** hoặc chuyển thành card có label, không làm tràn cả trang.

**E. Giải thích dữ liệu**: chú thích ngắn, không cần modal phức tạp: giả định, attribution, budget không chia theo filter, ROI scope. Có thể dùng `Tooltip` cho giải thích bổ sung nhưng thông tin quyết định không được chỉ nằm trong hover.

### Bộ lọc

- Nếu có bộ lọc, bố trí thành một khu vực nhất quán; nhãn đặt phía trên như các filter admin mới, tránh lẫn field label nổi với field label cố định.
- Nên bắt đầu đơn giản với 1–3 filter thật sự có ích (ví dụ kênh, khu vực, khoảng ngày nếu có cảnh báo). Query phải được gửi tới API và reset khi cần.
- Không tự hiển thị "Làm mới" chỉ vì những màn hình Hệ thống từng có; `useResource` đã tải lại khi `path` đổi. Khi dữ liệu bị lỗi, có `Thử lại` rõ ràng.
- **Không thêm nút xuất Excel/Word/PDF**: endpoint `/api/overview/export` tạo báo cáo **Tổng quan**, không phải báo cáo riêng Truyền thông.

## 5. Tích hợp React chính xác

Tập trung tại `src/features/communications/Marketing.tsx`. Nếu code lớn, tách subcomponent/type/style vào `src/features/communications/`.

```tsx
import { useWorkspace } from "@/app/workspace";
import { useResource } from "@/services/useResource";

export default function Marketing() {
  const { partner } = useWorkspace();
  const params = new URLSearchParams();
  if (partner) params.set("partner", partner);
  // Khi thêm filter: đưa các giá trị hợp lệ vào params và kiểm thử lại ROI theo bộ lọc.
  const query = params.toString();
  const resource = useResource<MarketingSummary>(
    `/marketing/summary${query ? `?${query}` : ""}`,
  );

  // Bắt buộc render các trạng thái loading, error, ready và empty.
  // Tái sử dụng button và token UI hiện hữu; không return null trong bản hoàn thiện.
  return null;
}
```

**Ví dụ trên là skeleton giải thích tích hợp, không phải code hoàn thiện.** LLM phải viết UI thật và kiểm tra API. `MarketingSummary` nên nằm trong type cùng feature hoặc một file `types.ts` local.

Đường dẫn `/kenh-roi` và `Destination` đã có trong `src/features/communications/routes.ts`. Không sửa route registry và sidebar để thêm nó lần nữa.

## 6. Trạng thái và các tình huống cần kiểm thử

1. **Chưa tải xong**: skeleton/progress rõ ràng, không nhấp nháy giữa scope cũ và mới.
2. **Lỗi API**: nội dung tiếng Việt + nút Thử lại; không crash trắng; thông báo 401 được app xử lý logout.
3. **Không có dữ liệu**: KPI/hình minh hoạ trống có lời giải thích, không dựng dữ liệu demo.
4. **Có liên hệ nhưng không có ngân sách**: giữ các số liên hệ/doanh thu, ROI và budget hiển thị thiếu dữ liệu, không coi là 0.
5. **Budget = 0**: API có thể trả `roi: null`; không chia thủ công cho 0.
6. **Admin toàn hệ thống**: `roi_program` nếu API có giá trị; hiển thị đúng nhãn.
7. **Admin chọn đối tác**: request kèm `partner`, dữ liệu thay đổi; `roi_program` null nhưng `roi_paid_channels` có thể khác null.
8. **Tài khoản đối tác**: không gửi partner giả và không tiết lộ kênh/ngân sách không được backend trả.
9. **Thay đổi filter ngày** (nếu có): hiển thị ghi chú rằng budget không chia theo ngày.
10. **Định dạng**: số tiền VND, dấu phân cách tiếng Việt, tỷ lệ 0.25 → 25%, không ra NaN/Infinity.
11. **Responsive**: desktop, 768px, 375px, dark mode, keyboard focus, reduced motion.
12. **Không thể test API thật**: ghi rõ trong PR, tuyệt đối không khẳng định đã kiểm tra.

## 7. Acceptance criteria cho PR

- [ ] `/kenh-roi` hiển thị UI hoàn thiện, không `return null`, không sửa shell/routes.
- [ ] Số liệu lấy từ `GET /api/marketing/summary` theo scope thực, không hardcode.
- [ ] Định nghĩa ROI/CPA và nhãn chính xác; `null`/`0`/ước tính phân biệt rõ.
- [ ] Có KPI + so sánh kênh + chi tiết đủ để người dùng đọc được.
- [ ] Filter nào có trong UI đều hoạt động thật; cảnh báo ROI khi filter thời gian/phạm vi.
- [ ] Có loading, empty, error, retry.
- [ ] Responsive + dark/light + keyboard; không thêm dependencies.
- [ ] `npm run build` thành công; không claim test vượt quá những gì đã làm.
- [ ] PR chỉ sửa file trong phạm vi và nhắm `chiinthedesert/neu_python_master_dashboard:frontend-redesign`.

## 8. Prompt giao cho LLM của đồng đội

> Hãy đọc `frontend-redesign/AGENTS.md`, `frontend-redesign/docs/CONTRIBUTING.md`, `frontend-redesign/docs/tasks/marketing.md`, rồi kiểm tra `Marketing.tsx`, các Expressive component và backend `backend/app/routers/marketing.py`, `backend/app/filters.py`. Trước khi code, tóm tắt kế hoạch UI, data flow, định nghĩa ROI/CPA và rủi ro đối với bộ lọc. Triển khai màn hình Truyền thông trên `/kenh-roi` bằng API thật. Không sửa backend, shell, route chung hoặc dependencies. Kiểm thử và mở PR từ `feature/marketing` vào fork `chiinthedesert`, base `frontend-redesign`. Viết toàn bộ UI, báo cáo và PR bằng tiếng Việt.
