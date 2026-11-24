# Kết quả thi — hồ sơ thiết kế V30–V32

Trạng thái: Research & Planning, chưa triển khai. Baseline V29: workspace `/mnt/data/design-system-work/frontend-redesign` có V28 commit 49c5aaf và diff V29. Không giả định bản trên GitHub đã đồng bộ. Trước coding đối chiếu baseline user, AGENTS/CONTRIBUTING, V20/V28/V29, quy chuẩn Contacts/Leads. Không sửa feature đồng đội, backend hoặc dữ liệu.

## Thứ tự đọc
1. [exams-issues.md](exams-issues.md) — audit frontend main và giới hạn backend.
2. [exams-api-contract.md](exams-api-contract.md) — ngữ nghĩa và wire contract.
3. [exams-design.md](exams-design.md) — IA, VD, responsive và interaction.
4. [exams-plan.md](exams-plan.md) — reuse map, state, các gate V30–V32.
5. [exams-review.md](exams-review.md) — checklist, fixture và evidence.

## Nguyên tắc không thương lượng
- Dữ liệu giả lập, không công bố hoặc đánh giá cá nhân; thông báo luôn hiện, cả trước khi tải dữ liệu.
- Dataset là context bắt buộc, không gộp PM119/A24/B95. Chỉ chọn dataset có trong scoped meta options.
- Hạng, chứng chỉ, advanced do backend xác định; không tính lại theo trang hoặc filter.
- Vòng thi là ngữ nghĩa dữ liệu, không tạo filter final không tồn tại. Không đồng nhất advanced và có điểm final.
- Giữ records/analysis theo Contacts/Leads, PageRefresh V20, workspace controls V29, shared table/list/dialog V28, ECharts V16.
- Không fake data trong app, không thêm dependencies, không thay đổi shared primitive chỉ vì style riêng. Fixtures chỉ ở test.
- Full build và real API/keyboard/touch/theme test là gate nghiệm thu; static fixture không thay thế runtime.

## Nguồn đã kiểm tra
Repository `chiinthedesert/neu_python_master_dashboard`, nhánh main (fetch file trong vòng audit): `frontend/src/pages/Exams.tsx` blob b3336936e322d09da341cdcc3439a4ca546596cc; `backend/app/routers/exams.py` blob 6c58e12c39d4ba9567d19c2a08a00f56a8cc6c3a; `backend/app/filters.py` blob 3807cb31527eee1ce4bababdaf0ce6bf263ffd40; `backend/app/routers/misc.py` blob 4c9775f9ee43cf45c0f0d5da2c751c126139c985; `backend/etl/loaders.py`, `process_and_seed.py`, `seed.py`, `tagging.py`, `docs/DATA_DICTIONARY.md` §2.3/3.2. Source V29 đọc trực tiếp local `shared/*`, `charts/*`, `features/admissions/Leads.tsx`, `features/results/*`, `view-switch.tsx`, `REDESIGN-V29-WORKSPACE-FIELDS.md`. Chưa kiểm tra DB thực tế trong vòng này.
