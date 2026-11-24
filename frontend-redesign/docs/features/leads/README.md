# Lead từ biểu mẫu — hồ sơ thiết kế V21–V23

> Hồ sơ thiết kế theo baseline lịch sử; xem [design review](leads-design-review.md) và [lịch sử triển khai](../../history/README.md) để biết các quyết định sau audit.

Baseline: V20, `/lead`, nhóm Tuyển sinh. Trạng thái: đề xuất thiết kế, chưa viết code. Ngày: 24/11/2026.

## Thứ tự đọc

| Tài liệu | Trách nhiệm |
|---|---|
| [leads-issues.md](leads-issues.md) | Audit, bằng chứng, vấn đề cần sửa |
| [leads-api-contract.md](leads-api-contract.md) | API, đơn vị đếm, giới hạn dữ liệu và phân quyền |
| [leads-design.md](leads-design.md) | IA, VD, responsive, tương tác |
| [leads-plan.md](leads-plan.md) | Kiến trúc, reuse, vòng triển khai V21–V23 |
| [leads-review.md](leads-review.md) | Test fixtures, acceptance, review gates |

Đặt trong `frontend-redesign/docs/features/leads/`. Đọc thêm AGENTS.md, CONTRIBUTING.md, [V20](../../history/REDESIGN-V20.md), [Contacts design review](../contacts/contacts-design-review.md) và [Contacts review](../contacts/contacts-review.md). Nếu tài liệu mâu thuẫn với source thật, xác minh trước khi sửa. Không sửa màn hình teammate, backend, data, Shell, dependencies trong feature này trừ khi có yêu cầu riêng.

## Kết luận audit

- Lead = dòng biểu mẫu ngoài đã xử lý, không phải người duy nhất, không phải giao dịch thanh toán. Contacts là hồ sơ CRM hợp nhất; Marketing là hiệu quả/chi phí kênh.
- Giữ mô hình hai chế độ như Contacts, mặc định Danh sách lead, Phân tích nguồn ở chế độ thứ hai. Một filter dialog và chip đang áp dụng; search chỉ list/CSV. PageRefresh V20 đặt trong Top App Bar; không H1, không refresh thứ hai.
- Bảng desktop, danh sách compact dưới 680px content width; chi tiết chỉ đọc, không phát minh thao tác chăm sóc, hợp nhất, gửi email hay sửa hồ sơ.
- Phân tích nguồn và kết quả đối soát là trọng tâm; không lặp phễu/thu phí của Contacts, không ROI của Marketing. 11 biểu đồ cũ tổ chức lại thành một khu vực đối soát, một biểu đồ tuần và một phân nhóm. Không hiển thị nội dung câu hỏi tự do trong aggregate mặc định vì rủi ro riêng tư.
- Nguồn và kết quả lấy từ API, không hardcode hai nguồn, 59 lead, khoảng ngày cố định hoặc chỉ ba kết quả. Tuần ISO, lưu ý timestamp thiếu và fallback ETL. Không đánh đồng tự khai với đăng ký đã xác minh.
- Tái sử dụng primitive M3 Expressive và ECharts V16, quy chuẩn V20; chỉ extract thành phần dùng chung khi API component tương đồng và có regression tests Contacts.

## Căn cứ

Đã đọc `main` qua GitHub fork chiinthedesert/neu_python_master_dashboard: frontend/src/pages/Leads.tsx (blob 85475babfbe42894e6956a5528e35de2c13f812c), backend/app/routers/leads.py (0f605aecc7517e93a3006aad116f2e7455858f80), filters.py (3807cb31527eee1ce4bababdaf0ce6bf263ffd40), misc.py, etl/loaders.py, seed.py, process_and_seed.py, tagging.py, docs/DATA_DICTIONARY.md. DataTable, FilterBar, hooks và Viz đã được đọc ở vòng Contacts trước trong cùng hội thoại. Đã mở lại tài liệu Contacts và source V20 local: Leads.tsx còn return null, Contacts.tsx, model/query, ExportCsv, useResource, PageActions. Baseline local là workspace V19 + V20 patch; chưa xác minh trạng thái local của người dùng. Không đọc database live; không khẳng định số liệu production, timestamp hay role cụ thể đã test.

## Cách sử dụng

Review IA/VD trước code. Sau khi duyệt: V21 hồ sơ, V22 phân tích, V23 review và refinement; nếu blocker backend thì giảm phạm vi hoặc ghi đề xuất riêng, không làm giả. Chỉ ghi PASS có kết quả test thật. Bản giao là patch từ V20 thực tế, không commit/push remote.
