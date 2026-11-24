# V10 — Overview foundation
- Bắt đầu từ archive V9 selection-cleanup, giữ nguyên shell và module của đồng đội.
- API `/overview` không áp dụng filter CRM toàn trang; dùng scope thực, kiểm tra `viewing_partner`, module có quyền và section có dữ liệu.
- Bento KPI, formatter vi-VN, ba action export qua API blob cùng cơ chế xử lý 401; layout nhỏ dùng menu.
- ECharts 6.1.0 pin theo lockfile frontend main. Lockfile bổ sung thủ công đúng integrity từ main, dùng tslib 2.3.0 lồng trong hai package để không thay tslib hiện có. Chưa chạy npm ci do DNS registry không truy cập được.
- Review V10: mới có CRM hero, thiếu phân tích/role không CRM; V11 phải bổ sung. Cần tránh skeleton vô hạn nếu scope trả về không đúng, phân biệt null/zero, mô tả báo cáo đầy đủ khác UI.
