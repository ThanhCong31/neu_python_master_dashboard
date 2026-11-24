# Release Checklist — evidence required

Trạng thái audit: các mục runtime chưa chạy. Đánh dấu khi có evidence gồm commit, môi trường, ngày, screenshot/log, kết quả. Không dùng fixture thay runtime.

## Baseline / build
- [ ] Git branch và SHA xác nhận V34 + hotfixes, diff không ghi đè teammate/data.
- [ ] Node phù hợp engines; `npm ci` sạch với lockfile; `npm run test:local` exit 0.
- [ ] `npm run build` exit 0; production bundle load qua cấu hình deploy thật.
- [ ] Backend + DB đúng cấu hình, API docs/health và session chạy; không đưa secrets vào repo.

## Visual / responsive
- [ ] 5 theme × light/dark; system appearance và persistence; motion reduced.
- [ ] 320/360/390/430/600/768/1024/1280/1440/1920px; test content widths ở breakpoint ±1.
- [ ] Sidebar mở/đóng, tên partner dài, viewport thấp, zoom 200%; không page scroll ngang.
- [ ] Search/Select/toolbar cùng trục; labels dài, focus ring, selected state; không layout jump.
- [ ] Default columns vừa vùng; all columns cuộn trong region; reset cột; mobile detail đủ thông tin.
- [ ] Chart line/bar/stacked/legend/tooltip/table và radius, màu ổn định; zero/null/empty, 365 điểm, ẩn/hiện.
- [ ] Dialog scroll/body/footer, keyboard mobile, menu popup trong viewport.

## UX / accessibility
- [ ] Login/logout/session expiry, offline, retry, 401/403/500; không flash data cũ.
- [ ] Navigation, back/forward, focus restoration, skip link; mỗi page một H1, tab/aria labels đúng.
- [ ] Filter apply/cancel/reset, q debounce, sort, page size, scope change, drill-down, CSV.
- [ ] Admin dirty guard cả tab/route/back; pending mutation không double submit hoặc đóng sai.
- [ ] Keyboard toàn bộ control, screen reader spot-check, 4.5:1 chữ thường / 3:1 chữ lớn và control quan trọng (WCAG AA), touch 44–48px theo quy chuẩn, zoom không mất chức năng.

## Data / security
- [ ] D01 backend free-text redaction list/CSV/summary; test direct API. Không release dữ liệu thật nếu chưa xử lý.
- [ ] D02/D03 PII search, scope tampering, quyền endpoint, partner overlap.
- [ ] D04/D05 miễn phí, chưa đóng phí, lệ phí không phải dự báo.
- [ ] D06/D07 dataset isolation, rank, null/zero, threshold, điểm giả lập.
- [ ] D08 CSV formula-injection fixture và encoding tiếng Việt.
- [ ] D09/D10 CSV/report scope và query, export abort, refreshError, sort note.
- [ ] D11/D12 timeline, ROI, sponsor semantics đối chiếu dữ liệu backend.

## Performance / integration
- [ ] Production chunk sizes và network logs; không tải phân tích khi chỉ cần records nếu có thể tránh.
- [ ] Delayed response A→B→A, scope change, logout/login, lỗi chart, mount/unmount; không stale state/console error.
- [ ] Marketing/Sponsorship implementation được merge, review đầy đủ theo cùng tiêu chuẩn.
- [ ] README, deploy/rollback, release notes, known limitations, evidence lưu kèm SHA.

## Kết quả baseline audit (đã chạy)
- [x] Bảy script logic/theme/API/chart riêng exit 0 trên Node 22.16.0.
- [ ] Full test:local: bị chặn ở source gate do thiếu TypeScript local.
- [ ] Build: bị chặn TS2688 node/vite/client.
- [ ] Runtime React/ECharts/FastAPI/MongoDB và teammate integration: chưa nghiệm thu.

Không được chuyển trạng thái thành “đã nghiệm thu” khi chỉ có static CSS/syntax tests. P0 còn mở → không release production; P1 còn mở → ghi quyết định/owner và không gọi là hoàn thiện nếu luồng chính bị ảnh hưởng.
