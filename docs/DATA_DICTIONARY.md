# DATA DICTIONARY & BUSINESS RULES CATALOG (SINGLE SOURCE OF TRUTH)
## DỰ ÁN: PYTHON MASTER ADMISSIONS BI & DATA PLATFORM 2026

* **Phiên bản:** 2.0 (Cập nhật chuẩn hóa theo phản biện của Mentor)
* **Chủ trì nghiệp vụ (Lead BA):** Ban Phân tích Nghiệp vụ Nhóm 4
* **Chủ trì kỹ thuật (Data Lead):** Ban Kỹ nghệ Dữ liệu Nhóm 4
* **Định dạng file Master Data:** `data/master/schools_master.csv` (UTF-8)

---

## 1. MÔ HÌNH CLIENT & PHÂN QUYỀN TRUY CẬP (CLIENT / TENANT MODEL)

### 1.1. Phân định khái niệm
* **Client (Tenant / Tổ chức sử dụng hệ thống):** Pháp nhân ký kết hợp tác sử dụng Dashboard.
  * `NEU`: Trường Đại học Kinh tế Quốc dân (Đơn vị chủ trì / tuyển sinh Bảng B & ĐH).
  * `NH`: Trường THPT Chuyên Nguyễn Huệ (Trường đối tác nguồn Bảng A).
  * `DN`: Doanh nghiệp (Đối tác doanh nghiệp / Nhà tài trợ tiếp cận nguồn nhân tài lập trình).
  * `THPT`: Khối trường THPT.
  * `DH`: Khối trường Đại học.
  * `INFO`: Kênh đối tác trường (UTM `partner=info`).
  * `METAADS`: Kênh quảng cáo Meta Ads.
  * `MIENNAM`: Khu vực miền Nam.
* **School (Đơn vị đào tạo của thí sinh):** Thuộc tính nhân khẩu học của thí sinh, tra cứu và chuẩn hóa theo `data/master/schools_master.csv`.
* **Mối quan hệ đa chiều:** Một thí sinh có thể đồng thời thuộc phạm vi của nhiều Client (`authorized_clients`). Ví dụ học sinh trường THPT Chuyên Nguyễn Huệ nộp hồ sơ vào NEU sẽ được xem bởi cả Client `NH` và Client `NEU`, đồng thời kết quả thi đạt chứng chỉ sẽ được Client `DN` tiếp cận (thông tin cá nhân PII được bảo vệ bằng mặt nạ hóa).

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES) & CHỈ SỐ KPI

### 2.1. Quy tắc Thanh toán (`paid` vs `is_registered_valid`)
* **Định nghĩa trạng thái thanh toán:**
  * `payment_status`: Nhận các giá trị chuẩn hóa: `"Đã thanh toán"`, `"Miễn phí"`, `"Chưa thanh toán"`.
  * `is_paid_monetary` (`paid`): Giá trị Boolean (`True` khi và chỉ khi `payment_status == "Đã thanh toán"`). Đây là căn cứ duy nhất để ghi nhận **Doanh thu phát sinh thực tế**, **Tỷ lệ chuyển đổi trả phí (Paid Conversion Rate)** và tính toán **ROI / CPA**.
  * `is_registered_valid`: Giá trị Boolean (`True` khi `payment_status` thuộc `("Đã thanh toán", "Miễn phí")`). Dùng để đo lường **Quy mô thí sinh hợp lệ** tham gia kỳ thi.
* **Quy tắc tính doanh thu:**
  $$\text{Doanh thu} = \sum (\text{Lệ phí ghi nhận}) \quad \text{cho các bản ghi có } \texttt{paid} = \text{True}$$

### 2.2. Quy tắc Phân bổ Kênh (Attribution Rules)
* **First-touch Attribution (`channel_base`):** Kênh tiếp xúc đầu tiên ghi nhận từ form đăng ký gốc hoặc nguồn UTM đầu tiên. Sử dụng cho Báo cáo Vận hành Tuyển sinh và Phễu chuyển đổi CRM.
* **Final Attribution (`channel`):** Kênh ghi nhận cuối cùng trước khi chuyển đổi. Sử dụng cho Báo cáo Tài chính và Phân bổ Chi phí.
* **Tách bạch số liệu Thực tế và Mô phỏng (Scenario Testing):**
  * *Actual:* Chỉ tính trên các kênh có phát sinh chi phí và số liệu thật (Website, Facebook Ads, Đối tác trường).
  * *Simulation:* Các kênh giả định (Google, TikTok, Email, Zalo) được gắn nhãn `channel_is_assumed = True` để thử nghiệm kịch bản ngân sách.

### 2.3. Quy tắc Đạt Chứng chỉ & Phân hạng (COS Pro Exams)
* **Các vòng thi:**
  * `VL`: Vòng loại (Qualifier Round).
  * `CK`: Chung kết (Final Round).
* **Công thức Đạt chứng chỉ:**
  $$\text{Đạt chứng chỉ} \iff \max(\text{Tổng điểm VL}, \text{Tổng điểm CK}) \ge \text{certificate\_threshold}$$
  * `certificate_threshold` là tham số cấu hình động nạp từ `meta.exam.params`, giá trị mặc định: `600.0`.
* **Xếp loại:**
  * $\ge 800$ điểm: Giỏi (Excellent).
  * $\ge 650$ điểm: Khá (Good).
  * $\ge 500$ điểm: Trung bình (Average).
  * $< 500$ điểm: Yếu.
* **Vào Chung kết:** Top 10% thí sinh có điểm Vòng loại cao nhất trong từng Bảng (`n_final = ceil(len(group) * top_ratio)`).

### 2.4. Chính sách Chiết khấu / Hoa hồng 2% (Commission Assumption)
* **Trạng thái:** Giả định nghiệp vụ (Business Assumption).
* **Mục đích:** Kiểm thử mô hình dòng tiền đối tác giới thiệu học viên/thí sinh.
* **Quy tắc:** Khi triển khai Production, tham số này sẽ được thay thế bằng tỷ lệ quy định tại Hợp đồng đại lý / Văn bản hợp tác chính thức.

---

## 3. TỪ ĐIỂN DỮ LIỆU CÁC COLLECTION TRONG MONGODB

### 3.1. Collection `contacts` (Hồ sơ vàng CRM)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Diễn giải & Quy tắc |
| :--- | :--- | :---: | :--- |
| `_id` | String | Có | Khóa chính, mã định danh liên hệ duy nhất (VD: `PT-001`) |
| `contact_id` | String | Có | Mã hồ sơ liên hệ, dùng liên kết đa nguồn |
| `full_name` | String | Có | Họ và tên đã chuẩn hóa viết hoa đầu từ |
| `email` | String | Không | Email chuẩn hóa (viết thường, trim khoảng trắng) |
| `phone` | String | Không | Số điện thoại chuẩn hóa 10 chữ số |
| `board` | String | Có | Bảng thi: `Bảng A` (13-18 tuổi), `Bảng B` (19-24 tuổi) |
| `school` | String | Có | Tên trường đã chuẩn hóa theo Master Data |
| `school_type` | String | Có | Phân loại trường: `THPT`, `Đại học / Học viện`, `Chưa phân loại` |
| `school_id` | String | Không | Mã định danh trường (VD: `NEU`, `NH`, `PTIT`...) |
| `province` | String | Không | Tỉnh/thành phố chuẩn hóa |
| `region` | String | Có | Miền: `Miền Bắc`, `Miền Trung`, `Miền Nam`, `Chưa rõ` |
| `payment_status`| String | Có | `Đã thanh toán`, `Miễn phí`, `Chưa thanh toán` |
| `paid` | Boolean | Có | `True` nếu nộp tiền thực tế (`is_paid_monetary`) |
| `is_paid_monetary`| Boolean | Có | Cờ thanh toán tiền mặt/chuyển khoản thực tế |
| `is_registered_valid`| Boolean | Có | Cờ đăng ký hợp lệ (gồm cả diện miễn phí/học bổng) |
| `revenue` | Float | Có | Lệ phí thực thu ghi nhận (VND) |
| `channel_base` | String | Có | Kênh tiếp xúc đầu tiên (First-touch) |
| `channel` | String | Có | Kênh ghi nhận cuối cùng (Final attribution) |
| `channel_is_assumed`| Boolean | Có | `True` nếu thuộc kênh phân bổ giả định |
| `first_touch` | DateTime | Không | Thời điểm tiếp xúc đầu tiên ghi nhận |
| `partners` | Array[String]| Có | Danh sách Client được quyền truy cập dòng dữ liệu này |

### 3.2. Collection `exam_candidates` (Thí sinh thi lập trình)
| Tên trường | Kiểu dữ liệu | Diễn giải & Quy tắc |
| :--- | :--- | :--- |
| `_id` | String | Mã thí sinh kỳ thi (VD: `PM119:001`) |
| `dataset` | String | Bộ dữ liệu: `PM119` (119 thí sinh chính thức), `A24`, `B95` |
| `contact_id` | String | Mã liên kết với hồ sơ CRM (nếu có) |
| `school` | String | Tên trường đã chuẩn hóa |
| `school_type` | String | `THPT` hoặc `Đại học / Học viện` |
| `qualifier` | Object | Điểm Vòng loại: `level`, `sections`, `total`, `rank`, `grade` |
| `final` | Object | Điểm Chung kết: `level`, `sections`, `total`, `rank`, `grade` |
| `advanced` | Boolean | `True` nếu lọt vào Top vào Chung kết |
| `best_total` | Float | Điểm cao nhất giữa Vòng loại và Chung kết |
| `certificate` | Boolean | `True` nếu `best_total >= certificate_threshold` |
| `partners` | Array[String]| Danh sách Client được xem kết quả (`DN` luôn có quyền) |

### 3.3. Collection `channel_budgets` (Ngân sách & Hiệu quả kênh)
| Tên trường | Kiểu dữ liệu | Diễn giải & Quy tắc |
| :--- | :--- | :--- |
| `_id` | String | Tên kênh (`Website`, `Facebook`, `Đối tác trường`...) |
| `budget` | Float | Ngân sách chi cho kênh (VND) |
| `clicks` | Float | Lượt click/truy cập |
| `ctr` | Float | Tỷ lệ Click-through rate (%) |
| `is_assumed` | Boolean | Cờ phân biệt số liệu thực tế hay giả định kịch bản |
| `report` | Object | Kết quả hiệu quả: `unique_contacts`, `paid`, `revenue`, `roi` |
| `partners` | Array[String]| Client phụ trách kênh (VD: `METAADS`, `INFO`) |

---

## 4. QUY TRÌNH SO KHỚP ĐỊNH DANH (IDENTITY RESOLUTION)
1. **Tiền xử lý:** Chuẩn hóa toàn bộ SĐT về dạng 10 chữ số chuẩn `0xxxxxxxxx`, email viết thường, họ tên viết hoa chuẩn.
2. **Khớp chính xác phân tầng (Hierarchical Matching):**
   * *Ưu tiên 1:* Khớp `email` (hoặc `cccd` nếu có).
   * *Ưu tiên 2:* Khớp `phone` + `full_name` (chống trùng SĐT phụ huynh/người thân).
   * *Ưu tiên 3:* Khớp `full_name` + `school_id` + `dob`.
3. **Fuzzy Matching:** Chỉ áp dụng để sinh danh sách cảnh báo `potential_duplicates` cho Quản trị viên duyệt thủ công, không tự động gộp để tránh rủi ro sai lệch dữ liệu.
