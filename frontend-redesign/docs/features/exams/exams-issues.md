# Audit vấn đề — Kết quả thi

P0 = sai phạm vi hoặc nguy cơ dữ liệu nghiêm trọng; P1 = sai ngữ nghĩa/tác vụ chính; P2 = UX/maintenance. C = xác nhận source; R = rủi ro cần kiểm chứng; D = đánh giá thiết kế, không khẳng định lỗi runtime. Phạm vi frontend main, không đổ lỗi cho placeholder V29. Xem README để xác định nguồn.

| ID | Mức | Loại | Bằng chứng / tác động | Hướng xử lý |
|---|---|---|---|---|
| E01 | P0 | C/R | useApi cũ giữ snapshot khi path đổi; scope có thể hiển thị kết quả trước đó | Boundary theo identity + useResource keyed path |
| E02 | P1 | C | `dataset=values.dataset??PM119` không đối chiếu danh sách dataset scoped | Chọn từ meta, PM119 nếu hợp lệ, nếu không chọn dataset khả dụng; URL sai có thông báo |
| E03 | P1 | C | FilterBar clear xóa dataset cùng filter khác | Reset lọc không đổi dataset |
| E04 | P1 | C | Không reset filter phụ thuộc dataset một cách nguyên tử | Đổi dataset reset filter/search/page/detail/export; chờ options đúng context |
| E05 | P1 | D | Tập độc lập A24/B95 đặt cạnh PM119 như lọc phổ thông | Dataset context riêng, nhãn linked/independent; không cộng tập |
| E06 | P1 | C | KPI `count` là count document, label 'Thí sinh có điểm' | 'Thí sinh trong phạm vi'; điểm TB mẫu có điểm; không dùng count làm n có điểm |
| E07 | P1 | C | Ngưỡng 600 ở filter/histogram; params có thể khác | Đọc params, thiếu thì không in ngưỡng, dùng boolean backend |
| E08 | P1 | C | Tooltip/notes Top 10% hardcode; loaders dùng top_ratio động | Dùng params, ghi rõ hạng theo bảng; tie ở cutoff có thể tăng số vào CK |
| E09 | P1 | C/R | `advanced` không tương đương có `final`; backend list không lọc final presence | Hai trạng thái riêng; không dùng advanced như round filter |
| E10 | P1 | C | `paid=false` không cung cấp trạng thái miễn phí; `is_registered_valid` không trong list | Nhãn 'Không ghi nhận đóng phí'; không suy eligibility |
| E11 | P1 | D | Biểu đồ điểm theo paid có thể gợi quan hệ nhân quả | Bỏ khỏi phân tích mặc định; nếu cần chỉ số mô tả có n, không kết luận |
| E12 | P1 | C | Hạng backend tính trong bảng trên dataset gốc | Header 'Hạng VL trong bảng'; không đánh lại theo scope/search/page |
| E13 | P1 | C | Sortable không có final.rank, board, grade, paid, certificate | Chỉ sort theo whitelist; dùng sort CK total nếu cần, không giả sort toàn tập client |
| E14 | P1 | C | CSV cố định board + qualifier.rank, không theo sort/page UI | Nói rõ xuất toàn bộ tập khớp; không gọi là bản sao bảng đang sắp |
| E15 | P1 | C | Search DataTable chỉ áp dụng list/CSV | Giữ tìm kiếm cục bộ records, chú thích phạm vi; analysis dùng filters |
| E16 | P1 | C | Histogram chỉ VL; bins floor /100 cap 9, nhãn 0–99 sai với điểm lẻ | Nhãn [0,100), ...; bin cuối 900 trở lên, cảnh báo ngoài thang nếu biết; không bịa histogram CK |
| E17 | P1 | C | Sections groups cố định A/B và 3 section keys | Lấy structure + keys thực; giữ unknown, missing pct = null |
| E18 | P1 | C | Grade percentages mẫu số mọi grade trả về nhưng legend cố định grade_order có thể bỏ unknown | Unknown/missing coverage rõ; không gán null thành Yếu |
| E19 | P1 | C | Scatter min 400 ở option cũ | Không cắt điểm; hoãn scatter vì shared Chart chỉ Line/Bar và cá nhân giả lập |
| E20 | P1 | C | `final_by_board.certificates` chỉ final.total >= threshold, khác certificate bất kỳ vòng | Không dùng thay KPI tổng; label đúng nếu hiển thị |
| E21 | P1 | C | Sections `count` đếm group entries, avg bỏ null; max thiếu => pct null | Không dùng count như số điểm hợp lệ; show unknown, không suy điểm yếu cá nhân |
| E22 | P1 | R | `apply_pii` mask email không chuẩn chỉ khi có @, giữ họ tên/trường; finalists summary trả tên trực tiếp | Không render email raw cho restricted; không dùng scatter/tên trong analysis; đánh giá policy backend riêng |
| E23 | P1 | R | CSV server không chống spreadsheet formula injection; export không ghi rõ simulated trong header | Confirmation + nhãn cảnh báo; backend backlog, chưa coi frontend là bảo mật |
| E24 | P1 | C | _id không trả trong list; Contact ID null ở A24/B95 | Key dataset+stt (kiểm tra thiếu/trùng; fallback row occurrence), không dùng contact_id |
| E25 | P1 | C | process_and_seed lấp thiếu section =0 khác loader bỏ missing | Không suy missing từ 0; provenance hạn chế; cảnh báo mô phỏng |
| E26 | P2 | D | 5 KPI + 7 charts + 1 stats table trước bảng 15 cột | Default records, lazy analysis |
| E27 | P2 | D | 10 nhóm filter xuất hiện đồng thời | Dataset riêng + 9 nhóm trong shared dialog, applied chips |
| E28 | P2 | D | Thiếu detail, nhiều cột phần thi | Bảng 5 cột nghiệp vụ + dialog hai vòng |
| E29 | P2 | D | Fixed labels/height, nhiều trường có tên dài | Container breakpoints, table alternate, giới hạn top N có giải thích |
| E30 | P2 | C/R | Boxplot nhóm n=1 tạo 5 điểm trùng; group.count gồm missing score | Không diễn giải độ phân tán; chuyển bảng thống kê group, không gọi count là n có điểm |
| E31 | P2 | D | Charts theo trường/tỉnh và bảng so sánh phân mảnh | Một breakdown selector với mean, count, certificates, finalists |
| E32 | P2 | D | CSV export ở bảng không cảnh báo ngữ cảnh giả lập | Nhãn rõ, confirmation, filename theo dataset |
| E33 | P2 | R | URL school chứa dấu phẩy vì add_in split comma | Không gửi giá trị không biểu diễn được; message và backend backlog |
| E34 | P2 | R | Scope có no dataset, options lỗi, lọc ra 0, partial score | Phân biệt 4 empty/error states; không hiển thị 0 cho missing |
| E35 | P2 | D | Legacy custom fields, filter, pager, cards | Dùng V29 primitives và V28 shared workspace; không copy legacy CSS |

## Ưu tiên
P0/P1 trước cosmetic. E22/E23 là giới hạn backend cần owner xác nhận trước production; không tuyên bố đã sửa bằng UI. Không sửa backend trong patch frontend. Kiểm chứng trên DB chạy thật trước nghiệm thu; audit source không chứng minh mọi lỗi xảy ra trong dữ liệu hiện tại.
