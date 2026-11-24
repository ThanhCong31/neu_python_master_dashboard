# Visual & Responsive Audit

Mục tiêu: Material 3 Expressive qua đúng component, không qua trang trí quá mức. Dùng source hiện tại và ảnh người dùng đã gửi trong vòng V28–V34; chưa có screenshot runtime mới sau hotfix.

| ID | Mức / loại | Bằng chứng | Hướng sửa / nghiệm thu |
|---|---|---|---|
| V01 | P1 C | `system/system.css` `.sys-tabs` có lớp nền ngoài, padding 6px, nút pill; `expressive/view-switch` là connected group không vỏ | Admin/Quality là tab panel, ưu tiên Tabs registry hoặc adaptation giữ keyboard/dirty guard; không ép ViewSwitch vào mọi tab. |
| V02 | P1 C | `.sys-dialog` dùng 94vw, 90dvh, cả dialog scroll; `.dw-dialog` full screen mobile với body scroll độc lập | Đồng bộ shape, typography, header/footer; chỉ migrate sau test pending mutation. |
| V03 | P1 C | `.sys-table` min-width 640px và pagination riêng; shared table dùng sticky header, alignment theo column | Đồng bộ surface, padding, header, focus; admin có thể cuộn ngang trong region, không bắt buộc mobile record list nếu nghiệp vụ không phù hợp. |
| V04 | P2 C | `Shell.tsx` scope trigger cao 40px, RefreshButton min 48px; Overview export size sm, workspace action 48px | Căn theo tâm hàng và nhóm thao tác; chuẩn 48px target trên touch; không buộc form 56px giảm xuống. |
| V05 | P2 C | `system.css` filter row 56px; V29 compact WorkspaceSelect 48px | Phân biệt filter toolbar và form nhập liệu; áp dụng compact cho toolbar Quality/Admin khi không ảnh hưởng form. |
| V06 | P2 C | Account headings, system section headings và feature-specific CSS dùng nhiều cấp chữ khác nhau | Một H1 tại Shell; H2 section 18px hoặc title-medium tương ứng; body 14–16, note 13–14, line-height 1.4–1.6; đối chiếu token thay vì đặt cứng toàn app. |
| V07 | P2 R | `.dw-table-scroll` max-height min(65vh,740px), table sticky header; screenshot V32 cho thấy vùng header/body cần kiểm tra | Kiểm tra khe header, focus ring, scrollbars tại viewport thấp 768px và zoom 200%; không làm tràn page. |
| V08 | P1 R | `Chart.tsx`, `chart-style.ts`, `chart.css`: V34 HTML legend, radius 4px, tooltip 12px | Render ECharts thật cả 5 theme; stacked caps không khe, không decal, legend wrap, series color đúng và đủ tương phản; không sửa lần nữa nếu đạt. |
| V09 | P1 R | `Shell.tsx` render hai ScopeSelect ở breakpoint CSS (`globals.css`) | Kiểm tra focus/tab order, popup đang mở khi resize; chỉ một trigger nhìn thấy và có thể focus. |
| V10 | P2 R | Button/IconButton dùng motion từ primitive; PageRefresh chưa chỉ định standard | Kiểm tra press, loading, selected state, reduced motion; loại animation thay đổi chiều rộng ngoài ý muốn. |
| V11 | P2 R | CSV status nằm trong toolbar (`CsvDownload.tsx` `.dw-export`) | Khi thông báo dài không làm search/dropdown đổi vị trí; cân nhắc vùng feedback riêng bên dưới toolbar. |
| V12 | P2 D | StatusLabel tone dùng tokens; các loại dữ liệu khác nhau có cùng màu | Màu ngữ nghĩa đi kèm chữ, không dùng màu như thông tin duy nhất; không buộc semantic green/red vào mọi theme. |
| V13 | P1 R | Compact mode <680px; expanded >=1000px; chart host <340/480 | Test thực tại 320/360/390/430/600/768/1024/1280/1440/1920, content 339/340, 479/480, 679/680, 739/740, 999/1000; sidebar mở/đóng. |
| V14 | P2 R | Dialog cột vừa thêm Chọn tất cả/Mặc định/Xong; footer wrap | Kiểm tra ba nút không bị khuất khi keyboard mở, text dài, zoom; trạng thái mặc định và quyền PII chính xác. |

## Quy chuẩn giữ nguyên
- ViewSwitch V34 không dấu tick; màu và shape đủ phân biệt, aria-pressed được giữ. Không tái đưa vỏ ngoài hoặc dịch chữ khi chuyển.
- Search pill, compact select radius 16px, toolbar 48px, form fields nguyên bản phù hợp form. Không trộn hai context.
- Chart bar cap 4px, line 3px, progress pill 12px; số liệu không được thay đổi để làm đẹp. Giữ HTML legend và data table.
- Text trái, số đếm/tiền trong bảng phân tích phải, điểm/hạng/trạng thái ngắn căn giữa theo contract; không dùng nth-child để căn nghiệp vụ.
- Content grid min-width 0; chỉ vùng bảng chủ động cuộn ngang khi bật cột phụ. Mobile không mất dữ liệu thiết yếu.

## Review thực tế
Chụp toàn trang và vùng tương tác với dữ liệu dài/rỗng/lỗi. Mỗi ảnh phải ghi route, viewport, content width, theme, scope, mode và commit. So sánh cùng dataset, không dùng ảnh fixture như bằng chứng React. Chỉ sửa các điểm gây ảnh hưởng rõ ràng; tránh thay đổi toàn bộ radius nếu đã dùng đúng token.
