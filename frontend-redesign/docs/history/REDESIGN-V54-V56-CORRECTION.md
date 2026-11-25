# V54–V56 — Sửa lại phạm vi thay đổi và viết lại Truyền thông/Nhà tài trợ

## Nguyên tắc

V39–V53 đã mở rộng một số giao diện ngoài phạm vi khôi phục chức năng. V55 sửa các thay đổi UI không cần thiết; V56 viết lại code hai màn hình communications theo cấu trúc modules của Liên hệ, Lead và Kết quả thi. Giữ thiết kế đã duyệt của các màn hình khác, giữ BA/API gốc. Không thay backend, ETL, dữ liệu, dependency, route, theme hoặc navigation.

## V54 — Đơn giản hóa quyền lợi nhà tài trợ

- Bỏ chế độ chuyển đổi Tiến độ / Bảng số liệu và bảng quyền lợi trùng lặp; danh sách tiến độ đã thể hiện tên hạng mục, vị trí, thời gian, ghi chú, trạng thái và tỷ lệ hoàn thành.
- Giữ bốn biểu đồ phân tích Nhà tài trợ cùng bảng số liệu tương ứng như frontend gốc. Không thay đổi API hoặc dữ liệu quyền lợi.

## V55 — Sửa UI

- Tổng quan: quay lại bố cục, KPI và liên kết đã duyệt ở V38. Chi tiết nghiệp vụ vẫn ở các màn hình chuyên sâu.
- Liên hệ: bỏ nút chuyển sang bảng funnel; giữ số liệu, tỷ lệ và heatmap mới khôi phục.
- Lead: đưa FAQ vào chiều phân tích `Nhóm theo`, không thêm panel trùng. Chỉ hiển thị free text với `can_view_pii`.
- Chất lượng dữ liệu: đưa nút biểu đồ/bảng về `Section.actions`; dropdown compact trong `.sys-filters` giữ shell 48px (flex-basis ngang 7rem không được trở thành chiều cao).

## V56 — Viết lại communications

- `Marketing.tsx`, `Sponsorship.tsx`: page controller riêng, scope key, `useResource`, `PageRefresh`, lazy analytics; không thêm header hoặc route.
- `marketing/model.ts`, `marketing/query.ts`, `marketing/components/Filters.tsx`, `marketing/components/Analytics.tsx`; `sponsorship/model.ts`, `sponsorship/query.ts`, `sponsorship/components/Analytics.tsx`.
- Bỏ `communications/components.tsx`, `MarketingFilters.tsx` và `types.ts` cũ. `ChannelChart` chỉ cấu hình ECharts cho các nhóm kênh, không có renderer riêng. Dùng trực tiếp `shared/charts/Chart`, `AnalysisTable`, `LoadingState`, `ResponsiveDialog`, `StatusLabel`, `Button`, `Checkbox` và formatter chung.
- CSS feature chỉ còn bố cục KPI/panel/filter/quyền lợi, mật độ gần V38; không đổi global theme, token hoặc padding của màn hình khác. Nút Bảng số liệu nằm chung header biểu đồ; không thêm hàng nút riêng. Không thêm chế độ xem quyền lợi, chip hay segmented switch không có nhu cầu nghiệp vụ.

| Nghiệp vụ gốc | V56 |
|---|---|
| Truyền thông: 5 KPI, bảng hiệu quả | Giữ |
| 6 biểu đồ ROI/ngân sách/CPA/chuyển đổi/liên hệ/CTR | Giữ; đầy đủ bảng số liệu, không cắt 12 kênh |
| Đối soát đăng ký và doanh thu | Khôi phục **2 biểu đồ riêng** kèm bảng gốc/đối soát, nhận xét và ROI |
| Nhà tài trợ: 3 KPI và danh sách quyền lợi | Giữ; không lặp phần trăm nếu trạng thái đã có cùng số |
| 4 biểu đồ Nhà tài trợ | Giữ đủ biểu đồ và bảng |
| Phạm vi + bộ lọc Truyền thông | API cũ; xác minh metadata theo scope, ngày và lựa chọn hợp lệ |

`null` không phải 0, ngân sách 0 vẫn là ngân sách nhìn thấy, ROI âm không bị cắt, báo cáo gốc không đổi theo bộ lọc; so sánh theo bộ lọc chỉ tham khảo. Tooltip custom chỉ cho số liệu bổ sung ROI, dùng surface/typography shared và escape nội dung HTML. Dữ liệu không hợp lệ vẫn có bảng nguồn.

## Nghiệm thu

`npm run test:local` và `npm run build`; so sánh số liệu thật với API. Kiểm tra dark/light, 375/768/desktop, scope admin/partner, loading/error/refresh, nút biểu đồ/bảng, filter dialog và dropdown 48px. Đây là thay đổi local, chưa commit/push. Source assertions và test model/query không thay thế build hay browser acceptance.
