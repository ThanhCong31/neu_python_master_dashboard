# Quy trình đóng góp và Pull Request (PR)

> Áp dụng cho NEU Admissions BI frontend redesign. Tất cả PR tính năng từ đồng đội **phải mở tới fork của người quản lý**, repository `chiinthedesert/neu_python_master_dashboard`, **base branch `frontend-redesign`**. Không chọn `main` hoặc nhánh của repository gốc.

## 0. Kiểm tra nhánh nền — điều kiện tiên quyết

Tại thời điểm kiểm tra **23/11/2026**, nhánh `frontend-redesign` trên GitHub còn là bộ khung cũ; package mô tả shadcn và không có `src/features/communications/`. Trong khi đó V9 đã có App/Shell, login, permission và route cho hai feature. **Người quản lý phải đưa snapshot V9 mong muốn lên `frontend-redesign` rồi báo đồng đội trước khi bắt đầu**.

Kiểm tra tại: <https://github.com/chiinthedesert/neu_python_master_dashboard/tree/frontend-redesign/frontend-redesign>

Trên máy local đang giữ bản mới, người quản lý cần tự kiểm tra trước khi push:

```bash
git status
git branch --show-current
git remote -v
git fetch origin
# Kiểm tra thay đổi thật, tránh ghi đè những commit mới từ remote:
git log --oneline --decorate -8
git log --oneline HEAD..origin/frontend-redesign
```

Nếu `origin` không phải fork `chiinthedesert`, thay đường dẫn remote theo cấu hình máy (không giả định `origin` luôn đúng). Đồng bộ/merge cẩn thận, commit mã đã kiểm tra và `git push` lên **đúng nhánh `frontend-redesign`**. **Không `git push --force`**. Kiểm tra lại file `frontend-redesign/src/features/communications/Marketing.tsx` trên GitHub rồi mới giao task. PR từ nhánh feature không thay thế bước này.

## 1. Chọn một trong hai cách cộng tác

### Cách A — đồng đội có fork riêng (khuyến nghị)

Phù hợp khi người quản lý **chưa cấp quyền ghi** vào fork của mình. Đồng đội sử dụng tài khoản GitHub riêng để fork repository, clone fork của mình, thêm remote `target` trỏ về fork của người quản lý rồi tạo nhánh từ **`target/frontend-redesign`**.

```bash
# <GITHUB_CUA_BAN> là username thật của đồng đội.
git clone https://github.com/<GITHUB_CUA_BAN>/neu_python_master_dashboard.git
cd neu_python_master_dashboard

# origin = fork của đồng đội; target = fork của người quản lý
git remote add target https://github.com/chiinthedesert/neu_python_master_dashboard.git
git fetch target frontend-redesign

git switch -c feature/sponsorship target/frontend-redesign
# Hoặc feature/marketing nếu đang làm màn hình Truyền thông.

test -f frontend-redesign/src/features/communications/Sponsorship.tsx || echo 'SAI BASE: cần người quản lý cập nhật V9'
```

Lưu ý: GitHub có thể hướng dẫn đồng đội fork từ repository gốc trong cùng fork network. Dù fork được tạo từ đâu, **nhánh tính năng phải bắt đầu từ `target/frontend-redesign`**, không phải `main` của fork riêng. Có thể dùng GitHub CLI/SSH thay HTTPS tùy cấu hình xác thực.

**Sau khi hoàn thiện, đẩy lên fork của đồng đội:**

```bash
git status
git add frontend-redesign/src/features/communications/
git commit -m "feat(communications): build sponsorship dashboard"
git push -u origin feature/sponsorship
```

**Khi mở PR trên GitHub:**

1. Vào <https://github.com/chiinthedesert/neu_python_master_dashboard/pulls> → **New pull request**.
2. Chọn **base repository** = `chiinthedesert/neu_python_master_dashboard`.
3. Chọn **base** = `frontend-redesign`.
4. Chọn **head repository** = fork của đồng đội.
5. Chọn **compare/head branch** = `feature/sponsorship` (hoặc `feature/marketing`).
6. Kiểm tra tab **Files changed**: chỉ có file thuộc tính năng, không kéo theo backend/lockfile/nhánh khác.
7. Chọn **Create draft pull request** nếu chưa chạy đủ kiểm thử, còn **Create pull request** khi đã sẵn sàng review.
8. Gắn người quản lý làm reviewer nếu GitHub cho phép; không tự merge.

Có GitHub CLI (`gh`) thì cũng có thể chạy từ repo đã đăng nhập đúng tài khoản:

```bash
gh pr create \
  --repo chiinthedesert/neu_python_master_dashboard \
  --base frontend-redesign \
  --head <GITHUB_CUA_BAN>:feature/sponsorship \
  --title "feat(communications): hoàn thiện màn hình Nhà tài trợ" \
  --fill
```

Nếu CLI không tìm đúng nhánh cross-fork, dùng giao diện GitHub như các bước trên, không đổi base sang `main` để né lỗi.

### Cách B — đồng đội là Collaborator có quyền push vào fork của bạn

Chỉ dùng khi bạn đã **mời Collaborator và họ chấp nhận**. Đồng đội không push trực tiếp vào nhánh nền; họ tạo nhánh feature **trong cùng repository đích**.

```bash
git clone https://github.com/chiinthedesert/neu_python_master_dashboard.git
cd neu_python_master_dashboard
git fetch origin frontend-redesign
git switch -c feature/sponsorship origin/frontend-redesign
# Làm code, kiểm thử, commit.
git push -u origin feature/sponsorship
```

Sau đó tạo PR cùng repository, **base `frontend-redesign` ← compare `feature/sponsorship`**.

**Không được push thẳng vào `frontend-redesign` dù có quyền.**

## 2. Cài đặt và chạy đúng dự án

Từ gốc repository, chuyển vào thư mục frontend mới:

```bash
cd frontend-redesign
npm ci
npm run build
npm run dev
```

- Vite thường chạy ở `http://localhost:5174`.
- API dev được proxy tới `http://127.0.0.1:8000` (FastAPI đã chạy riêng).
- Cần MongoDB/dữ liệu/tài khoản mới test API thật; **không cần backend để kiểm tra build tĩnh**.
- Cần kiểm tra cả tài khoản admin (scope toàn hệ thống và một đối tác) và tài khoản đối tác có quyền module. Không dùng tài khoản không có module rồi kết luận feature lỗi.
- `npm run test:local` V9 có **lỗi script loader với Node 26** đã biết, xem `AGENTS.md`; không tự sửa scripts khi làm feature.

## 3. Một màn hình = một PR độc lập

Để review dễ dàng:

- PR 1: `feature/sponsorship` → chỉ **Nhà tài trợ**.
- PR 2: `feature/marketing` → chỉ **Truyền thông**.

Có thể phát triển song song nếu cả hai tạo branch từ base mới nhất. Tuy nhiên nếu PR 1 đã merge, hãy cập nhật PR 2 trước khi merge và kiểm tra lại UI để tránh sai kiến trúc hoặc style.

### Đồng bộ nhánh tính năng với base

Với Cách A, khi base đã thay đổi:

```bash
git fetch target frontend-redesign
git switch feature/marketing
git merge target/frontend-redesign
# Nếu có conflict: sửa từng file, chạy lại build và commit merge.
git push
```

Với Cách B, thay `target` bằng `origin`. **Không dùng `git reset --hard` để xử lý conflict khi còn thay đổi chưa lưu**. Không force-push; nếu thật sự cần rebase, phải thống nhất với người review trước.

## 4. Quy tắc commit

Ví dụ:

```text
feat(communications): build sponsorship overview
feat(communications): add marketing KPI and channel breakdown
fix(communications): handle missing budget in ROI display
style(communications): improve mobile KPI layout
```

Commit nên mô tả thay đổi thực tế. Không commit `node_modules/`, `dist/`, `.env`, dữ liệu thật hoặc ảnh chứa PII. Kiểm tra bằng `git status --short` và `git diff --check`.

## 5. Mẫu nội dung PR (copy và điền)

```md
## Mục tiêu
- Màn hình: [Nhà tài trợ / Truyền thông]
- Brief: `frontend-redesign/docs/tasks/[sponsorship.md / marketing.md]`

## Những gì đã làm
- [ ] Các KPI/cấu phần chính
- [ ] Đọc API thật và xử lý loading/empty/error
- [ ] Phạm vi admin/đối tác, giao diện responsive

## File đã thay đổi
- `frontend-redesign/src/features/communications/...`

## Kiểm thử
- [ ] `npm run build` (ghi kết quả)
- [ ] `npm run test:source` (nếu chạy được)
- [ ] Chế độ sáng/tối
- [ ] Kích thước màn hình nhỏ và desktop
- [ ] API admin toàn hệ thống / admin scope đối tác
- [ ] Tài khoản đối tác có module
- [ ] Dữ liệu rỗng / null / lỗi HTTP

## Ảnh màn hình
- Desktop: [ảnh hoặc giải thích chưa có]
- Mobile: [ảnh hoặc giải thích chưa có]

## Lưu ý/rủi ro
- Giới hạn backend, chỉ số giả định, vấn đề còn tồn tại
- Test nào chưa chạy được và vì sao

## Checklist
- [ ] Không sửa backend, shell, dependency ngoài phạm vi
- [ ] Không hardcode dữ liệu nghiệp vụ
- [ ] PR nhắm `chiinthedesert/neu_python_master_dashboard:frontend-redesign`
```

Nếu không có backend local để test thật, **ghi rõ "chưa kiểm thử tích hợp"**, không đánh dấu đã test. Ảnh có thể dùng dữ liệu mock **chỉ khi được đánh dấu rõ là mock** và không dùng làm bằng chứng API thành công.

## 6. Người review kiểm tra những gì?

1. **Đúng hướng PR**: base repository và base branch chính xác; diff không có file lạ.
2. **Nghiệp vụ**: KPI/định nghĩa/phạm vi/giá trị thiếu/ước tính đúng đặc tả.
3. **Kỹ thuật**: API thật, TypeScript strict, không tải lặp vô hạn, handle lỗi.
4. **UI**: khớp app shell, M3 token, nhãn tiếng Việt, mobile, keyboard và dark mode.
5. **Bằng chứng**: build và kiểm thử thực tế; không claim quá mức.

Yêu cầu sửa có thể comment trực tiếp vào PR. Đồng đội sửa **trên cùng feature branch** và push thêm commit; PR tự cập nhật. Sau khi reviewer chấp nhận, **người quản lý** merge vào `frontend-redesign` (ưu tiên squash nếu nhóm thống nhất) và xóa nhánh feature nếu phù hợp.

## 7. Mẫu tin nhắn giao việc cho LLM

> Bạn đang làm một tính năng của NEU Admissions BI. Hãy đọc `frontend-redesign/AGENTS.md`, `frontend-redesign/docs/CONTRIBUTING.md` và brief task được giao. Mã nguồn thực tế trên nhánh feature tạo từ `chiinthedesert/neu_python_master_dashboard:frontend-redesign` sau khi cập nhật V9 mới là nền tảng. Trước khi code, nêu kế hoạch, điểm phụ thuộc và API cần dùng. Chỉ sửa feature được giao, không sửa backend/shell/dependencies. Xong hãy chạy build, nêu test đã/chưa làm, chuẩn bị PR bằng tiếng Việt nhắm đúng base. Không tự merge.

## 8. Những lỗi Git/PR thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| Trên GitHub không có `src/features/communications/` | Base `frontend-redesign` chưa được cập nhật V9; dừng và liên hệ người quản lý |
| PR nhắm `main` hoặc repo upstream | Đổi **base repository** và **base branch** về fork của người quản lý + `frontend-redesign` |
| PR chứa toàn bộ backend hay nhiều file lạ | Feature branch tạo sai base, hoặc dùng `git add .` không kiểm tra; xem `git diff --stat target/frontend-redesign...HEAD` |
| `git push` báo không có quyền | Dùng fork của đồng đội (Cách A) hoặc xin quyền Collaborator (Cách B) |
| Xung đột sau khi người khác merge | `git fetch target && git merge target/frontend-redesign`, giải quyết có kiểm soát, test lại |
| `npm run build` pass nhưng UI trắng | Mở DevTools Console/Network, kiểm tra render runtime và API; build không thay thế browser test |
