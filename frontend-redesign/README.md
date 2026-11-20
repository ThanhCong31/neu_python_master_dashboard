# NEU Admissions BI — Hướng dẫn chạy dự án

Hướng dẫn này dành cho dev mới clone repo. Dùng **`frontend/` để xem dashboard đang hoạt động** và **`frontend-redesign/` để phát triển giao diện mới**. Bản redesign dùng React, TypeScript, Vite, Tailwind CSS v4 và shadcn/ui; hiện chỉ có trang kiểm tra sáng/tối, **chưa có đăng nhập hay biểu đồ**.

| Bạn muốn… | Cần chạy | Địa chỉ |
|---|---|---|
| Làm giao diện redesign | Chỉ `frontend-redesign/`; không cần `.env`, MongoDB hay Excel | [localhost:5174](http://localhost:5174) |
| Xem dashboard có số liệu | MongoDB, FastAPI, dữ liệu demo và `frontend/` | [localhost:5173](http://localhost:5173) |
| Tích hợp API vào redesign | `frontend-redesign/` và FastAPI; thêm MongoDB và tài khoản cho API có đăng nhập | [Swagger](http://localhost:8000/api/docs) |

## 1. Chuẩn bị từ bản clone mới

Cần **Git**, **Node.js 22.12+ (khuyến nghị Node 24 LTS)** và **npm**. Để chạy dashboard đầy đủ, cần thêm **Python 3.12+**, [uv](https://docs.astral.sh/uv/getting-started/installation/) và **MongoDB**. Docker là một cách chạy MongoDB local, không bắt buộc nếu đã có MongoDB local hoặc Atlas.

```sh
git clone https://github.com/chiinthedesert/neu_python_master_dashboard.git
cd neu_python_master_dashboard
```

Nếu repo yêu cầu quyền truy cập, xin quyền từ người quản lý repo. Dùng nhánh có `frontend-redesign/`. Các khối lệnh bên dưới bắt đầu từ **gốc repo**, trừ khi có ghi chú khác.

## 2. Chạy dashboard đầy đủ với dữ liệu có sẵn trong Git

### 2.1. Chạy MongoDB

Nếu chưa có MongoDB và đã cài Docker, chạy một container dev chỉ mở cổng trên máy local:

```sh
docker run -d --name neu-bi-mongo -p 127.0.0.1:27017:27017 -v neu-bi-mongo-data:/data/db mongo:8
```

Lần sau dùng `docker start neu-bi-mongo` thay vì tạo lại. Nếu đã có MongoDB trên cổng `27017`, không chạy thêm container. Với Atlas, dùng URI của cluster dev, cấp quyền đọc/ghi trên DB dev và thêm IP máy chạy vào *Network Access*.

### 2.2. Tạo `.env` ở gốc repo

Nếu chưa có `.env`, chạy `cp .env.example .env`. Sửa các giá trị sau; nếu đã có `.env`, đừng ghi đè file hoặc dùng nhầm DB thật.

| Biến | Giá trị cho dev local |
|---|---|
| `MONGO_URI` | `mongodb://localhost:27017` nếu dùng MongoDB local; thay bằng URI riêng nếu dùng Atlas |
| `MONGO_DB_NAME` | `neu_admissions_dev` hoặc một DB dev riêng |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ít nhất 32 ký tự; tạo bằng `python3 -c 'import secrets; print(secrets.token_hex(32))'` |
| `COOKIE_SECURE` | `false` khi chạy HTTP trên localhost |
| `SEED_ADMIN_PASSWORD` | Mật khẩu dev tự chọn, ít nhất 8 ký tự |
| `SEED_PARTNER_PASSWORD` | Mật khẩu dev riêng cho nhóm tài khoản đối tác, ít nhất 8 ký tự |
| `JWT_EXPIRE_HOURS` | Không bắt buộc; mặc định `12` |
| `DATA_DIR` | Không cần cho bộ demo trong `data/`; chỉ dùng với bộ sáu workbook ở phần 4 |

Biến môi trường của terminal được ưu tiên hơn `.env`. Không đưa `.env`, mật khẩu hoặc URI Atlas vào commit hay vào biến frontend `VITE_*`.

### 2.3. Nạp dữ liệu demo và bật API — Terminal 1

Không cần xin bộ Excel ngoài repo cho bước này. Bản clone có sẵn:

| File | Dữ liệu |
|---|---|
| [`data/Demo_Data_khách_hàng.xlsx`](../data/Demo_Data_khách_hàng.xlsx) | Đăng ký web, Google webinar và Facebook Ads |
| [`data/Diểm giả lập.xlsx`](../data/Diểm%20giả%20lập.xlsx) | Điểm thi giả lập; giữ đúng chính tả tên file trong repo |
| [`data/master/schools_master.csv`](../data/master/schools_master.csv) | Danh mục chuẩn hóa tên trường |

**Trước khi nạp:** `etl.process_and_seed` ghi lại workbook điểm và xóa/thay dữ liệu trong một số collection của DB đích. Chỉ chạy trên DB dev riêng; sao lưu workbook nếu bạn đã chỉnh sửa và không commit thay đổi Excel phát sinh chỉ do chạy seed. Dừng nếu không chắc URI đang trỏ tới môi trường nào.

```sh
cd backend
uv sync --locked
uv run python -m etl.process_and_seed
uv run uvicorn app.main:app --port 8000
```

Chỉ khởi động API sau khi lệnh nạp báo thành công. Với DB dev đã có dữ liệu và tài khoản, bỏ qua lệnh nạp; không cần chạy lại mỗi lần mở dự án. Nếu chỉ cần tạo tài khoản và đối tác mà không đụng tới Excel hay dữ liệu nghiệp vụ, thay lệnh nạp bằng `uv run python -m etl.seed --skip-data`.

### 2.4. Mở dashboard đang hoạt động — Terminal 2

```sh
cd frontend
npm ci
npm run dev
```

Mở **http://localhost:5173**, đăng nhập bằng `admin` và `SEED_ADMIN_PASSWORD`. Các tài khoản đối tác mặc định là `dn`, `neu`, `nh`, `thpt`, `dh`, `info`, `metaads`, `miennam`; tài khoản mới dùng `SEED_PARTNER_PASSWORD`. Seed thông thường không thay mật khẩu tài khoản đã tồn tại. Thử `dn` để kiểm tra giao diện đối tác: có mục Kết quả thi và Nhà tài trợ, không có CRM hoặc Quản trị.

### 2.5. Kiểm tra đã chạy đúng

1. Mở trực tiếp [GET `/api/health`](http://localhost:8000/api/health) hoặc chạy `curl -fsS http://localhost:8000/api/health`. Kỳ vọng `"ok": true` và tên DB dev đã chọn. Dùng `GET`; `HEAD` không kiểm tra MongoDB.
2. Trong [Swagger](http://localhost:8000/api/docs), gọi `POST /api/auth/login` với `username` và `password` của tài khoản dev. Trên cùng địa chỉ `localhost`, gọi tiếp `GET /api/auth/me`: kỳ vọng `200` và đúng vai trò. Đăng nhập thiết lập cookie `HttpOnly`; không cần dán JWT vào Swagger.
3. Với tài khoản `admin`, gọi `GET /api/admin/data-status` để kiểm tra số dòng thật trong MongoDB. Các mục `contacts`, `signups`, `exam_candidates` và `exam_scores` phải có dữ liệu sau khi nạp demo. Không dùng bộ số liệu đối soát của sáu workbook để đánh giá bộ demo.
4. Trong UI cũ, mở **Tổng quan**, **CRM** và **Kết quả thi** để kiểm tra biểu đồ và bảng. Nếu chỉ chạy `--skip-data`, đăng nhập được nhưng không có số liệu nghiệp vụ; đó là hành vi dự kiến.

## 3. Chạy bản redesign — Terminal riêng

```sh
cd frontend-redesign
npm install
npm run dev
```

Mở **http://localhost:5174**. Nút **Giao diện tối** kiểm tra Tailwind và component `Button`. Có thể chạy song song UI cũ trên `5173`. Bản redesign hiện không gọi API, nhưng Vite đã chuyển tiếp `/api` sang `http://localhost:8000` trong chế độ dev; khi tích hợp hãy dùng `/api/...` trên cùng origin để trình duyệt gửi cookie.

`npm run build` kiểm tra TypeScript và tạo `frontend-redesign/dist/`; `npm run preview` xem bản build. FastAPI hiện chỉ phục vụ `frontend/dist` của app cũ, không tự phục vụ bản redesign. API contract có tại [Swagger](http://localhost:8000/api/docs) và [OpenAPI JSON](http://localhost:8000/api/openapi.json). Xem [từ điển dữ liệu và quy tắc nghiệp vụ](../docs/DATA_DICTIONARY.md) trước khi định nghĩa lại KPI hoặc phạm vi đối tác.

## 4. Tùy chọn: nạp bộ sáu workbook gốc để đối soát

Chỉ dùng khi cần dữ liệu gốc hoặc kết quả đối soát. **Sáu workbook không có trong Git**; xin bộ được phép sử dụng từ người quản lý dữ liệu, không đưa file có thông tin cá nhân vào commit. Đặt cả sáu file trong cùng một thư mục; `DATA_DIR` trong `.env` trỏ tới thư mục đó (đường dẫn tương đối tính từ gốc repo). Khi không đặt, mặc định là `Data-20260929T164510Z-1-001/Data`.

```text
NEU_CaseStudy_Booklet1_Raw_Data_PTIT*.xlsx
NEU_CaseStudy_Booklet2_Cleaned_Answer_Key*.xlsx
Bao_Cao_Hieu_Qua_Truyen_Thong_ROI_DoiSoat*.xlsx
diem_gia_lap_119_thi_sinh*.xlsx
diem_gia_lap_Bang_A_24*.xlsx
diem_gia_lap_Bang_B_95*.xlsx
```

Chọn một DB dev khác, ví dụ `neu_admissions_reconcile`, để không ghi đè hoặc trộn với bộ demo. Từ `backend/` sau khi đã chạy `uv sync --locked`:

```sh
uv run python -m etl.seed --dry-run
```

Lệnh trên đọc Excel và in các phép đối soát, không ghi DB. Nếu có dòng `LỆCH`, kiểm tra lại bộ file trước khi tiếp tục: lệnh nạp đầy đủ không tự dừng khi có chênh lệch. Sau khi kiểm tra và xác nhận đúng DB đích:

```sh
uv run python -m etl.seed
```

Lệnh đầy đủ thay thế các collection nghiệp vụ, đồng bộ tài khoản và lưu kết quả đối soát vào `import_runs`. Sau khi đổi `MONGO_DB_NAME`, khởi động lại API để dùng DB mới. Bộ sáu file có bộ thi `PM119`, `A24` và `B95`; bộ demo trong Git chỉ tạo `PM119` và có dữ liệu marketing/tài trợ mẫu.

## Xử lý lỗi thường gặp

| Triệu chứng | Kiểm tra |
|---|---|
| API không khởi động, báo `JWT_SECRET` hoặc `MONGO_URI` | `.env` phải ở gốc repo; secret phải đủ 32 ký tự. Kiểm tra biến môi trường terminal có ghi đè file không. |
| MongoDB timeout hoặc lỗi TLS | Kiểm tra dịch vụ MongoDB local, URI/cổng. Với Atlas, kiểm tra IP allowlist, thông tin tài khoản và quyền DB. |
| `etl.seed` báo thiếu Booklet/ROI | Bạn đang gọi trình nạp sáu workbook. Dùng `etl.process_and_seed` cho hai file trong `data/`, hoặc cung cấp đủ file và đặt `DATA_DIR`. |
| Đăng nhập thất bại hoặc `/api/auth/me` trả `401` | Đúng DB và đúng tài khoản seed chưa? Trên HTTP local đặt `COOKIE_SECURE=false`, dùng `localhost` nhất quán và đăng nhập lại sau khi đổi `JWT_SECRET`. Mật khẩu cũ không đổi khi chỉ sửa `.env`. |
| Vite không gọi được `/api` | Kiểm tra API thực sự ở cổng `8000`; mở `/api/health` trước. Chạy đúng thư mục: `frontend/` ở `5173`, `frontend-redesign/` ở `5174`. |
