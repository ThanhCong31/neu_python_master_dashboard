# NEU Admissions BI - Dashboard có đăng nhập và phân quyền theo đối tác

- **Backend:** Python · FastAPI · PyMongo (`backend/`)
- **Frontend:** React · TypeScript · Vite · ECharts. Giao diện hiện tại ở `frontend-redesign/`, giao diện cũ ở `frontend/`.
- **CSDL:** MongoDB (`MONGO_URI`, `MONGO_DB_NAME` trong `.env`)
- **Dữ liệu trình diễn:** ZIP bản nộp chứa hai workbook giả lập trong `data/` và danh mục trường trong `data/master/`. Dữ liệu giả lập được tạo riêng cho việc trình diễn, nên các số liệu có thể khác bộ dữ liệu nhóm đã dùng khi lập báo cáo.

## Chạy bản nộp

### Dùng lại MongoDB đang có dữ liệu

Giải nén ZIP vào thư mục mới. Chép `.env` của bản đã chạy được vào thư mục gốc `neu_python_master_dashboard`, ngang hàng với `backend/`. Giữ nguyên `MONGO_URI` và `MONGO_DB_NAME`. `SEED_PARTNER_PASSWORD` là biến dùng chung cho tài khoản đối tác được tạo bằng seed và qua trang quản trị.

```powershell
cd backend
uv sync --locked
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Giữ cửa sổ PowerShell mở. Kiểm tra `http://127.0.0.1:8000/api/health`, sau đó mở `http://127.0.0.1:8000`. Gói nộp đã kèm giao diện build sẵn. Khi dùng lại database đã có dữ liệu và tài khoản, chỉ cần khởi động ứng dụng.

### Trình diễn trên database mới

1. Từ thư mục gốc, chạy `Copy-Item .env.example .env`. Điền URI MongoDB hợp lệ, đặt `JWT_SECRET` ngẫu nhiên từ 32 ký tự và đặt hai mật khẩu seed. Dùng tên database riêng, chẳng hạn `MONGO_DB_NAME=neu_admissions_demo`.
2. Giữ hai workbook giả lập `Demo_Data_khách_hàng.xlsx` và `Diểm giả lập.xlsx` trong `data/`. Bản ZIP chứa sẵn hai tệp này. Nếu chỉ lấy mã từ GitHub, lấy hai tệp từ ZIP bản nộp.
3. Chạy từ thư mục `backend`:

   ```powershell
   uv sync --locked
   uv run python -m etl.seed --skip-data
   uv run python -m etl.process_and_seed
   uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

4. Mở `http://127.0.0.1:8000` và đăng nhập bằng tên `admin` với mật khẩu đã đặt trong `SEED_ADMIN_PASSWORD`. Các hồ sơ mẫu cho báo cáo tháng có dữ liệu tháng 8 và tháng 9 năm 2026.

Lệnh `etl.process_and_seed` thay dữ liệu nghiệp vụ trong database đang cấu hình và ghi lại workbook điểm. Dùng database trình diễn riêng. Nếu PowerShell đã đặt `MONGO_URI`, biến đó được ưu tiên hơn giá trị trong `.env`.

Khi cần chạy giao diện phát triển, mở cửa sổ PowerShell thứ hai, chạy `npm ci` và `npm run dev` tại `frontend-redesign`, rồi mở `http://localhost:5174`. Yêu cầu môi trường nằm trong `backend/pyproject.toml` và `frontend-redesign/package.json`.

### Thử tạo, cấp quyền và giới hạn dữ liệu

1. Vào **Quản trị → Đối tác & quyền → Thêm đối tác** rồi chọn **Loại đối tác**.
   - **Trường học**: chọn một trường trong danh mục có hồ sơ liên hệ hoặc thí sinh khớp mã trong MongoDB. Tên và loại trường lấy từ danh mục. Mã đối tác điền sẵn theo mã trường và có thể chỉnh. Trường được chọn là phạm vi ban đầu.
   - **Nhà tài trợ**, **Doanh nghiệp hợp tác** hoặc **Khác**: nhập mã, tên tổ chức và mô tả nếu cần. Với **Khác**, điền thêm loại tổ chức. Các nhóm này có thể tạo khi chưa có dữ liệu nghiệp vụ. Phạm vi ban đầu trống để quản trị viên cấp riêng sau khi tạo.
   - Tất cả các loại đều được tạo kèm tài khoản với mật khẩu lấy từ `SEED_PARTNER_PASSWORD` trong `.env`. Hộp thoại hiển thị mật khẩu khởi tạo sau khi tạo thành công.
2. Để bổ sung hoặc thu hẹp dữ liệu, chọn đối tác rồi mở **Cấu hình phạm vi**. Tra cứu bằng mã hoặc tên trường ở từng nhóm THPT và Đại học. **Chọn tất cả** chỉ áp dụng cho kết quả đang hiện trong nhóm đó. Cũng có thể bổ sung mã hồ sơ từ trang **Liên hệ**. Hai điều kiện được gộp theo HOẶC. Phạm vi để trống không cấp bản ghi nào.
3. Bật các mục **Tổng quan**, **CRM & phễu tuyển sinh** và/hoặc **Lead Talkshow & Facebook** tùy quyền thực tế. Bật **Cho phép xuất và tải báo cáo** nếu đối tác được phép xuất. Lưu và xác nhận.
4. Trong tab **Tài khoản**, có thể tạo thêm người dùng nếu cần nhiều tài khoản cho cùng đối tác. Kiểm tra đối tác cũng xuất hiện ở thanh chọn phạm vi của admin. Đăng nhập với tài khoản thử để kiểm tra danh sách, tìm kiếm và CSV chỉ trả bản ghi được cấp.
5. Thử khóa đối tác. Tài khoản đối tác bị chặn ở lần gọi API tiếp theo. Mở khóa để khôi phục quyền đăng nhập.

Đối tác cũ tiếp tục dùng phạm vi theo thẻ ETL đến khi admin lưu cấu hình mới. Việc lưu phạm vi mới thay toàn bộ thẻ ETL cũ cho đối tác đó. Bản ghi theo trường dựa trên `school_id` đã chuẩn hóa. Với mã hồ sơ cấp trực tiếp, hệ thống đối chiếu cả email định danh trong MongoDB để tránh cấp nhầm khi nạp lại và mã `PT-…` được tái sử dụng. Lead và điểm thi liên kết qua CRM cũng đối chiếu mã liên hệ kèm email. Các cấu hình mới chưa có quy tắc cấp ngân sách hay dữ liệu quyền lợi theo chương trình, nên các bản ghi này không tự được cấp. Đối tác cũ vẫn dùng các nhóm phân quyền đã seed. Chọn và rà soát dữ liệu của NEU/NH trước khi chuyển sang phạm vi mới.

### Thử báo cáo theo kỳ và tải lại bản đã chốt

1. Vào **Tổng quan → Xuất báo cáo**, chọn **Báo cáo theo tháng**, **Báo cáo theo quý** hoặc **Báo cáo theo giai đoạn**. Admin chọn đối tác. Tài khoản đối tác chỉ lập báo cáo cho tổ chức của mình.
2. Chọn kỳ và bấm **Xem trước**. Với tháng hoặc quý, so số đăng ký với `web_registered_at` và số dòng lead với `created_at` trong cùng phạm vi. Tình trạng đóng phí là trạng thái CRM hiện tại của nhóm đăng ký đó. Nếu nguồn chỉ ghi `completed` cho cả người trả tiền và miễn phí, cần sửa dữ liệu nguồn để báo cáo tách đúng.
3. Bấm **Chốt báo cáo** rồi tải PDF, Word hoặc Excel ngay ở khối xác nhận phía trên bản xem trước. Số liệu các tệp phải khớp bản xem trước và giá trị đếm trong Excel là kiểu số. Mở lại báo cáo tháng và tải lại từ lịch sử để lấy đúng bản đã lưu. Nếu dữ liệu thay đổi giữa xem trước và chốt, hệ thống yêu cầu xem trước lại. Chốt lại cùng số liệu và phạm vi sẽ dùng cùng phiên bản.
4. Thử xuất bằng tài khoản của một đối tác khác, hoặc tài khoản đã bị thu hồi quyền xuất. Admin vẫn xem được báo cáo cũ của đối tác từ lịch sử. Sau thay đổi phân quyền hoặc phạm vi, tài khoản đối tác chỉ thấy bản chốt thuộc cấu hình quyền hiện hành.

Riêng **Báo cáo theo giai đoạn**, chọn mốc từ lịch chương trình 2026. Đăng ký và nộp lệ phí tính các hồ sơ có ngày trước 12:00 ngày 25/09/2026. Vòng loại và vòng chung kết dùng điểm của từng vòng trong bộ giả lập PM119. Mốc công bố kết quả tổng hợp điểm và số thí sinh được đánh dấu vào chung kết, với lịch ghi “Sau vòng loại”. Cần quyền **Kết quả thi** cho ba mốc sau đăng ký. Để tải các báo cáo theo khoảng ngày từng chốt ở phiên bản cũ, mở **Báo cáo khoảng ngày đã lưu** trong cùng hộp thoại.

Báo cáo gồm số đăng ký, trạng thái đóng phí của nhóm đăng ký, và số dòng lead tùy quyền module. Mốc giả định do bản ETL cập nhật tạo ra không tính vào kỳ. Nếu DB đã được nạp bằng ETL hai file cũ, hãy xác minh các ngày thay thế trước khi chốt, hoặc thử nạp phiên bản mới trên bản sao. Dữ liệu hiện có chưa đủ để tính tiền thực thu, ngân sách, điểm thi và quyền lợi nhà tài trợ phát sinh theo tháng. Báo cáo tổng quan dùng số liệu của màn hiện tại, chọn qua **Tổng quan hiện tại** trong cùng menu.

Kiểm thử tích hợp trên MongoDB dành riêng cho kiểm thử. Tài khoản kết nối cần quyền tạo và xóa database thử. Bộ kiểm thử chỉ thao tác trên database `neu_test_…` do nó tự tạo.

```powershell
cd backend
$env:NEU_TEST_MONGO_URI = 'mongodb://127.0.0.1:27017'
uv run pytest -q test_partner_monthly.py
```


## Chạy với giao diện cũ và bộ sáu workbook

```bash
# 1. Backend
cp .env.example .env   # điền MONGO_URI, JWT_SECRET, SEED_*_PASSWORD
cd backend
uv sync
uv run python -m etl.seed            # đọc Excel → đối soát → ghi MongoDB + tạo đối tác & tài khoản
uv run uvicorn app.main:app --port 8000

# 2. Frontend (dev, proxy /api → :8000)
cd frontend
npm install
npm run dev                          # http://localhost:5173

# Hoặc build rồi để FastAPI phục vụ luôn giao diện ở http://localhost:8000
npm run build
```

Các tuỳ chọn nạp dữ liệu:

| Lệnh | Tác dụng |
|---|---|
| `uv run python -m etl.seed --dry-run` | Chỉ đọc Excel và in bảng đối soát, không ghi DB |
| `uv run python -m etl.seed --skip-data` | Chỉ tạo/cập nhật đối tác và tài khoản |
| `uv run python -m etl.seed --reset-passwords` | Đặt lại mật khẩu mặc định cho các tài khoản mặc định |

Muốn chạy với MongoDB khác mà không sửa `.env`: `MONGO_URI=mongodb://localhost:27017 uv run ...` (biến môi trường được ưu tiên hơn `.env`).

> **MongoDB Atlas:** cluster chỉ nhận kết nối từ IP có trong *Network Access*. Nếu gặp lỗi
> `SSL handshake failed … TLSV1_ALERT_INTERNAL_ERROR` thì cần thêm IP máy chạy vào allowlist, rồi chạy lại `etl.seed`.

## Tài khoản mặc định

Mật khẩu ban đầu lấy từ `SEED_ADMIN_PASSWORD` (admin) và `SEED_PARTNER_PASSWORD` (đối tác) trong `.env` — không ghi trong repo. **Đổi ngay sau lần đăng nhập đầu** (menu *Đổi mật khẩu*).

| Tài khoản | Đối tác | Mục được xem |
|---|---|---|
| `admin` | — (quản trị) | Tất cả + Quản trị & phân quyền |
| `dn` | DN · Doanh nghiệp | Tổng quan, Kết quả thi, Nhà tài trợ & truyền thông |
| `thpt` | THPT · Trường THPT | Tổng quan, CRM, Lead, Kết quả thi |
| `dh` | DH · Trường Đại học | Tổng quan, CRM, Lead, Kết quả thi |
| `info` | INFO · Đối tác trường | Tổng quan, CRM, Kênh & ROI, Lead, Kết quả thi |
| `metaads` | METAADS · Meta Ads | Tổng quan, CRM, Kênh & ROI, Lead, Kết quả thi |
| `miennam` | MIENNAM · Miền Nam | Tổng quan, CRM, Kênh & ROI, Lead, Kết quả thi |

Admin tạo thêm tài khoản (nhiều tài khoản cho 1 đối tác), khoá/mở khoá, đặt lại mật khẩu, bật/tắt mục dashboard và quyền xem thông tin cá nhân của từng đối tác trong trang **Quản trị & phân quyền**. Admin cũng có ô **Phạm vi dữ liệu** trên thanh trên cùng để xem dashboard đúng như một đối tác nhìn thấy.

## Phân quyền

Hai lớp, đều kiểm tra ở server (gọi API trực tiếp cũng không vượt được):

1. **Module** — mỗi đối tác có danh sách mục dashboard (`partners.modules`); API trả 403 nếu không có quyền.
2. **Dòng dữ liệu** — đối tác dùng phạm vi đã cấu hình được lọc theo mã trường và hồ sơ đã gán. Đối tác cũ chưa lưu phạm vi riêng vẫn được lọc theo mảng `partners` do ETL gắn.

| Mã | Dữ liệu được xem |
|---|---|
| DN | Toàn bộ kết quả thi (nguồn nhân tài), quyền lợi nhà tài trợ, hiệu quả kênh truyền thông. Không xem CRM |
| THPT | Liên hệ/lead/điểm thi thuộc **Bảng A** (13–18 tuổi) |
| DH | Liên hệ/lead/điểm thi thuộc **Bảng B** (19–24 tuổi) |
| INFO | Liên hệ gán kênh **Đối tác trường** (UTM `partner=info`) + ngân sách/ROI kênh này |
| METAADS | Liên hệ kênh **Facebook** (UTM `partner=metaads` hoặc có FB Lead Form), toàn bộ lead FB, ngân sách/ROI Facebook |
| MIENNAM | Liên hệ có UTM `partner=miennam`, ở tỉnh/thành miền Nam hoặc thi tại điểm TP.HCM; điểm thi thí sinh miền Nam |

Thông tin cá nhân (email, SĐT) được che và CCCD/ngày sinh/ghi chú bị ẩn với tài khoản đối tác, trừ khi admin bật *Xem thông tin cá nhân*.

Bảo mật khác: mật khẩu băm bcrypt; phiên là JWT trong cookie `HttpOnly`/`SameSite=Lax` (đặt `COOKIE_SECURE=true` khi chạy HTTPS); khoá tạm 5 phút sau 5 lần đăng nhập sai; đổi/đặt lại mật khẩu hoặc khoá tài khoản sẽ vô hiệu mọi phiên cũ; nhật ký đăng nhập & thao tác quản trị lưu ở `audit_logs`.

## Dữ liệu trong MongoDB

| Collection | Nguồn | Số bản ghi |
|---|---|---|
| `raw_web_signups`, `raw_talkshow`, `raw_fb_leads` | Booklet 1 — dữ liệu thô giữ nguyên | 132 · 28 · 31 |
| `contacts` | Booklet 2 Master_Contacts + kênh attribution + điểm thi — hồ sơ vàng | 145 |
| `signups` | Main_Signups_Clean (gốc + chuẩn hoá, cờ Giữ/Trùng) | 132 |
| `leads` | External_Leads_Clean + nền tảng/campaign từ FB Form | 59 |
| `duplicate_log`, `data_quality` | Nhật ký gộp trùng, nhật ký chuẩn hoá | 46 · 200 |
| `channel_budgets` | Nguồn & ROI + CPA Analysis + Đối soát | 8 |
| `media_reach`, `sponsor_benefits` | Hiệu quả kênh, quyền lợi nhà tài trợ | 5 · 5 |
| `exam_candidates` | 3 bộ điểm giả lập: `PM119` (liên kết PT-xxx), `A24`, `B95` | 238 |
| `exam_scores` | Điểm từng phần thi (dạng dài, tiện cho BI) | 744 |
| `meta` | Segment/drip, cấu trúc đề & tham số, thống kê pipeline | 3 |
| `partners`, `users`, `audit_logs`, `import_runs` | Hệ thống | — |

Mỗi lần `etl.seed` chạy 38 phép đối soát với số liệu trên Dashboard Booklet 2 và báo cáo ROI (145 liên hệ, 119 đăng ký web, 66 thanh toán, 18,1 triệu doanh thu, số liệu từng kênh, 13 thí sinh chung kết…) và lưu kết quả vào `import_runs` (xem ở *Chất lượng dữ liệu → Lần nạp dữ liệu gần nhất*). Hai file điểm Bảng A/B chỉ chứa công thức chưa tính, nên tổng/hạng/xếp loại/chứng chỉ được tính lại theo đúng quy tắc sheet `Tham_so` và đối chiếu với file 119 thí sinh.

Lưu ý dữ liệu: số liệu Google/TikTok/Email/Zalo là **giả định** của báo cáo gốc; điểm thi là **giả lập**; 26 liên hệ và 30 lượt đăng ký web không có ngày trong dữ liệu gốc nên không xuất hiện trên biểu đồ theo thời gian (vẫn được tính trong tổng).
