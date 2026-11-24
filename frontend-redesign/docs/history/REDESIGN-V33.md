# V33 — Table alignment & shared grade distribution

Baseline: V32. Không thay đổi backend, quyền truy cập, dependencies hoặc dữ liệu nguồn.

- `RecordColumn.align` xác định căn lề cho cả `th` và `td`; mặc định `start`. Điểm, hạng, bảng thi, xếp loại và trạng thái chứng chỉ của Exams căn giữa. Nút sắp xếp giữ khoảng trống đối xứng cho icon. Bỏ selector `nth-child` căn phải cột điểm cũ để tránh lệch khi thêm cột.
- `GradeDistribution` dùng chung giữa Overview và Exams. Cột ngang màu đặc, không decal, nhãn và chú giải theo theme, có bảng số liệu (số lượng và tỷ trọng trong nhóm được biểu diễn). A dùng primary, B dùng tertiary, kể cả khi chỉ còn một bảng. Histogram Exams cũng giữ hai màu theo bảng.
- Overview chỉ có biểu đồ khi exams là domain chính, không hardcode đối tác DN. Giữ snapshot PM119, link tới `/diem-thi` theo route được cấp quyền với `dataset=PM119&view=analysis` (Exams xác thực dataset như trước). Không thêm chart lặp vào mọi Overview.
- Exams hiển thị phân bố theo dataset/filter/vòng hiện tại, không phải snapshot cố định. Summary Exams loại các grade null, Overview có nhóm chưa xếp loại; không giả định hai nguồn luôn có cùng mẫu số. Bảng grade giữ nhóm chưa xếp loại nếu có ở Overview. Điểm theo phần thi giữ nguyên, tách thành vùng bên dưới chart full-width.
- Không tắt ARIA của ECharts. Bảng số liệu là phương án đọc độc lập với màu.

## Kiểm tra thực hiện

- Pass: test:overview, test:contacts, test:leads, test:exams (thêm kiểm tra màu, decal và responsive option), test:theme, test:api.
- Pass: parse/transpile 110 module TS/TSX; không phải full typecheck.
- Pass: 48 fixture CSS Chromium, sáng/tối, 320–1920px, gồm cột bổ sung; kiểm tra tâm tiêu đề có icon và căn lề ô, bảng mặc định và legend/bảng số liệu không làm tràn trang.
- Chưa xác nhận: full React/TypeScript build, ECharts canvas và tương tác thực tế với API. Cần chạy build và review live trên máy người dùng.
