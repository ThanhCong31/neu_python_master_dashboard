# V38 — Loading indicator

- Baseline: V37 (bao gồm ba hotfix V34).
- Loading phiên đăng nhập: nhận diện NEU, morphing shape 48px, màu theme.
- Loading bảng, phân tích, scope và chart: indicator circular 32px trong vùng nội dung. Chart giữ chiều cao theo container (<480px dùng chiều cao compact). Không thay đổi trạng thái refresh, lỗi, empty hoặc request lifecycle.
- Adaptation từ `Grenish/expressive` registry commit `eb96d3df46790079ae5bf7b22d721491260c1485`, `loading.tsx` và `shape.tsx`: dùng Material shape paths, spring và shape-morph có sẵn. Không thêm dependencies. CSS rotation thay cho animation frame quay liên tục; cleanup interval và RAF khi unmount. Reduced motion: không morph hoặc xoay, vẫn có nhãn trạng thái.
- Không có phần trăm giả hoặc delay bắt buộc; không sửa màn hình đồng đội.

## Verification
- 8 nhóm test độc lập (theme, api, overview, contacts, leads, exams, charts, reliability): pass.
- TypeScript transpile syntax: 115 modules pass. Không tương đương full typecheck.
- 24 fixture HTML/CSS Chromium: 6 chiều rộng, light/dark, reduced motion on/off; không tràn ngang, chiều cao chart fallback đúng. Không phải runtime React.
- Production build chưa xác nhận (workspace thiếu dependencies). Cần chạy `npm run test:local`, `npm run build`, `npm run dev` tại máy người dùng. Dùng network throttling để kiểm tra auth loading, offline/retry, scope, chart lazy loading, logout và cleanup; kiểm tra 5 theme, light/dark và reduced motion thực tế.
