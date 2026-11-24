# Final Refinement Plan — V35–V37

## Gate 0: xác nhận baseline
Người dùng commit/push V34 + 3 hotfix và các thay đổi riêng mong muốn; không stage file Excel hoặc feature đồng đội ngoài ý muốn. So diff remote với baseline audit. `npm run test:local` và `npm run build` phải chạy được trước khi tuyên bố hoàn tất. Không mặc định remote hiện là bản mới nhất.

## V35 — UX & Visual Review
1. Sửa C/R có bằng chứng: V01–V07, V10–V11, V14, U05, U11, U13. Chỉ sửa phần gây lỗi; system tabs/dialog migration có guard trước.
2. Ưu tiên U01/U02/U03 trước polish vì liên quan mất dữ liệu hoặc scope. Không chờ V36 để xử lý blocker đã tái hiện.
3. Kiểm tra chart V34 ở runtime (V08/V13), không đổi radius/màu đã chốt nếu không có lỗi.
4. Thống nhất toolbar, section heading, loading/error/empty, thông báo export, focus. Login form không bị áp dụng workspace field.
Gate: build, test:local, browser screenshots và keyboard flows; không overflow page; all-column/default vẫn đúng; route/dataset/query không đổi.

## V36 — Architecture, Data & Performance
1. A01–A03, A06, A12: request lifecycle, scope/session, error recovery; thêm regression tests.
2. A04/A05/A07/A09: đo trước khi tối ưu; route lazy nếu có lợi, không đổi stack; không cache khác scope/PII.
3. D01–D03/D08: báo và phối hợp backend; kiểm tra direct API với dữ liệu giả lập, không tự thay đổi backend trong patch frontend. D04–D13: kiểm tra contract, labels, CSV.
4. A08/A11: chỉ dọn CSS/dead code khi có callsite evidence; giữ registry provenance và local adaptations.
Gate: tất cả lỗi P0/P1 có fix + test hoặc release blocker rõ ràng; log Network, bundle, no stale rows; đảm bảo mutation guard.

## V37 — Release Candidate
1. Review matrix thực tế theo release-checklist; sửa regression, không thêm feature.
2. README: prerequisites đúng package.json/lockfile, npm ci, dev/proxy, build, test:local, production serve, scope/role, demo data; xác nhận backend serving path, không suy đoán deploy.
3. Team integration: Marketing/Sponsorship hiện trả null; yêu cầu đồng đội cung cấp branch/commit. Review tokens, PageRefresh, charts, API, privacy; merge có kiểm soát, không overwrite công việc đồng đội.
4. Tạo release notes, known limitations, evidence và rollback plan. RC chỉ khi pass các gate thực tế; không coi V37 tự động là production-ready.

## Phạm vi thay đổi dự kiến
V35: shared UI, system styles/components, shell nếu cần, feature styling nhỏ. V36: app/services/charts và regression tests theo lỗi xác nhận. V37: docs, release verification, bug fix nhỏ. Không thêm dependency chỉ để đổi appearance. Giữ URL, API, data model và nghiệp vụ hiện có trừ thay đổi được thống nhất riêng.

Mỗi version giao patch có base rõ ràng, `git apply --check` và diff stat; không tự commit/push. Chạy full build trên máy đủ dependencies, phân biệt fixture và runtime trong báo cáo. Nếu có lỗi compile, sửa trước vòng tiếp theo.
