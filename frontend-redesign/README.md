# NEU Admissions BI — Frontend

Dashboard tuyển sinh NEU, xây dựng bằng React 19, TypeScript, Vite, Tailwind CSS v4 và [Material 3 Expressive (Grenish)](https://expressive.grenishrai.pro/docs/installation). Biểu đồ sử dụng ECharts 6.1.0; font Inter Variable.

## Chạy nhanh

Yêu cầu Node.js >= 22.16.0, backend FastAPI trên cổng 8000 và MongoDB đã cấu hình. Từ `frontend-redesign/`:

```sh
npm ci
npm run dev
```

Mở http://localhost:5174. Vite proxy `/api` đến `http://127.0.0.1:8000`. Dùng tài khoản backend hiện có.

```sh
npm run test:local
npm run build
npm run preview
```

Xem [hướng dẫn phát triển](docs/guides/development.md) để biết cấu hình, kiểm thử và tích hợp. Không bỏ qua lỗi compiler; nghiệm thu bằng [release checklist](docs/final-review/release-checklist.md).

## Phạm vi

Tổng quan, Liên hệ & chuyển đổi, Lead từ biểu mẫu, Kết quả thi, Quản trị, Chất lượng dữ liệu, Đăng nhập và Tài khoản đã có implementation API. Truyền thông và Nhà tài trợ sẽ được review cùng PR của đồng đội. Điểm thi là dữ liệu giả lập, không dùng để công bố hoặc đánh giá cá nhân. Backend quyết định quyền truy cập; UI không thay thế kiểm soát bảo mật server.

## Cấu trúc

```text
frontend-redesign/
├── src/
│   ├── app/                    # Router, scope, workspace
│   ├── shell/                  # Navigation, theme, profile
│   ├── components/expressive/ # UI primitives
│   ├── lib/expressive/        # Tokens, motion, utilities
│   ├── features/              # Màn hình nghiệp vụ
│   ├── shared/                # Workspace, charts, loading
│   └── services/              # API, request lifecycle
├── scripts/                   # Regression tests
└── docs/                      # Tài liệu kỹ thuật
```

## Tài liệu

Bắt đầu tại **[docs/README.md](docs/README.md)**.

| Cần tìm | Đọc |
|---|---|
| Chạy, cấu hình, build | [Development](docs/guides/development.md) |
| Kiến trúc và quy tắc phát triển | [Architecture](docs/guides/architecture.md) |
| Quản trị, API, rủi ro vận hành | [System operations](docs/guides/system-operations.md) |
| UI, theme, chart và responsive | [Design system](docs/design-system/README.md) |
| Đặc tả từng màn hình | [Features](docs/features/README.md) |
| Audit và nghiệm thu | [Final review](docs/final-review/README.md) |
| Ghi chú triển khai | [History](docs/history/README.md) |

Mốc triển khai hiện tại: [V38 — Loading](docs/history/REDESIGN-V38-LOADING.md), sau [V35–V37 — Final refinement](docs/history/REDESIGN-V37.md). Xem Git history cho các hotfix tiếp theo. Chưa coi đây là production release trước khi hoàn thành kiểm thử tích hợp và review PR đồng đội.
