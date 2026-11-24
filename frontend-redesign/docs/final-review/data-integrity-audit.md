# Data Integrity & Security Audit

Frontend không phải security boundary. Các lỗi backend được chuyển cho người phụ trách; không tự sửa trong patch UI.

| ID | Mức / loại | Bằng chứng | Quyết định / tiêu chí |
|---|---|---|---|
| D01 | P0 C | `routers/leads.py:47,73,81,95–99` trả by_question, question trong JSON/CSV; `filters.py:212,215–223` không ẩn question | Backend cần redaction cả list/CSV/summary (kể cả key của aggregate); test token partner bị giới hạn. Frontend ẩn question và CSV chỉ là mitigation. |
| D02 | P1 R | `filters.py:add_search`, ExamFilters search email/full_name/school/contact_id; masking sau truy vấn | Đánh giá rò rỉ qua số lượng/kết quả tìm kiếm PII; kiểm tra chính sách quyền thực tế, không khẳng định mọi tên đều phải mask. |
| D03 | P1 R | scope_match/effective_partner; frontend admin viewing scope khác identity; quyền endpoint require_module | Test direct API 401/403, partner tampering, admin scope invalid; không dựa trên sidebar làm kiểm soát quyền. |
| D04 | P1 C | Contacts `UNPAID_REG = web_registered AND NOT paid` gồm cả miễn phí; list projection thiếu web_registered | Giữ nhãn “chưa ghi nhận đóng phí”, không gọi nợ; không gán payment_status=pending như bộ lọc tương đương. Backend cần field/filter chính xác nếu muốn drill-down. |
| D05 | P1 C | Contacts `potential_revenue = unpaid_fees`; Overview FollowUp có chú thích không phải dự báo | Giữ nguyên caveat, kiểm tra fee null/0/free; không cộng thành doanh thu thực tế. |
| D06 | P1 C | Overview `_exam_snapshot` dùng PM119, trả KPI/grades không trả params | Giữ nguồn/nhãn PM119 và không hardcode ngưỡng; Exams đọc params động. Không gộp dataset; count document không phải số đã có điểm. |
| D07 | P1 R | `ExamFilters` grade vòng loại, advanced khác final existence; rank theo dataset/board từ ETL | Test 0/null/599.9/600; tie; lọc không tính lại rank; không diễn giải đã có điểm CK từ advanced. |
| D08 | P1 R | `csv_response` dùng csv.writer, kiểm tra nội dung ô từ nguồn không tin cậy | Xác minh backend đã trung hòa spreadsheet formula injection; fixture chuỗi bắt đầu =,+,-,@, tab/CR; không thay đổi điểm/tiền số âm hợp lệ. |
| D09 | P1 C | Overview export là request độc lập, dùng scope chứ không snapshot; U02 | Cùng scope và semantics, chặn khi refreshError; mô tả report có thể mới hơn nếu DB thay đổi, không giả snapshot đồng nhất. |
| D10 | P2 C | List sort server khác CSV sort cố định theo contract từng feature | Giữ note đúng thứ tự; CSV xuất mọi record phù hợp, không chỉ trang hiện tại, không cam kết giống thứ tự sort UI. |
| D11 | P1 R | Timeline daily cohort theo first_touch/web_registered_at; paid theo ngày đăng ký | Kiểm tra UTC/ngày địa phương, ngày thiếu, lũy kế không giả ngày giao dịch; ghi đúng semantics. |
| D12 | P1 R | Marketing budget và revenue lọc khác nhau; kênh giả định; sponsor progress trung bình | Khi tích hợp đồng đội, kiểm tra ROI mẫu số 0/null, budget visibility, assumption, overlap partner; không tự cộng scope. |
| D13 | P1 R | `Exam/Lead` data giả lập và free text; CSV filename/headers | Cảnh báo dữ liệu giả lập trong UI và trước export, đề xuất metadata trong report với backend; không coi chứng chỉ là thật. |

## Fixture nghiệp vụ tối thiểu
- 1 contact chưa web; 1 đăng ký chưa trả; 1 miễn phí; 1 đã trả; 1 ngày thiếu. So KPI/funnel/list/CSV theo định nghĩa, không giả các nhóm độc lập nếu overlap.
- 3 lead cùng Contact ID + 1 dòng không mã: 4 lượt, 1 liên hệ có mã; trạng thái đối soát unknown; question chứa dữ liệu cá nhân thử nghiệm.
- 2 dataset khác nhau có STT 1; 2 bảng cùng rank 1; điểm VL 0, null, 599.9, CK 620; advanced=true final=null; metadata threshold thay đổi. Giữ nguồn gốc, không làm tròn sai ngưỡng.
- Dữ liệu partner overlap; quyền có/không PII; admin viewing DN không đổi identity. Kiểm tra API trực tiếp, không chỉ browser UI.

P0 D01 cần giải quyết hoặc release chỉ dùng dataset giả lập không có thông tin cá nhân thật, với phạm vi và giới hạn được công bố rõ; không tuyên bố bản production an toàn khi còn lỗ hổng.
