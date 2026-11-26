import re
from datetime import datetime, timezone
from pathlib import Path
from secrets import token_hex
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from ..config import settings
from ..db import get_db
from ..filters import partner_data_match
from ..partners import MODULES, find_partner
from ..security import CurrentUser, hash_password, require_admin, validate_password_strength
from .auth import audit

router = APIRouter(prefix="/api/admin", tags=["admin"])

USER_FIELDS = {"_id": 0, "username": 1, "full_name": 1, "role": 1, "partner_code": 1, "active": 1, "created_at": 1, "last_login": 1}
PARTNER_TYPE_LABELS = {"sponsor": "Nhà tài trợ", "business": "Doanh nghiệp hợp tác"}


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    full_name: str = Field(min_length=1, max_length=120)
    role: str = Field(pattern="^(admin|partner)$")
    partner_code: str | None = None
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=120)
    active: bool | None = None
    partner_code: str | None = None


class PasswordReset(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class PartnerCreate(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    # Clients that only send a school_id keep the existing creation contract.
    kind: Literal["school", "sponsor", "business", "other"] = "school"
    school_id: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, max_length=160)
    type: str | None = Field(default=None, max_length=80)
    description: str = Field(default="", max_length=500)


class PartnerScope(BaseModel):
    school_ids: list[str] = Field(default_factory=list, max_length=100)
    contact_ids: list[str] = Field(default_factory=list, max_length=500)


class PartnerUpdate(BaseModel):
    data_scope: PartnerScope | None = None
    name: str | None = Field(None, min_length=1, max_length=160)
    type: str | None = Field(None, min_length=1, max_length=80)
    description: str | None = Field(None, max_length=500)
    can_export_reports: bool | None = None
    modules: list[str] | None = None
    can_view_pii: bool | None = None
    active: bool | None = None


@router.get("/users")
def list_users(partner_code: str | None = None, _: CurrentUser = Depends(require_admin)):
    match = {"role": "partner", "partner_code": partner_code} if partner_code else {}
    return list(get_db().users.find(match, USER_FIELDS).sort([("role", 1), ("username", 1)]))


@router.post("/users", status_code=201)
def create_user(body: UserCreate, request: Request, admin: CurrentUser = Depends(require_admin)):
    username = body.username.strip().lower()
    if not re.fullmatch(r"[a-z0-9._-]{3,32}", username):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tên đăng nhập chỉ gồm chữ thường, số, dấu . _ -")
    if body.role == "partner" and not find_partner(get_db(), body.partner_code, active_only=True):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tài khoản đối tác phải chọn mã đối tác hợp lệ")
    validate_password_strength(body.password)
    doc = {
        "username": username,
        "full_name": body.full_name.strip(),
        "role": body.role,
        "partner_code": body.partner_code if body.role == "partner" else None,
        "password_hash": hash_password(body.password),
        "active": True,
        "token_version": 0,
        "created_at": datetime.now(timezone.utc),
        "last_login": None,
    }
    try:
        get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Tên đăng nhập “{username}” đã tồn tại")
    audit("user_create", admin.username, request, detail={"target": username, "partner": doc["partner_code"]})
    return {k: doc[k] for k, included in USER_FIELDS.items() if included and k in doc}


@router.patch("/users/{username}")
def update_user(username: str, body: UserUpdate, request: Request, admin: CurrentUser = Depends(require_admin)):
    db = get_db()
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tài khoản")
    changes: dict = {}
    if body.full_name is not None:
        changes["full_name"] = body.full_name.strip()
    if body.partner_code is not None and body.partner_code != user.get("partner_code"):
        if user["role"] != "partner" or not find_partner(db, body.partner_code, active_only=True):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mã đối tác không hợp lệ")
        changes["partner_code"] = body.partner_code
    if body.active is not None:
        if username == admin.username and not body.active:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Không thể tự khoá tài khoản đang đăng nhập")
        changes["active"] = body.active
    update: dict = {"$set": changes}
    if body.active is False or "partner_code" in changes:
        update["$inc"] = {"token_version": 1}  # đá các phiên đang mở
    if changes:
        db.users.update_one({"_id": user["_id"]}, update)
        audit("user_update", admin.username, request, detail={"target": username, **{k: v for k, v in changes.items()}})
    return db.users.find_one({"_id": user["_id"]}, USER_FIELDS)


@router.post("/users/{username}/reset-password")
def reset_password(username: str, body: PasswordReset, request: Request, admin: CurrentUser = Depends(require_admin)):
    validate_password_strength(body.password)
    res = get_db().users.update_one(
        {"username": username},
        {"$set": {"password_hash": hash_password(body.password)}, "$inc": {"token_version": 1}},
    )
    if res.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tài khoản")
    audit("user_reset_password", admin.username, request, detail={"target": username})
    return {"ok": True}


@router.get("/partners")
def list_partners(_: CurrentUser = Depends(require_admin)):
    db = get_db()
    user_counts = {r["_id"]: r["n"] for r in db.users.aggregate([{"$group": {"_id": "$partner_code", "n": {"$sum": 1}}}])}
    record_counts = {}
    for coll in ("contacts", "leads", "exam_candidates"):
        for r in db[coll].aggregate([{"$unwind": "$partners"}, {"$group": {"_id": "$partners", "n": {"$sum": 1}}}]):
            record_counts.setdefault(r["_id"], {})[coll] = r["n"]
    partners = []
    for p in db.partners.find({"setup_token": {"$exists": False}}).sort("_id", 1):
        code = p.pop("_id")
        records = record_counts.get(code, {})
        if "data_scope" in p:
            scope = p["data_scope"]
            records = {}
            for collection in ("contacts", "leads", "exam_candidates"):
                records[collection] = db[collection].count_documents(partner_data_match(db, {"_id": code, **p}, collection))
            p["data_scope"] = {
                "school_ids": scope.get("school_ids", []),
                "contact_ids": [row["contact_id"] for row in scope.get("contacts", [])],
            }
        partners.append({"code": code, "can_export_reports": True, **p, "users": user_counts.get(code, 0), "records": records})
    return {"partners": partners, "modules": MODULES}


def _school_options() -> dict[str, dict]:
    from etl.normalize import load_schools_master

    return {
        row["school_id"]: {"id": row["school_id"], "name": row["school_name"], "type": row["school_type"]}
        for row in load_schools_master().values()
        if row["school_id"] and row["school_name"]
    }


def _schools_with_records(db, school_ids) -> set[str]:
    match = {"school_id": {"$in": list(school_ids)}}
    return set(db.contacts.distinct("school_id", match)) | set(db.exam_candidates.distinct("school_id", match))


@router.get("/partners/schools")
def list_partner_schools(_: CurrentUser = Depends(require_admin)):
    schools = _school_options()
    with_records = _schools_with_records(get_db(), schools)
    return [
        {**school, "has_data": school["id"] in with_records}
        for school in sorted(schools.values(), key=lambda row: row["name"])
    ]


@router.post("/partners", status_code=201)
def create_partner(body: PartnerCreate, request: Request, response: Response, admin: CurrentUser = Depends(require_admin)):
    code = body.code.strip().upper()
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9_-]{1,31}", code):
        raise HTTPException(400, "Mã đối tác phải có 2–32 ký tự gồm chữ, số, dấu _ hoặc -")
    db = get_db()
    school_ids = []
    if body.kind == "school":
        school_id = (body.school_id or "").strip()
        school = _school_options().get(school_id)
        if not school:
            raise HTTPException(422, "Hãy chọn một trường trong danh mục")
        if not _schools_with_records(db, [school_id]):
            raise HTTPException(422, "Trường này chưa có hồ sơ liên hệ hoặc thí sinh trong dữ liệu")
        name, partner_type = school["name"], school["type"]
        school_ids = [school_id]
    else:
        if body.school_id is not None:
            raise HTTPException(422, "Chỉ đối tác trường học được chọn mã trường khi tạo")
        name = (body.name or "").strip()
        partner_type = PARTNER_TYPE_LABELS.get(body.kind, (body.type or "").strip())
        if not name or not partner_type:
            raise HTTPException(422, "Cần nhập tên tổ chức và loại đối tác")
    now = datetime.now(timezone.utc)
    setup_token = token_hex(16)
    password = settings.seed_partner_password
    if not password:
        raise HTTPException(500, "Cần đặt SEED_PARTNER_PASSWORD trong .env trước khi tạo đối tác")
    if not 8 <= len(password.encode()) <= 72 or password.isalpha() or password.isdigit():
        raise HTTPException(500, "SEED_PARTNER_PASSWORD trong cấu hình không hợp lệ")
    password_hash = hash_password(password)
    doc = {
        "_id": code, "name": name, "type": partner_type, "description": body.description.strip(),
        "modules": ["overview"], "can_view_pii": False, "active": False,
        "can_export_reports": False,
        "data_scope": {"school_ids": school_ids, "contacts": []}, "scope_revision": 0,
        "scope_rule": "Phạm vi do quản trị viên cấu hình.", "created_at": now,
        "setup_token": setup_token,
    }
    try:
        db.partners.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "Mã đối tác đã tồn tại")

    reservation = {"_id": code, "setup_token": setup_token}
    account = None
    try:
        prefix = f"dt-{code.lower()}"
        for attempt in range(5):
            username = prefix[:32] if not attempt else f"{prefix[:25]}-{token_hex(3)}"
            if db.users.find_one({"username": username}, {"_id": 1}):
                continue
            candidate = {
                "_id": f"partner-account:{username}", "username": username,
                "full_name": name, "role": "partner", "partner_code": code,
                "password_hash": password_hash, "active": True, "token_version": 0,
                "created_at": now, "last_login": None,
            }
            try:
                db.users.insert_one(candidate)
            except DuplicateKeyError:
                continue
            account = candidate
            break
        if account is None:
            raise HTTPException(409, "Không thể cấp tên đăng nhập tự động. Vui lòng thử lại")
        updated = db.partners.update_one(reservation, {
            "$set": {"active": True, "default_username": username},
            "$unset": {"setup_token": ""},
        })
        if not updated.matched_count:
            raise HTTPException(409, "Không thể hoàn tất tạo đối tác")
    except Exception:
        # MongoDB có thể chạy standalone. Chỉ hoàn tác khi request này còn giữ chỗ tạo đối tác.
        if db.partners.delete_one(reservation).deleted_count and account is not None:
            db.users.delete_one({"_id": account["_id"], "password_hash": password_hash})
        raise

    detail = {"partner": code, "kind": body.kind, "target": username}
    if school_ids:
        detail["school_id"] = school_ids[0]
    audit("partner_create", admin.username, request, detail=detail)
    response.headers["Cache-Control"] = "no-store"
    return {"code": code, "account": {"username": username, "temporary_password": password}}


@router.patch("/partners/{code}")
def update_partner(code: str, body: PartnerUpdate, request: Request, admin: CurrentUser = Depends(require_admin)):
    changes = {}
    for field in ("name", "type", "description"):
        value = getattr(body, field)
        if value is not None:
            changes[field] = value.strip()
            if field != "description" and not changes[field]:
                raise HTTPException(400, "Tên và loại đối tác không được để trống")
    if body.can_export_reports is not None:
        changes["can_export_reports"] = body.can_export_reports
    if body.modules is not None:
        bad = [m for m in body.modules if m not in MODULES]
        if bad:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Module không hợp lệ: {', '.join(bad)}")
        changes["modules"] = [m for m in MODULES if m in body.modules]
    if body.can_view_pii is not None:
        changes["can_view_pii"] = body.can_view_pii
    if body.active is not None:
        changes["active"] = body.active
    if body.data_scope is not None:
        school_ids = sorted(set(body.data_scope.school_ids))
        if set(school_ids) - _school_options().keys():
            raise HTTPException(422, "Có mã trường không nằm trong danh mục")
        contact_ids = sorted({value.strip() for value in body.data_scope.contact_ids if value.strip()})
        if any(not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", contact_code) for contact_code in contact_ids):
            raise HTTPException(422, "Mã liên hệ không hợp lệ")
        db = get_db()
        previous = find_partner(db, code)
        if not previous:
            raise HTTPException(404, "Không tìm thấy đối tác")
        existing = {row["contact_id"]: row["email"] for row in previous.get("data_scope", {}).get("contacts", [])}
        matches = {row["contact_id"]: row.get("email") for row in db.contacts.find(
            {"contact_id": {"$in": contact_ids}}, {"contact_id": 1, "email": 1},
        )}
        rows = []
        for contact_id in contact_ids:
            email = matches.get(contact_id)
            if contact_id in existing and existing[contact_id] != email:
                raise HTTPException(409, f"Hồ sơ {contact_id} đã đổi định danh. Bỏ gán và xác minh trước khi gán lại")
            if not isinstance(email, str) or not email.strip():
                raise HTTPException(422, f"Không tìm được email xác minh cho hồ sơ {contact_id}")
            rows.append({"contact_id": contact_id, "email": email})
        changes["data_scope"] = {"school_ids": school_ids, "contacts": rows}
        changes["scope_rule"] = "Phạm vi do quản trị viên cấu hình."
    security_fields = {"modules", "active", "can_view_pii", "can_export_reports", "data_scope"}
    update = {"$set": changes}
    if security_fields.intersection(changes):
        update["$inc"] = {"scope_revision": 1}
    res = get_db().partners.update_one({"_id": code}, update) if changes else None
    if res is not None and res.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy đối tác")
    audit_changes = {key: value for key, value in changes.items() if key != "data_scope"}
    if body.data_scope is not None:
        audit_changes["scope"] = {"schools": len(school_ids), "contacts": len(rows)}
    audit("partner_update", admin.username, request, detail={"partner": code, **audit_changes})
    return {"ok": True}


@router.get("/audit")
def audit_log(limit: int = 100, _: CurrentUser = Depends(require_admin)):
    return list(get_db().audit_logs.find({}, {"_id": 0}).sort("at", -1).limit(min(limit, 500)))


@router.get("/imports")
def import_runs(_: CurrentUser = Depends(require_admin)):
    return list(get_db().import_runs.find({}, {"_id": 0}).sort("started_at", -1).limit(10))


ROOT_DIR = Path(__file__).resolve().parents[3]


@router.get("/data-status")
def data_status(_: CurrentUser = Depends(require_admin)):
    """Lấy số lượng bản ghi thực tế trong MongoDB."""
    db = get_db()
    return {
        "contacts": db.contacts.count_documents({}),
        "signups": db.signups.count_documents({}),
        "leads": db.leads.count_documents({}),
        "exam_candidates": db.exam_candidates.count_documents({}),
        "exam_scores": db.exam_scores.count_documents({}),
    }


@router.post("/reload-data")
def reload_data(request: Request, admin: CurrentUser = Depends(require_admin)):
    """Kích hoạt chạy lại pipeline ETL làm sạch và nạp dữ liệu vào MongoDB ngay trên web."""
    try:
        from etl.process_and_seed import run as run_etl
        result = run_etl()
        audit("data_reload", admin.username, request, detail=result)
        return {"ok": True, "message": "Nạp và làm sạch dữ liệu thành công!", "counts": result}
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Lỗi nạp dữ liệu: {e}")


@router.post("/upload-file")
async def upload_file(
    request: Request,
    filename: str = Query(..., description="Tên file đích (VD: Demo_Data_khách_hàng.xlsx hoặc Điểm giả lập.xlsx)"),
    admin: CurrentUser = Depends(require_admin),
):
    """Tải lên file Excel trực tiếp qua web và tự động nạp lại CSDL."""
    body = await request.body()
    if not body:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File tải lên không có dữ liệu")
    if not (filename.endswith(".xlsx") or filename.endswith(".xls") or filename.endswith(".csv")):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Chỉ chấp nhận file định dạng .xlsx, .xls hoặc .csv")

    data_dir = ROOT_DIR / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    target_path = data_dir / filename
    try:
        with open(target_path, "wb") as f:
            f.write(body)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Không thể lưu file: {e}")

    try:
        from etl.process_and_seed import run as run_etl
        result = run_etl()
        audit("data_upload", admin.username, request, detail={"filename": filename, **result})
        return {"ok": True, "message": f"Đã tải lên {filename} và nạp CSDL thành công!", "counts": result}
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Đã lưu file nhưng lỗi khi nạp CSDL: {e}")

