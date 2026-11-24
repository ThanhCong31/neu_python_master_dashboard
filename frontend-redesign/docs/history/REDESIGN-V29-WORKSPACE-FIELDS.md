# V29 — Compact Workspace Fields

Baseline: V28 (design-system foundation). Phạm vi: Contacts, Leads và các control dùng chung của hai màn hình. Không đổi API, dependencies, URL, filter/sort, CSV, phân quyền hoặc default form fields trong Login/Admin.

## Quy chuẩn
- TextField `variant="search"`: 48px (3rem), pill theo shape token, surface-container-high, icon 20px, padding ngang 16px, gap 10px, chữ 14px. Placeholder hiển thị cả khi chưa focus; Field.Label vẫn tồn tại cho assistive technology. Không có floating-label animation.
- Select `variant="compact"`: 48px, corner-large (16px mặc định), surface-container, outline-variant, padding 12px, nhãn bên cạnh và wrap khi cần. Vẫn sử dụng BaseSelect, không đổi API của Select cũ. Popup bo 16px, lựa chọn 48px trở lên, fade 120ms thay cho scale, cho phép nhãn dài xuống dòng.
- Toolbar dùng chung: search, sort, Cột và CSV cùng hàng nếu đủ chỗ; xuống hàng tự nhiên khi content hẹp. Nút thao tác cao 48px. Số dòng nằm gần điều hướng phân trang. Search trong dialog lọc và Select chiều phân tích sử dụng cùng quy chuẩn.
- Focus dùng primary border/inset shadow, không đổi kích thước. Reduced motion được hỗ trợ. Màu sắc lấy từ Material tokens; không hardcode palette. Login và Admin vẫn dùng biến thể filled/outlined mặc định.

## Kiểm tra đã thực hiện
- `npm run test:theme`, `test:api`, `test:overview`, `test:contacts`, `test:leads`: pass.
- Chromium: 60 tổ hợp HTML/CSS fixture tại 320, 360, 390, 430, 600, 680, 768, 1024, 1280, 1440px; hai palette sáng/tối đại diện, Contacts và Leads (cả quyền CSV giới hạn). Không tràn viewport; field/action height 48px; cùng hàng ở viewport >=1024 trong fixture; kiểm tra native input focus và nhập/xóa. Fixture mô phỏng markup và utility CSS của primitive; không phải React/Base UI runtime.
- Full build bị chặn bởi thiếu type definitions `node`, `vite/client`; `test:local` bị chặn ở `test:source` vì chưa có local TypeScript. Cần chạy trên môi trường đã npm ci.

## Review runtime bắt buộc
1. Contacts và Leads: tìm kiếm, xóa từ khóa, sắp xếp, đổi số dòng, tùy chỉnh cột, CSV; xác nhận truy vấn không đổi ngoài hành vi cũ.
2. Mở/đóng dropdown, chọn bằng bàn phím, focus ring, nhãn dài, popup không tràn màn hình và scroll item.
3. Thử 320–1440px, sidebar mở/đóng, zoom 200%, năm theme và dark mode; không tràn trang và không che giá trị đang chọn.
4. Mở Login/Admin: default field layout và floating label phải giữ nguyên.
