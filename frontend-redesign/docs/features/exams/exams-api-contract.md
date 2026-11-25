# API contract — Kết quả thi

Nguồn: `backend/app/routers/exams.py`, `filters.py`, `routers/misc.py`, `etl/loaders.py`, `process_and_seed.py`, `tagging.py`. API client hiện tự thêm `/api`. Dùng đường dẫn `/exams/...`. Tất cả GET, không có API chỉnh sửa điểm, cấp chứng chỉ hay export PDF riêng.

## Endpoints

| Path | Params | Response |
|---|---|---|
| `/meta/options` | partner admin, dataset | viewing_partner; exams.datasets [{code,label,linked}], board, region, province, school_type, school, grade (string arrays) |
| `/exams/list` | dataset + filters + q + page/page_size/sort | total,page,page_size,rows |
| `/exams/list` | dataset + filters + q + format=csv | CSV BOM, `diem_thi_<dataset>.csv` |
| `/exams/summary` | dataset + filters (q được hỗ trợ nhưng UI không gửi) | kpi,params,structure,datasets, facets |

Meta datasets được lọc theo scope và tồn tại document, không theo filters. Meta grades là danh sách tĩnh; summary.datasets toàn metadata, KHÔNG dùng để thay danh sách được phép. Meta không trả params/structure; không gọi summary ngầm ở records chỉ để lấy metadata. Detail records dùng điểm raw, level, section keys đã trả; không hardcode max từng phần. Nếu cần max score chính xác trong detail, chỉ dùng metadata cùng dataset/scope đã xác minh hoặc đề xuất API riêng sau. Tổng điểm label không khẳng định /1000 nếu không có metadata xác nhận (contract hiện bin scale 1000).

## Query
- Bắt buộc dataset trong mọi request list/summary/CSV; mã đúng từ meta. Boot options dùng PM119 chỉ để khám phá danh sách, khi fallback chọn dataset khác phải chờ response options đúng path. Không phát request list/summary trước validation.
- `partner`: chỉ gửi giá trị từ Shell cho admin; partner account do backend tự scope; không lấy từ URL. `viewing_partner` meta phải khớp effective partner. Backend require_module('exams'), scope_match. Scope identity gồm username/role/effective partner/can_view_pii.
- Multi (OR trong field, AND giữa field): `board`, `region`, `province`, `school_type`, `school`, `grade` (qualifier.grade). comma-separated, backend add_in hỗ trợ __none__ nhưng options loại null; không tạo sentinel khi chưa rõ. Reject value có dấu phẩy; URL encode bằng URLSearchParams. Không silently bỏ filter malformed.
- Bool tri-state `paid`, `certificate`, `advanced`: absent/true/false string; giữ false, không gửi all. `advanced` = đủ điều kiện vào CK theo flag, KHÔNG có điểm CK. `paid` = cờ đóng phí; không phải eligibility. Grade luôn vòng loại.
- `q`: contact_id, full_name, email, school; literal regex case insensitive, trim, tối đa 80 ký tự (backend cắt); không search STT hay phone. Masked account search email có thể inference risk, review policy; không đưa q vào URL/log.
- List: page >=1, page_size 1–200; UI 10/20/50/100; sort whitelist `qualifier.total`, `qualifier.rank`, `final.total`, `full_name`, `school`, `province`, `stt`, `best_total`; prefix - descending. Default -qualifier.total; `_id` tie-break. Không sort `final.rank` hoặc filter theo final.total/presence.
- CSV: cùng dataset/partner/filters/q đã áp dụng, không page/page_size/sort; backend sắp board tăng, qualifier.rank tăng. Filename sanitize (dataset code validated). Chỉ gửi export nếu list đúng snapshot, q không pending; abort khi scope/query đổi. CSV có tên, email (backend mask nếu restricted), điểm; không có simulated column. V67 bỏ điều kiện PII tự đặt: mọi tài khoản được cấp module Exams có thể xuất theo phạm vi backend; giữ cảnh báo giả lập/PII và cơ chế kiểm tra dữ liệu. API quyết định masking, không coi UI là bảo mật. Không gọi CSV nếu không có rows.

## Types (nullable defensive)
```
type Round = 'qualifier' | 'final';
type Part = { level: string|null; sections: Record<string,number|null>; total:number|null; rank:number|null; grade:string|null };
type Candidate = { stt:number|null; contact_id:string|null; full_name:string|null; email:string|null; board:string|null; school:string|null; school_type:string|null; province:string|null; region:string|null; paid:boolean|null; qualifier:Part|null; final:Part|null; advanced:boolean|null; certificate:boolean|null; best_total:number|null };
```
Missing properties defensive; not coerced to 0/false. API projection excludes _id/dataset/simulated/is_registered_valid/school_id. Key `(selected dataset, stt)` normally unique per ETL _id; fallback for malformed data does not imply durable ID. Detail from selected response row, close on context change; no detail API. Do not expose raw values in debug logs. Row link to CRM not exact endpoint: optional navigate generic Contacts only when `linked && contact_id && destination allowed`, label not 'xem đúng hồ sơ'; prefer no link V30.

## Summary facets
- `kpi`: count, avg/min/max (qualifier.total), finalists (advanced true), final_avg (avg final.total), certificates (certificate true), paid, cert_rate (certificates/count or null). Count includes no score; avg ignores null; certificate denominator all matched records. Do not infer exact valid-score n from count. If hist coverage valid, sum bins for number in histogram, not total distinct people across datasets.
- `params`: certificate_threshold, top_ratio, grade_excellent, grade_good, grade_average (numbers, may missing/null). `structure`: board,round,round_label,level,section,section_label,questions?,max_score; metadata shared between datasets. Render dynamic values only when finite/valid; no silent fallback 600 or 10%.
- `histogram`: board,bin,count; qualifier only; bin=floor(total/100) capped at 9. Invalid negative bins flag rather than discard; 9 = >=900 (server also groups >1000); no inference exact number above certificate threshold if threshold not bin boundary. Empty means no grouped scores, not zero scores.
- `grades`: board,round,grade,count; null excluded. grade_order Giỏi/Khá/Trung bình/Yếu; append unknown grades, show denominator grouped grades, not total cohort. Finals distinct cohort; no direct progress claim.
- `sections`: board,round,section,avg,count,max_score,pct. pct=avg/max_score; missing max => null, validate finite; count group entries not exact non-null sample. Show raw mean/max, no average of percentages across boards unless weighted inputs verified. Unknown keys labelled as supplied.
- `by_board`, `by_school`, `by_school_type`, `by_province`, `by_region`, `by_paid`: key (string/bool/null),count,avg,min,max,certificates,finalists,box (null or [min,Q1,median,Q3,max]),cert_rate. count all documents; box inclusive quartiles, n=1 degenerates. Use mean with count labelled matched records and show unknown score. No group-average averaging. `final_by_board`: key,count,avg,min,max,certificates (only final score meets threshold, not global certificate). `finalists`: full_name,board,school,qualifier,final,final_rank; final nonnull not necessarily advanced; avoid individual fields in analytics UI, no drill-down by name.

## Business rules and provenance
`load_exams` computes competition rank `1 + count(scores strictly greater)` within dataset+board for each round. Ties share rank; next rank may skip. `n_final=ceil(round(n*top_ratio,6))`; advanced if qualifier rank <= cutoff, tie can exceed cutoff. Do not recalc with filtered n. Grade from ETL params, certificate from best score across rounds >= threshold; backend flags authoritative, grade not certificate (e.g. 600 vs grade_good 650 default documented). Missing CK is not score zero. `process_and_seed` has fixed thresholds and fills missing section points with 0, unlike loaders; backend does not expose provenance per row. Treat all current datasets as simulated per ETL `simulated=True` and legacy warning; don't claim real rank/ability. No exact timestamp/seed provenance asserted.

## Backend follow-ups (not in patch)
Explicit score-present counts, round-specific histogram and filters, stable candidate ID + exact CRM lookup, safe CSV formula handling, explicit simulated metadata in export/list, privacy review of names/email/search/summary, escaping comma values. If user needs any of these, negotiate backend contract instead of inventing client-side approximations.
