# V25 — Connected view selection

- Contacts và Leads dùng chung `ViewSwitch` trong `components/expressive/`, dựa trên ToggleButton hiện có và Base UI ToggleGroup. Không đổi API, URL, state model hoặc dependency.
- Thiết kế theo Connected Button Group: khoảng cách 2px, không có nền bọc, góc ngoài pill, góc trong nhỏ khi chưa chọn, nút được chọn full pill. Check luôn giữ chỗ để không nhảy chữ; aria-pressed và keyboard navigation do Base UI cung cấp.
- Hai ô có chiều rộng ổn định; chữ được xuống dòng trên content hẹp. Touch target tối thiểu 48px. Standard ripple, transition màu/góc ngắn, không elastic resize; reduced motion tắt transition.
- Component là bản thích ứng của design system local, không phải chạy lại CLI hoặc thay thế toàn bộ thư viện. Tham chiếu: https://expressive.grenishrai.pro/docs/components/button-group ; https://github.com/material-components/material-components-android/blob/master/docs/components/ButtonGroup.md
- Kiểm tra khi chạy app: chọn cả hai chế độ, nhấn lại mục đang chọn, dùng Tab/mũi tên/Space, back/forward URL, theme sáng/tối, content 280–1000px, reduced motion. Overview và action ButtonGroup không thay đổi.
