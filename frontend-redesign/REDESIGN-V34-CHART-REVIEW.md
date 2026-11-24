# V34 — Chart consistency & pre-final review

Baseline: workspace V33 (`neu-dashboard-v32-to-v33.patch` đã áp dụng). Phạm vi audit: Tổng quan, Liên hệ & chuyển đổi, Lead từ biểu mẫu, Kết quả thi, Chất lượng dữ liệu; kiểm tra các thành phần bảng và trạng thái liên quan. Marketing/Sponsorship trong snapshot này vẫn là placeholder; không kết luận về code của đồng đội. Không thay đổi backend hoặc dependencies.

## 1. Inventory biểu đồ và quyết định

Có 8 cấu hình ECharts, 9 vị trí hiển thị vì GradeDistribution dùng ở 2 màn hình. Các thanh tỷ lệ CSS là một nhóm trực quan hóa khác, không phải cột trên hệ tọa độ.

| Màn hình | Biểu đồ | V33 | V34 |
|---|---|---|---|
| Tổng quan CRM | Hoạt động tuyển sinh | Đường liền, legend HTML riêng | Legend chung, đường 3px, giữ dữ liệu/ngày |
| Tổng quan Exam | Xếp loại VL | Cột ngang radius 5px, legend tĩnh | Cột ngang cap 4px, legend chung |
| Contacts | Đăng ký web theo ngày | Stacked vuông, legend scroll canvas, màu paid khác Overview | Bo cap trên cùng, legend wrap, paid tertiary |
| Contacts | Phân bố & chuyển đổi | Stacked ngang vuông, nhãn dài dễ cắt | Bo cap cuối, width nhãn theo host, legend wrap |
| Leads | Đối soát theo nguồn | Stacked ngang vuông, màu theo index, khác thanh tỷ lệ | Cap cuối, vai trò màu cố định, bảng nguồn khi nhiều nhóm không phân biệt được |
| Leads | Dòng lead theo tuần | Stacked vuông, màu theo index | Cap trên cùng, màu Talkshow/FB cố định, tick budget phù hợp |
| Leads | Phân bố dòng lead | Cột ngang vuông | Cap cuối, nhãn theo host |
| Exams | Histogram VL | Stacked vuông, nhãn khoảng điểm dài | Cap trên cùng, giảm nhãn ở host hẹp |
| Exams | Xếp loại VL/CK | Cột ngang radius 5px | Cùng GradeDistribution với Overview; tăng chiều cao theo số nhóm |
| Overview/Contacts | Phễu, tiến độ tài trợ | Track 12/14px | Track pill 12px, màu giai đoạn thống nhất |
| Leads | Tỷ lệ đối soát | Track 14px, màu khác chart | Track 12px, cùng vai trò màu kết quả |
| Exams | Tỷ lệ phần thi | Track 10px | Track 12px |
| Quality | Phân bố vấn đề | Track 9px, ép phần khác 0 tối thiểu 2% | Track 12px, tỷ lệ đúng count/max; không vẽ khi count sai |

## 2. Chart foundation

- `Chart.tsx` chịu trách nhiệm lifecycle, resize, theme, legend, styling và thông báo lỗi. Feature vẫn chịu trách nhiệm cấu hình dữ liệu và ý nghĩa nghiệp vụ.
- `chart-style.ts`: radius 4px. Cột ngang bo đầu phải, cột đứng bo đầu trên, baseline vuông. Với stack chỉ đoạn dương cuối cùng được bo theo từng category. Không áp dụng hình dạng này cho dữ liệu âm hoặc vector chưa được hỗ trợ. Không đổi value, giữ null/zero, không sửa input. Tắt series tính lại cap dựa trên series còn thấy.
- `ChartLegend.tsx`: legend HTML ngoài canvas, text 14px, target 44/48px, aria-pressed, wrap nhãn dài, luôn giữ ít nhất một series. Một series vẫn có nhãn. Bảng số liệu luôn giữ toàn bộ dữ liệu; ẩn series chỉ tác động đồ thị. Tập tên series thay đổi thì reset lựa chọn.
- Grid nhẹ, value axis không vạch trục thừa, font 11px compact / 12px regular, nhãn nhóm 72/104/140/180px theo chart host. Nhãn ngày/tuần/khoảng điểm giảm mật độ, không lấy mẫu data point ngoài giới hạn đã công bố của Leads (52 tuần cuối). Số liệu đầy đủ trong bảng.
- Tooltip HTML mặc định ECharts, không có custom HTML formatter; giới hạn chiều rộng theo tier, confine, radius 12px, wrap; tap trên compact. Cần kiểm tra runtime nội dung rất dài và escaping mặc định. Touch-action pan-y áp dụng chart hiện tại (không có zoom/pan).
- Không dùng decal, giữ ARIA, legend có chữ, bảng thay thế. Motion chỉ entrance 180ms, không replay animation khi đổi theme, toggle series hoặc resize; reduced motion tắt animation.
- Radius panel chính 24px desktop / 20px compact trong các feature liên quan; panel spacing 20px desktop / 16px compact (12px ở một số vùng rất hẹp). KPI shapes có chủ đích được giữ. Chart data table radius 16px. Track tỷ lệ 12px dạng pill khác với bar chart 4px, vì khác ngữ nghĩa.
- Màu theo theme: contacts = on-secondary-container, đăng ký = primary, đóng phí = tertiary. Talkshow = primary, FB = tertiary. Đối soát: mới = primary, đã có website = tertiary, trùng = secondary, khác = on-secondary-container. Bảng A/B = primary/tertiary. Nếu nhóm Leads vượt số màu phân biệt được, hiển thị bảng thay vì các màu trùng nhau. Không gộp nhãn nguồn khác nhau vào một dữ liệu mới.

## 3. Lỗi khác đã sửa (source-confirmed)

| Mức | Vấn đề | Thay đổi |
|---|---|---|
| Cao | Legend ẩn/hiện stacked có thể làm mất rounded cap nếu cap gắn cứng vào series cuối | Tính cap theo dữ liệu dương đang hiện, test 7 mask |
| Cao | Contacts/Leads không có dữ liệu nhưng vẫn có pager 0/0 và thao tác xóa lọc ngay cả khi chưa lọc | Phân biệt không có dữ liệu / không có kết quả; chỉ hiện reset khi có điều kiện; không render pager khi total=0; vô hiệu CSV rỗng |
| Cao | Quality ép thanh nhỏ lên 2% | Bỏ ngưỡng tối thiểu, kiểm tra count hợp lệ |
| Trung bình | Overview table th hàng ngày căn phải trong khi header ngày căn trái | Cả hai cùng căn trái |
| Trung bình | Numeric headers và cells trong bảng phân tích mặc định căn trái | Numeric/rate/money căn phải, tên nhóm căn trái; cùng data-align ở hai phía |
| Trung bình | Bảng thi Contacts, ngày gửi/đối soát Leads chưa đồng nhất với V33 | Căn giữa nhãn ngắn bằng RecordColumn.align; văn bản dài vẫn trái |
| Trung bình | Grade chart là count nhưng note chỉ mô tả tỷ trọng | Nêu rõ chart count; tỷ trọng trong bảng số liệu |
| Thấp | Contacts Daily nút bảng có thể hiện cả khi toàn bộ registration bằng 0 | Chỉ hiện switch nếu có dữ liệu biểu đồ (các count đều 0 không cần plot) |
| Thấp | Canvas lỗi giữ một vùng trống có chiều cao lớn | Thông báo ngắn, canvas ẩn không chiếm luồng layout |

## 4. Cần xác nhận trước Final Product Review

Các điểm sau là rủi ro hoặc yêu cầu nghiệm thu, chưa phải lỗi đã tái hiện trong runtime:

- Run full build trước: `npm run build`; `npm run test:local` gồm full source compiler gate, không bỏ qua nếu thất bại.
- ECharts thật: 1/2/3/4 series; stacked có segment 0, toggle series trên/dưới; đổi palette cả 5 seed ở light/dark; verify tooltip không tràn, tên đầy đủ (bao gồm ký tự `<>&` và dấu tiếng Việt), giá trị 0/null, không làm sai tổng. Kiểm tra outline focus, Enter/Space, aria-pressed, màu khi Bảng B hoặc FB đứng một mình.
- Resize sidebar và zoom 200%, host 200–339px, 340–479px, 480–679px, 680–999px, >=1000px. Kiểm tra axis labels không chồng, bar không clip, touch vertical scroll không bị chart chặn; bảng số liệu đọc được. Thử 365+ ngày và nhãn trường dài, >=10 nhóm, phân bố không có dữ liệu, API lỗi và retry. Kiểm tra histogram `≥ 900` không hiểu là dữ liệu vượt thang điểm hợp lệ; backend vẫn cần validate điểm.
- Kiểm tra trạng thái tải, scope đổi trong lúc refresh/export, lỗi kết nối và request race. Đối chiếu KPI/list/CSV thật, không dùng fixture để kết luận số DB. CSV download có đúng quyền và scope; backend PII của Leads còn là vấn đề đã ghi trong V23.
- Admin, Quality và Theme Studio: tabs/dirty-state, dialog mutation busy guard, keyboard, density, SystemSelect native form contexts chưa chuyển đồng loạt. Không thay thế các component có tác vụ ghi ở patch này.
- Marketing/Sponsorship: khi merge phần đồng đội cần inventory chart thật, áp dụng chart foundation hoặc adapter, không giả định các biểu đồ đó đã qua audit. Kiểm tra quyền, scope và báo cáo giả định ROI.

## 5. Kiểm thử đã thực hiện

- 6 nhóm logic test: Overview, Contacts, Leads, Exams, theme, API đều pass.
- `test:charts`: 7 visibility masks × 2 hướng cột; zero/null, dữ liệu không bị mutate, unsupported negative bars, object data metadata, theme roles, axis formatter/tick budget. Strict typecheck hai helper thuần TS thành công.
- 112 module: transpile syntax và resolve local imports bằng TypeScript có sẵn. Không phải full TS compiler gate.
- Chromium HTML/CSS fixtures: 140 tổ hợp chart legend/meter, 28 bảng căn chỉnh, 14 viewport 320–1920px, light/dark đại diện, giảm width để mô phỏng sidebar. Không có overflow legend/page trong fixture. Không render canvas ECharts/React thực tế.
- Full build thử nhưng fail vì thiếu type definitions `node`, `vite/client` trong workspace. Chưa thể xác nhận runtime ECharts, Base UI, backend live, tất cả theme hoặc accessibility thực tế. Không đánh dấu các mục đó pass.
- Không sửa backend, package-lock, route, scope hoặc màn hình đồng đội. `test:charts` được thêm vào package scripts (không thêm dependency).
