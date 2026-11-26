from datetime import date, datetime, time, timedelta, timezone
from hashlib import sha256
import json
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from ..db import get_db
from ..filters import ContactFilters, add_in, effective_partner, partner_data_match, scope_match
from ..partners import find_partner
from ..reports import monthly_report_download, monthly_report_files, report_response
from ..security import CurrentUser, require_module
from .contacts import contact_summary
from .marketing import marketing_summary

router = APIRouter(prefix="/api/overview", tags=["overview"])


def _exam_snapshot(user: CurrentUser, f: ContactFilters) -> dict:
    match = scope_match(user, f.partner, "exam_candidates")
    match["dataset"] = _EXAM_DATASET
    add_in(match, "board", f.board)
    add_in(match, "region", f.region)
    res = list(get_db().exam_candidates.aggregate([
        {"$match": match},
        {"$facet": {
            "kpi": [{"$group": {
                "_id": None, "count": {"$sum": 1}, "avg": {"$avg": "$qualifier.total"}, "max": {"$max": "$qualifier.total"},
                "finalists": {"$sum": {"$cond": ["$advanced", 1, 0]}}, "certificates": {"$sum": {"$cond": ["$certificate", 1, 0]}},
            }}],
            "grades": [
                {"$group": {"_id": {"board": "$board", "grade": "$qualifier.grade"}, "count": {"$sum": 1}}},
            ],
        }},
    ]))[0]
    kpi = res["kpi"][0] if res["kpi"] else {"count": 0, "avg": None, "max": None, "finalists": 0, "certificates": 0}
    kpi.pop("_id", None)
    kpi["cert_rate"] = kpi["certificates"] / kpi["count"] if kpi["count"] else None
    return {"kpi": kpi, "grades": [{**r["_id"], "count": r["count"]} for r in res["grades"]]}


@router.get("")
def overview(f: ContactFilters = Depends(), user: CurrentUser = Depends(require_module("overview"))):
    db = get_db()
    modules = set(user.modules)
    viewing = effective_partner(user, f.partner)
    if user.is_admin and viewing:
        partner = db.partners.find_one({"_id": viewing}) or {}
        modules = set(partner.get("modules", []))

    out: dict = {"modules": sorted(modules), "viewing_partner": viewing}
    if "contacts" in modules:
        s = contact_summary(f.match(user))
        out["crm"] = {k: s[k] for k in ("kpi", "funnel", "timeline", "by_segment", "by_region", "by_board", "by_channel", "by_payment")}
    if "marketing" in modules:
        m = marketing_summary(f, user)
        out["marketing"] = {"kpi": m["kpi"], "channels": m["channels"]}
    if "exams" in modules:
        out["exams"] = _exam_snapshot(user, f)
    if "sponsorship" in modules:
        scope = scope_match(user, f.partner, "sponsor_benefits")
        benefits = list(db.sponsor_benefits.find(scope, {"_id": 0, "partners": 0}))
        reach = list(db.media_reach.find(scope, {"_id": 0, "partners": 0}))
        out["sponsorship"] = {
            "benefits": benefits,
            "avg_progress": sum(b["progress"] for b in benefits) / len(benefits) if benefits else None,
            "total_reach": sum(r["reach"] or 0 for r in reach),
            "total_engagement": sum(r["engagement"] or 0 for r in reach),
        }
    if user.is_admin and not viewing:
        out["pipeline"] = db.meta.find_one({"_id": "pipeline"}, {"_id": 0})
    return out


@router.get("/export")
def export_overview(
    format: str = Query("xlsx", pattern="^(xlsx|docx|pdf)$"),
    f: ContactFilters = Depends(),
    user: CurrentUser = Depends(require_module("overview")),
):
    """Xuất báo cáo tổng quan (Excel / Word / PDF) theo đúng bộ lọc và phạm vi đối tác đang xem."""
    if not user.is_admin:
        _report_partner(user, f.partner)
    return report_response(format, overview(f, user), user, f)


_MONTH = r"^[0-9]{4}-(0[1-9]|1[0-2])$"
Stage = Literal["registration", "qualifier", "results", "final"]
_EXAM_DATASET = "PM119"
_PROGRAM_YEAR = 2026
_REGISTRATION_DEADLINE = datetime(_PROGRAM_YEAR, 9, 25, 12)
_REPORT_STAGES = {
    "registration": ("Đăng ký và nộp lệ phí", f"Trước {_REGISTRATION_DEADLINE:%H:%M ngày %d/%m/%Y}"),
    "qualifier": ("Vòng loại", f"03/10/{_PROGRAM_YEAR}"),
    "results": ("Công bố kết quả", "Sau vòng loại"),
    "final": ("Vòng chung kết", f"10/10/{_PROGRAM_YEAR}"),
}


class ReportPeriod(BaseModel):
    kind: Literal["month", "quarter", "range", "stage"] = "month"
    stage: Stage | None = None
    month: str | None = Field(None, pattern=_MONTH)
    year: int | None = Field(None, ge=1, le=9998)
    quarter: int | None = Field(None, ge=1, le=4)
    start_date: date | None = None
    end_date: date | None = None
    partner: str | None = Field(None, max_length=32)


class MonthlyReportCreate(ReportPeriod):
    preview_id: str = Field(pattern=r"^[a-f0-9]{64}$")


def _report_partner(user: CurrentUser, requested: str | None) -> dict:
    code = effective_partner(user, requested)
    if not code:
        raise HTTPException(422, "Chọn đối tác để xuất báo cáo")
    if not user.is_admin and requested and requested != code:
        raise HTTPException(403, "Bạn chỉ có quyền xem báo cáo của đối tác mình")
    item = find_partner(get_db(), code, active_only=not user.is_admin)
    if not item:
        raise HTTPException(404, "Không tìm thấy đối tác")
    if not user.is_admin and not item.get("can_export_reports", True):
        raise HTTPException(403, "Đối tác chưa được cấp quyền xuất báo cáo")
    return item


def _month_bounds(month: str) -> tuple[datetime, datetime]:
    year, number = map(int, month.split("-"))
    if not 1 <= year <= 9998:
        raise HTTPException(422, "Năm báo cáo không hợp lệ")
    return datetime(year, number, 1), datetime(year + (number == 12), number % 12 + 1, 1)


def _period_bounds(period: ReportPeriod) -> tuple[str, datetime, datetime]:
    if period.kind == "month" and period.month:
        start, end = _month_bounds(period.month)
        return period.month, start, end
    if period.kind == "quarter" and period.year is not None and period.quarter is not None:
        month = (period.quarter - 1) * 3 + 1
        start = datetime(period.year, month, 1)
        end = datetime(period.year + (month == 10), (month + 2) % 12 + 1, 1)
        return f"{period.year:04d}-Q{period.quarter}", start, end
    if period.kind == "range" and period.start_date and period.end_date:
        if period.end_date < period.start_date or period.end_date == date.max:
            raise HTTPException(422, "Ngày kết thúc phải từ ngày bắt đầu trở đi và trước 31/12/9999")
        start = datetime.combine(period.start_date, time.min)
        end = datetime.combine(period.end_date + timedelta(days=1), time.min)
        return f"{period.start_date.isoformat()}_{period.end_date.isoformat()}", start, end
    raise HTTPException(422, "Cần nhập đầy đủ kỳ báo cáo")


def _stage_key(stage: Stage | None) -> str:
    if not stage:
        raise HTTPException(422, "Chọn mốc chương trình để lập báo cáo")
    return f"{_EXAM_DATASET}-{_PROGRAM_YEAR}-{stage}"


def _exam_stage_sections(db, item: dict, stage: Stage) -> list:
    scope = {**partner_data_match(db, item, "exam_candidates"), "dataset": _EXAM_DATASET}
    score = "final.total" if stage == "final" else "qualifier.total"
    scored = {**scope, score: {"$type": "number"}}
    title, _ = _REPORT_STAGES[stage]
    if stage == "results":
        total = db.exam_candidates.count_documents(scored)
        advanced = db.exam_candidates.count_documents({**scored, "advanced": True})
        rows = [
            ["Thí sinh có điểm vòng loại", total],
            ["Thí sinh có điểm vòng loại được đánh dấu vào chung kết", advanced],
        ]
        note = "Tổng hợp kết quả trong dữ liệu thi. Chưa có dữ liệu về việc gửi hoặc công bố kết quả."
    else:
        totals = list(db.exam_candidates.aggregate([
            {"$match": scored},
            {"$group": {"_id": None, "count": {"$sum": 1}, "avg": {"$avg": f"${score}"}, "max": {"$max": f"${score}"}}},
        ]))
        stats = totals[0] if totals else None
        rows = [
            ["Thí sinh có điểm", stats["count"] if stats else 0],
            ["Điểm trung bình", round(stats["avg"], 2) if stats else "—"],
            ["Điểm cao nhất", stats["max"] if stats else "—"],
        ]
        note = "Chỉ tổng hợp thí sinh có điểm ở vòng đã chọn, trong phạm vi của đối tác."
    return [
        (title, [["Chỉ số", "Giá trị"], *rows]),
        ("Phạm vi chỉ số", [
            ["Phần báo cáo", "Cách tính"],
            ["Nguồn điểm", f"Bộ điểm giả lập {_EXAM_DATASET}. Mốc lịch là lịch chương trình."],
            ["Cách tính", note],
        ]),
    ]


def _preview_payload(item: dict, request: ReportPeriod, key: str, sections: list) -> dict:
    result = {
        "partner": item["_id"], "sections": sections,
        "scope_revision": item.get("scope_revision", 0),
    }
    if request.kind == "month":
        result["month"] = key
    else:
        result["period_key"] = key
        result["kind"] = request.kind
    identity = json.dumps(result, ensure_ascii=False, sort_keys=True, allow_nan=False)
    return {**result, "preview_id": sha256(identity.encode()).hexdigest()}


def _monthly_preview(user: CurrentUser, request: ReportPeriod) -> dict:
    item = _report_partner(user, request.partner)
    if not item.get("active", True):
        raise HTTPException(409, "Đối tác đã khóa. Chỉ có thể tải lại báo cáo đã chốt")
    db = get_db()
    permitted = set(item.get("modules", [])) & set(user.modules)
    stage = request.stage if request.kind == "stage" else None
    if request.kind == "stage" and not stage:
        raise HTTPException(422, "Chọn mốc chương trình để lập báo cáo")
    if stage:
        key = _stage_key(stage)
        label, schedule = _REPORT_STAGES[stage]
        period_row = ["Mốc chương trình", label]
    else:
        key, start, end = _period_bounds(request)
    if request.kind == "quarter":
        period_row = ["Quý báo cáo", f"Quý {request.quarter}/{request.year}"]
    elif request.kind == "range":
        period_row = ["Giai đoạn báo cáo", f"{start:%d/%m/%Y} – {end - timedelta(days=1):%d/%m/%Y}"]
    elif request.kind == "month":
        period_row = ["Kỳ báo cáo (năm-tháng)", key]
    sections = [("Thông tin báo cáo", [
        ["Thông tin", "Giá trị"], ["Đối tác", item["name"]],
        ["Mã đối tác", item["_id"]], period_row,
    ])]
    if stage:
        sections[0][1].append(["Lịch chương trình", schedule])
        if stage != "registration":
            if "exams" not in permitted:
                raise HTTPException(403, "Cần quyền Kết quả thi để lập báo cáo cho mốc này")
            sections.extend(_exam_stage_sections(db, item, stage))
            return _preview_payload(item, request, key, sections)
        period = {"$lt": _REGISTRATION_DEADLINE}
    else:
        period = {"$gte": start, "$lt": end}
    if "contacts" in permitted:
        scope = {**partner_data_match(db, item, "contacts"), "web_registered": True}
        by_status = {
            row["_id"]: row["count"] for row in db.contacts.aggregate([
                {"$match": {**scope, "web_registered_at": period, "report_date_assumed": {"$ne": True}}},
                {"$group": {"_id": "$payment_status", "count": {"$sum": 1}}},
            ])
        }
        registrations = sum(by_status.values())
        paid = by_status.get("Đã thanh toán", 0)
        free = by_status.get("Miễn phí", 0)
        unpaid = by_status.get("Chưa thanh toán", 0)
        unknown_dates = db.contacts.count_documents({**scope, "$and": [
            {"$or": [{"web_registered_at": None}, {"report_date_assumed": True}]},
        ]})
        sections.append(("Đăng ký website", [
            ["Chỉ số", "Giá trị"], ["Liên hệ đăng ký trong kỳ", registrations],
            ["Đăng ký thiếu ngày xác minh trong toàn phạm vi (không tính vào kỳ)", unknown_dates],
        ]))
        sections.append(("Tình trạng đóng phí của nhóm đăng ký trong kỳ", [
            ["Trạng thái hiện tại theo CRM", "Số hồ sơ"],
            ["Ghi nhận đã đóng phí", paid], ["Miễn phí", free],
            ["Chưa thanh toán", unpaid], ["Trạng thái khác hoặc chưa rõ", registrations - paid - free - unpaid],
        ]))
    if "leads" in permitted:
        scope = partner_data_match(db, item, "leads")
        leads = db.leads.count_documents({**scope, "created_at": period, "report_date_assumed": {"$ne": True}})
        unknown_dates = db.leads.count_documents({**scope, "$and": [
            {"$or": [{"created_at": None}, {"report_date_assumed": True}]},
        ]})
        sections.append(("Lead từ biểu mẫu", [
            ["Chỉ số", "Giá trị"], ["Dòng biểu mẫu tiếp nhận trong kỳ", leads],
            ["Dòng biểu mẫu thiếu ngày xác minh trong toàn phạm vi (không tính vào kỳ)", unknown_dates],
        ]))
    if len(sections) == 1:
        raise HTTPException(422, "Cần quyền Liên hệ hoặc Lead để lập báo cáo theo kỳ với dữ liệu hiện có")
    sections.append(("Phạm vi chỉ số", [
        ["Phần báo cáo", "Cách tính"],
        ["Đăng ký và Lead", "Theo ngày đăng ký web hoặc ngày tiếp nhận biểu mẫu trong nguồn."],
        ["Đóng phí", "Trạng thái lưu trên CRM tại thời điểm xem hoặc chốt. Số tiền thực thu trong kỳ cần ngày giao dịch."],
        ["Ngân sách, thi và tài trợ", "Cần dữ liệu theo kỳ đã xác minh trước khi tổng hợp."],
    ]))
    if stage == "registration":
        sections[-1][1].append([
            "Hạn đăng ký", "Tính dữ liệu có mốc ngày trước hạn. Lịch cung cấp chưa ghi ngày mở đăng ký.",
        ])
    return _preview_payload(item, request, key, sections)


_MONTHLY_FIELDS = {"_id": 1, "partner": 1, "month": 1, "period_key": 1, "generated_at": 1}


def _monthly_visibility(user: CurrentUser, item: dict) -> dict:
    match = {"partner": item["_id"]}
    if not user.is_admin:
        match["scope_revision"] = item.get("scope_revision", 0)
    return match


@router.get("/monthly/stages")
def report_stages(user: CurrentUser = Depends(require_module("overview"))):
    if not user.is_admin and user.extra.get("can_export_reports", True) is False:
        raise HTTPException(403, "Đối tác chưa được cấp quyền xuất báo cáo")
    return {"stages": [{"id": key, "label": label, "schedule": schedule}
                       for key, (label, schedule) in _REPORT_STAGES.items()]}


@router.get("/monthly/preview")
def monthly_preview(period: Annotated[ReportPeriod, Query()],
                    user: CurrentUser = Depends(require_module("overview"))):
    return _monthly_preview(user, period)


@router.post("/monthly", status_code=201)
def close_monthly_report(body: MonthlyReportCreate, user: CurrentUser = Depends(require_module("overview"))):
    report = _monthly_preview(user, body)
    if report["preview_id"] != body.preview_id:
        raise HTTPException(409, "Số liệu hoặc phạm vi đã thay đổi. Hãy xem trước lại trước khi chốt")
    db = get_db()
    existing = db.monthly_reports.find_one({"_id": body.preview_id}, _MONTHLY_FIELDS)
    if existing:
        return existing
    generated = datetime.now(timezone.utc)
    files = monthly_report_files(report["sections"], generated, body.kind)
    doc = {**report, "_id": body.preview_id, "generated_at": generated, "files": files}
    item = _report_partner(user, body.partner)
    if not item.get("active", True) or item.get("scope_revision", 0) != report["scope_revision"]:
        raise HTTPException(409, "Phạm vi đã thay đổi. Hãy xem trước lại trước khi chốt")
    try:
        db.monthly_reports.insert_one(doc)
    except DuplicateKeyError:
        # An equivalent preview was finalized by another request.
        pass
    return db.monthly_reports.find_one({"_id": body.preview_id}, _MONTHLY_FIELDS)


@router.get("/monthly")
def list_monthly_reports(period: Annotated[ReportPeriod, Query()],
                         user: CurrentUser = Depends(require_module("overview"))):
    item = _report_partner(user, period.partner)
    match = _monthly_visibility(user, item)
    if period.kind == "stage":
        match.update({"kind": "stage", "period_key": _stage_key(period.stage)})
    elif period.kind == "range" and period.start_date is None and period.end_date is None:
        match["kind"] = "range"
    else:
        key, _, _ = _period_bounds(period)
        field = "month" if period.kind == "month" else "period_key"
        match[field] = key
    rows = get_db().monthly_reports.find(match, _MONTHLY_FIELDS).sort([("generated_at", -1), ("_id", -1)]).limit(30)
    return {"reports": list(rows)}


@router.get("/monthly/{report_id}/download")
def download_monthly_report(report_id: str, format: Literal["pdf", "xlsx", "docx"], partner: str | None = None,
                            user: CurrentUser = Depends(require_module("overview"))):
    item = _report_partner(user, partner)
    match = {**_monthly_visibility(user, item), "_id": report_id}
    saved = get_db().monthly_reports.find_one(match)
    if not saved:
        raise HTTPException(404, "Không tìm thấy báo cáo trong phạm vi được cấp")
    return monthly_report_download(saved, format)
