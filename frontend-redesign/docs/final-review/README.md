# Final Product Review — baseline V34 + hotfixes

Mục tiêu: hoàn thiện sản phẩm, không mở rộng chức năng hoặc redesign lại IA. Audit này chỉ bổ sung tài liệu; chưa sửa source.

## Baseline và bằng chứng
- Remote `chiinthedesert/neu_python_master_dashboard`, nhánh `frontend-redesign`, tree `0755e8a123957b52a203de819f239c3a31d61a61`: chưa thấy feature Exams V32; Marketing/Sponsorship vẫn trả null. Không coi remote là V34.
- Source audit: bản sao `/mnt/data/v34-work/frontend-redesign` trong workspace riêng, xác nhận TypeScript hotfix đã có bằng reverse check, áp dụng thành công `neu-v34-view-switch-no-check.patch` và `neu-v34-column-selection.patch`. Không thay đổi workspace gốc. Không xác nhận các sửa đổi riêng trên máy người dùng.
- Backend đối chiếu trên main: `filters.py` blob 3807cb31527eee1ce4bababdaf0ce6bf263ffd40; `routers/leads.py` 0f605aecc7517e93a3006aad116f2e7455858f80; `routers/overview.py` 40961d73c610e8b649b2c89012ccf9cc2cec790f; `routers/contacts.py` 27a8932ef38f3876deb34b3371ebf76826e6003b. Hợp đồng exams đã kiểm tra ở bước V30–V32; kiểm tra lại trước sửa backend.
- Bằng chứng kiểm thử mới: Node 22.16.0, bảy script test:theme, test:api, test:overview, test:contacts, test:leads, test:exams, test:charts chạy riêng đều exit 0. `test:local` dừng tại test:source vì thiếu node_modules/typescript/bin/tsc; build dừng TS2688 (node, vite/client). Không phải kết quả nghiệm thu runtime.

## Cách đọc
1. [visual-audit.md](visual-audit.md): hình thức, component, responsive.
2. [ux-audit.md](ux-audit.md): luồng thao tác, trạng thái và điều hướng.
3. [architecture-audit.md](architecture-audit.md): state, request, performance, code quality.
4. [data-integrity-audit.md](data-integrity-audit.md): nghiệp vụ, quyền, dữ liệu xuất.
5. [final-refinement-plan.md](final-refinement-plan.md): V35–V37, phạm vi và thứ tự.
6. [release-checklist.md](release-checklist.md): nghiệm thu, bằng chứng bắt buộc.

## Phân loại
- C: xác nhận từ source; không đồng nghĩa đã tái hiện trên trình duyệt.
- R: rủi ro cần test runtime hoặc dữ liệu thật.
- D: quyết định thiết kế, không nhất thiết là bug.
- P0: chặn release (an toàn dữ liệu, quyền hoặc build); P1: chức năng hoặc tính nhất quán quan trọng; P2: polish; P3: tùy chọn.
- Các ID V/U/A/D được dùng xuyên tài liệu. Không đếm lại một nguyên nhân ở nhiều nhóm.

Phạm vi: Shell, Account/Login, Overview, Contacts, Leads, Exams, Admin, Quality, shared foundation. Marketing/Sponsorship chưa có implementation trong baseline; chỉ kiểm tra hợp đồng tích hợp. Không tự ý sửa backend, quyền hoặc feature của đồng đội.
