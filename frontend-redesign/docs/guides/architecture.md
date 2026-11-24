# Kiến trúc frontend

[Danh mục tài liệu](../README.md) · [README dự án](../../README.md)

## Điều hướng

Tuyển sinh là một nút menu cha có hai mục con thụt vào, có đường nối và trạng thái được chọn riêng. Có thể mở/đóng nhóm. Trong rail thu gọn, bấm Tuyển sinh sẽ mở rộng sidebar để thấy hai mục con. Các mục độc lập tiếp tục ở cấp trên. Hệ thống có đường phân cách và nhãn riêng.

Dưới 768 px, dùng drawer của Expressive. Từ 768 px, sidebar thu gọn được. Mặc định mở từ 1200 px, có lưu lựa chọn. Dùng nút bật/tắt sidebar trên Top App Bar (phím tắt sidebar đang tắt). Avatar mở menu tài khoản, theme và đăng xuất.

## Cấu trúc và phân công

| Đường dẫn | Trách nhiệm |
|---|---|
| `src/app/` | Router, registry route, kiểu dữ liệu, workspace context |
| `src/shell/` | Tích hợp sidebar, app bar, profile, scope và theme |
| `src/components/expressive/` | Source UI do CLI của Expressive cài |
| `src/lib/expressive/` | Source token, motion và helper của Expressive |
| `src/styles/globals.css` | Tailwind, theme được CLI sinh và CSS nền |
| `src/styles/expressive.css` | Utility của Expressive |
| `src/features/admissions/` | Liên hệ & chuyển đổi, Lead từ biểu mẫu |
| `src/features/communications/` | Truyền thông, Nhà tài trợ |
| `src/features/overview/`, `src/features/results/` | Tổng quan, Kết quả thi |
| `src/features/system/` | Chất lượng dữ liệu, Quản trị, các màn Tài khoản/Đối tác/Dữ liệu/Nhật ký và shared UI |
| `src/features/account/` | Tài khoản |
| `src/services/` | HTTP client và hook tải dữ liệu, có hủy request khi unmount |
| `src/shared/Icons.tsx` | Ánh xạ icon Lucide cho module |

Mỗi thành viên có thể nhận 2–3 màn hình. Triển khai trong file màn hình tương ứng và đặt component, CSS, hook riêng cạnh nó. Mỗi nhóm có `routes.ts` sở hữu nhãn, URL và component của nhóm đó. Shell có sẵn app bar và phạm vi dữ liệu.

Thêm màn hình bằng cách khai báo trong `routes.ts` của feature rồi đăng ký ở `src/app/destinations.ts`. Với module mới, cập nhật `ModuleId` trong `src/app/model.ts`. Menu và router lấy cùng danh sách sau khi lọc quyền.

`useWorkspace()` cung cấp người dùng, danh sách route được phép và đối tác đang xem.

## Component và theme thực sự được dùng

| Component hoặc hệ thống | Điểm tích hợp |
|---|---|
| SidebarProvider, Sidebar, SidebarInset, SidebarTrigger | `src/shell/Shell.tsx` |
| SidebarContent, SidebarGroup, SidebarMenuButton | `src/shell/Navigation.tsx` |
| TopAppBar | `src/shell/Shell.tsx` |
| Menu, MenuRadioGroup, MenuRadioItem | `src/shell/Profile.tsx` |
| Avatar, IconButton | `src/shell/Profile.tsx`, `src/shell/Shell.tsx` |
| Select | `src/shell/ScopeSelect.tsx` |
| Expressive color/motion/shape theme | `expressive.json`, `src/styles/globals.css` |
| Inter Variable, tự phục vụ cả bộ ký tự tiếng Việt | `src/main.tsx` |

Chọn seed mặc định #6750A4, color variant expressive, motion scheme expressive, motion engine CSS và shape scale expressive. Font Inter được nạp từ Fontsource. Icon ứng dụng dùng Lucide. Giấy phép MIT của thư viện nằm trong `EXPRESSIVE-LICENSE`.

Các file trong `components/expressive/` và `lib/expressive/` gồm source từ CLI và các adaptation đã được review; không ghi đè bằng registry khi chưa kiểm tra diff. `NavigationTrigger` trong shell truyền aria-expanded theo trạng thái drawer trên mobile và đóng drawer khi chuyển sang desktop.

## Thêm component và cập nhật theme

```sh
npm run ui -- add pagination
npm run ui -- diff sidebar
npm run ui -- theme --seed "#6750A4" --variant expressive
```

Hệ thống đã có bảng phân trang bằng API ở Chất lượng dữ liệu, và phân trang trên 200 bản ghi gần nhất ở Nhật ký. Pagination CLI chưa được cài (đã dùng nút Expressive tự triển khai). Khi phát triển trang, dùng component từ `@/components/expressive/` và utility token như `bg-surface`, `text-body-large`, `rounded-shape-large`, `spring-spatial-fast`. Đặt CSS tùy chỉnh sau `expressive:theme:end` để CLI có thể tái sinh theme.

Tài liệu gốc — [Installation](https://expressive.grenishrai.pro/docs/installation), [Sidebar](https://expressive.grenishrai.pro/docs/components/sidebar), [Theming](https://expressive.grenishrai.pro/docs/theming).
