"""Integration checks against a separate, temporary MongoDB database."""
import io
import os
from datetime import datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from openpyxl import load_workbook
from docx import Document


PARTNER_PASSWORD = "PartnerTest!2026"


@pytest.fixture
def workspace(monkeypatch):
    uri = os.getenv("NEU_TEST_MONGO_URI")
    if not uri:
        pytest.skip("Đặt NEU_TEST_MONGO_URI để chạy kiểm thử tích hợp MongoDB")
    from pymongo import MongoClient

    name = f"neu_test_{uuid4().hex}"
    monkeypatch.setenv("MONGO_URI", uri)
    monkeypatch.setenv("MONGO_DB_NAME", name)
    monkeypatch.setenv("JWT_SECRET", "test-only-unused-outside-tests-" + uuid4().hex)
    monkeypatch.setenv("COOKIE_SECURE", "false")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "AdminTest!2026")
    monkeypatch.setenv("SEED_PARTNER_PASSWORD", PARTNER_PASSWORD)
    from app import config, db as connection
    from app.main import app
    from app.routers import admin as admin_router
    from etl import seed
    from dataclasses import replace

    db = MongoClient(uri, serverSelectionTimeoutMS=4000)[name]
    monkeypatch.setattr(connection, "settings", replace(config.settings, mongo_uri=uri, mongo_db_name=name))
    monkeypatch.setattr(admin_router, "settings", replace(config.settings, seed_partner_password=PARTNER_PASSWORD))
    monkeypatch.setattr(seed, "settings", replace(config.settings, seed_admin_password="AdminTest!2026",
                                                 seed_partner_password=PARTNER_PASSWORD))
    connection.get_client.cache_clear()
    try:
        seed.seed_partners_and_users(db, False)
        with TestClient(app) as admin, TestClient(app) as client:
            assert admin.post("/api/auth/login", json={"username": "admin", "password": "AdminTest!2026"}).status_code == 200
            yield db, admin, client
    finally:
        connection.get_client.cache_clear()
        db.client.drop_database(name)
        db.client.close()


def test_dynamic_partner_and_monthly_reports(workspace):
    db, admin, client = workspace

    def contact(key, school, month=11, status="Đã thanh toán", assumed=False):
        return {
            "_id": key, "contact_id": key, "full_name": key, "email": f"{key}@example.test",
            "school_id": school, "web_registered": True, "web_registered_at": datetime(2026, month, 1),
            "first_touch": datetime(2026, 10, 1), "payment_status": status, "report_date_assumed": assumed,
            "partners": ["NEU"], "merged_count": 1, "flags": [], "sources": [],
        }

    db.contacts.insert_many([
        contact("PT-001", "HUST"), contact("PT-002", "HUST", status="Miễn phí"),
        contact("PT-003", "NH"), contact("PT-004", "HUST", month=12),
        contact("PT-005", "HUST", assumed=True), contact("PT-006", "NH", status="Chưa thanh toán"),
    ])
    now = datetime(2026, 11, 1)
    db.leads.insert_many([
        {"_id": "L1", "contact_id": "PT-001", "email": "PT-001@example.test", "created_at": now},
        {"_id": "L2", "contact_id": "PT-001", "email": "unrelated@example.test", "created_at": now},
    ])
    profile = {"code": "new-school", "school_id": "HUST"}
    assert client.post("/api/admin/partners", json=profile).status_code == 401
    created = admin.post("/api/admin/partners", json=profile)
    assert created.status_code == 201, created.text
    code = created.json()["code"]
    credentials = created.json()["account"]
    assert created.headers["Cache-Control"] == "no-store"
    username, password = credentials["username"], credentials["temporary_password"]
    assert username == "dt-new-school"
    assert password == PARTNER_PASSWORD
    assert admin.get("/api/admin/users", params={"partner_code": code}).json()[0]["username"] == username
    assert password not in admin.get("/api/admin/users", params={"partner_code": code}).text
    assert password not in admin.get("/api/admin/partners").text
    assert db.users.find_one({"username": username})["password_hash"] != password
    assert client.post("/api/auth/login", json={"username": username, "password": password}).status_code == 200
    assert admin.post(f"/api/admin/users/{username}/reset-password", json={"password": "RotatedSecret#12"}).status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/login", json={"username": username, "password": password}).status_code == 401
    assert admin.post("/api/admin/partners", json=profile).status_code == 409
    assert code in {p["code"] for p in admin.get("/api/meta/options").json()["partners"]}
    partner = db.partners.find_one({"_id": code})
    assert partner["name"] == "Đại học Bách Khoa Hà Nội"
    assert partner["type"] == "Đại học"
    assert partner["data_scope"] == {"school_ids": ["HUST"], "contacts": []}
    edit = f"/api/admin/partners/{code}"
    assert admin.patch(edit, json={"data_scope": {"school_ids": ["UNKNOWN"]}}).status_code == 422
    permissions = {"modules": ["overview", "contacts", "leads"], "can_export_reports": True}
    assert admin.patch(edit, json=permissions).status_code == 200
    assert admin.get("/api/contacts/list", params={"partner": code}).json()["total"] == 4
    assert admin.patch(edit, json={"data_scope": {"school_ids": ["HUST"], "contact_ids": ["PT-006"]}}).status_code == 200

    account = {"username": "client-user", "full_name": "Client test", "role": "partner",
               "partner_code": code, "password": "ClientTest!2026"}
    assert admin.post("/api/admin/users", json=account).status_code == 201
    assert client.post("/api/auth/login", json={"username": account["username"], "password": account["password"]}).status_code == 200
    assert client.get("/api/contacts/list", params={"q": "PT-003", "partner": "NEU"}).json()["total"] == 0
    assert client.get("/api/contacts/list", params={"q": "PT-006"}).json()["total"] == 1
    assert client.get("/api/leads/list").json()["total"] == 1
    assert admin.get("/api/contacts/list", params={"partner": "NEU"}).json()["total"] == 6
    db.contacts.update_one({"_id": "PT-006"}, {"$set": {"email": "reused@example.test"}})
    assert client.get("/api/contacts/list", params={"q": "PT-006"}).json()["total"] == 0
    db.contacts.update_one({"_id": "PT-006"}, {"$set": {"email": "PT-006@example.test"}})

    path = "/api/overview/monthly"
    month = {"month": "2026-11"}
    assert client.get(path + "/preview", params={"month": "2026-13"}).status_code == 422
    assert client.get(path + "/preview", params={**month, "partner": "NEU"}).status_code == 403
    preview = client.get(path + "/preview", params=month)
    assert preview.status_code == 200, preview.text
    data = preview.json()
    sections = {title: dict(rows[1:]) for title, rows in data["sections"]}
    assert sections["Đăng ký website"]["Liên hệ đăng ký trong kỳ"] == 3
    fees = sections["Tình trạng đóng phí của nhóm đăng ký trong kỳ"]
    assert (fees["Ghi nhận đã đóng phí"], fees["Miễn phí"], fees["Chưa thanh toán"]) == (1, 1, 1)
    assert sections["Lead từ biểu mẫu"]["Dòng biểu mẫu tiếp nhận trong kỳ"] == 1
    payload = {**month, "preview_id": data["preview_id"]}
    saved = client.post(path, json=payload)
    assert saved.status_code == 201, saved.text
    report_id = saved.json()["_id"]
    assert client.post(path, json=payload).json()["_id"] == report_id
    assert len(client.get(path, params=month).json()["reports"]) == 1
    download = f"{path}/{report_id}/download"
    xlsx = client.get(download, params={"format": "xlsx"})
    assert xlsx.status_code == 200
    workbook = load_workbook(io.BytesIO(xlsx.content))
    assert workbook["Đăng ký website"]["B4"].value == 3
    assert client.get(download, params={"format": "pdf"}).content.startswith(b"%PDF")
    response = client.get(download, params={"format": "docx"})
    assert response.status_code == 200
    assert "theo tháng" in Document(io.BytesIO(response.content)).paragraphs[0].text
    db.monthly_reports.update_one({"_id": report_id}, {"$unset": {"files.docx": ""}})
    assert "theo tháng" in Document(io.BytesIO(client.get(download, params={"format": "docx"}).content)).paragraphs[0].text

    for params, expected, key in [
        ({"kind": "quarter", "year": 2026, "quarter": 4}, 4, "2026-Q4"),
        ({"kind": "range", "start_date": "2026-11-01", "end_date": "2026-11-01"}, 3, "2026-11-01_2026-11-01"),
    ]:
        period_preview = client.get(path + "/preview", params=params)
        assert period_preview.status_code == 200, period_preview.text
        period_data = period_preview.json()
        period_stats = {title: dict(rows[1:]) for title, rows in period_data["sections"]}
        assert period_stats["Đăng ký website"]["Liên hệ đăng ký trong kỳ"] == expected
        period_saved = client.post(path, json={**params, "preview_id": period_data["preview_id"]})
        assert period_saved.status_code == 201, period_saved.text
        assert period_saved.json()["period_key"] == key
        assert client.get(path, params=params).json()["reports"] == [period_saved.json()]
        for kind in ("pdf", "docx", "xlsx"):
            file = client.get(f"{path}/{period_saved.json()['_id']}/download", params={"format": kind})
            assert file.status_code == 200 and key in file.headers["Content-Disposition"]
    old_reports = client.get(path, params={"kind": "range"}).json()["reports"]
    assert [report["period_key"] for report in old_reports] == ["2026-11-01_2026-11-01"]
    assert client.get(path + "/preview", params={"kind": "range", "start_date": "2026-12-01", "end_date": "2026-11-30"}).status_code == 422
    assert client.get(download, params={"format": "pdf", "partner": "NEU"}).status_code == 403
    assert admin.get(download, params={"format": "pdf", "partner": "NEU"}).status_code == 404

    db.contacts.update_one({"_id": "PT-006"}, {"$set": {"payment_status": "Đã thanh toán"}})
    assert client.post(path, json=payload).status_code == 409
    assert client.get(download, params={"format": "xlsx"}).content == xlsx.content
    assert admin.patch(edit, json={"data_scope": {"school_ids": ["HUST"]}}).status_code == 200
    assert client.get(download, params={"format": "xlsx"}).status_code == 404
    assert admin.get(download, params={"format": "xlsx", "partner": code}).content == xlsx.content
    assert admin.patch(edit, json={"can_export_reports": False}).status_code == 200
    assert client.get(path, params=month).status_code == 403
    assert admin.patch(edit, json={"active": False}).status_code == 200
    assert client.get("/api/contacts/list").status_code == 401


def test_partner_creation_requires_a_school_with_records(workspace):
    db, admin, client = workspace
    path = "/api/admin/partners"
    assert client.get(path + "/schools").status_code == 401
    assert admin.post(path, json={"code": "school-test"}).status_code == 422
    assert admin.post(path, json={"code": "school-test", "school_id": "UNKNOWN"}).status_code == 422
    assert admin.post(path, json={"code": "school-test", "school_id": "NH"}).status_code == 422
    assert db.partners.find_one({"_id": "SCHOOL-TEST"}) is None
    assert db.users.find_one({"partner_code": "SCHOOL-TEST"}) is None

    db.exam_candidates.insert_one({"school_id": "NH"})
    db.contacts.insert_one({"school_id": "NEU"})
    options = {row["id"]: row for row in admin.get(path + "/schools").json()}
    assert options["NH"]["type"] == "THPT" and options["NH"]["has_data"]
    assert options["NEU"]["type"] == "Đại học" and options["NEU"]["has_data"]
    assert not options["HUST"]["has_data"]
    response = admin.post(path, json={"code": "school-test", "school_id": "NH"})
    assert response.status_code == 201, response.text
    partner = next(row for row in admin.get(path).json()["partners"] if row["code"] == "SCHOOL-TEST")
    assert partner["data_scope"] == {"school_ids": ["NH"], "contact_ids": []}
    assert partner["records"] == {"contacts": 0, "leads": 0, "exam_candidates": 1}


def test_non_school_partner_creation_starts_with_empty_scope(workspace):
    db, admin, client = workspace
    path = "/api/admin/partners"
    db.contacts.insert_one({"contact_id": "DEMO", "email": "demo@example.test", "partners": ["ORG-SPONSOR"]})
    for kind, label, fields in [
        ("sponsor", "Nhà tài trợ", {}),
        ("business", "Doanh nghiệp hợp tác", {}),
        ("other", "Đơn vị truyền thông", {"type": "Đơn vị truyền thông"}),
    ]:
        code = f"ORG-{kind.upper()}"
        response = admin.post(path, json={"code": code, "kind": kind, "name": "Tổ chức thử", **fields})
        assert response.status_code == 201, response.text
        stored = db.partners.find_one({"_id": code})
        assert stored["type"] == label
        assert stored["data_scope"] == {"school_ids": [], "contacts": []}
        assert stored["modules"] == ["overview"]
        assert not stored["can_export_reports"] and not stored["can_view_pii"]
        account = response.json()["account"]
        assert client.post("/api/auth/login", json={
            "username": account["username"], "password": account["temporary_password"],
        }).status_code == 200
    partners = {p["code"]: p for p in admin.get(path).json()["partners"]}
    assert partners["ORG-SPONSOR"]["records"] == {"contacts": 0, "leads": 0, "exam_candidates": 0}
    assert admin.post(path, json={"code": "BAD-ORG", "kind": "other", "name": "Tổ chức thử"}).status_code == 422
    assert admin.post(path, json={"code": "BAD-ORG", "kind": "business", "name": " "}).status_code == 422
    assert admin.post(path, json={
        "code": "BAD-ORG", "kind": "sponsor", "name": "Tổ chức thử", "school_id": "NEU",
    }).status_code == 422
    assert db.partners.find_one({"_id": "BAD-ORG"}) is None


def test_stage_reports_use_program_scope_and_milestones(workspace):
    db, admin, client = workspace
    base = "/api/overview/monthly"
    assert client.get(base + "/stages").status_code == 401
    stages = admin.get(base + "/stages").json()["stages"]
    assert [item["id"] for item in stages] == ["registration", "qualifier", "results", "final"]
    assert stages[2]["schedule"] == "Sau vòng loại"
    assert admin.get(base + "/preview", params={"kind": "stage", "partner": "NEU"}).status_code == 422

    registrations = [
        ("before-cutoff", datetime(2026, 9, 25, 11, 59), False),
        ("after-cutoff", datetime(2026, 9, 25, 12), False),
        ("assumed", datetime(2026, 9, 24, 9), True),
    ]
    db.contacts.insert_many([
        {"_id": key, "partners": ["NEU"], "web_registered": True,
         "web_registered_at": when, "report_date_assumed": assumed, "payment_status": "Miễn phí"}
        for key, when, assumed in registrations
    ])
    db.exam_candidates.insert_many([
        {"dataset": "PM119", "partners": ["NEU"], "qualifier": {"total": 710},
         "final": {"total": 830}, "advanced": True},
        {"dataset": "PM119", "partners": ["NEU"], "qualifier": {"total": 550},
         "final": None, "advanced": False},
        {"dataset": "PM119", "partners": ["NH"], "qualifier": {"total": 990},
         "final": {"total": 990}, "advanced": True},
        {"dataset": "OTHER", "partners": ["NEU"], "qualifier": {"total": 999},
         "final": {"total": 999}, "advanced": True},
    ])

    def preview(stage):
        params = {"kind": "stage", "stage": stage, "partner": "NEU"}
        response = admin.get(base + "/preview", params=params)
        assert response.status_code == 200, response.text
        report = response.json()
        sections = {title: dict(rows[1:]) for title, rows in report["sections"]}
        return params, report, sections

    _, _, registration = preview("registration")
    assert registration["Đăng ký website"]["Liên hệ đăng ký trong kỳ"] == 1
    assert registration["Tình trạng đóng phí của nhóm đăng ký trong kỳ"]["Miễn phí"] == 1
    _, _, qualifier = preview("qualifier")
    assert qualifier["Vòng loại"]["Thí sinh có điểm"] == 2
    assert qualifier["Vòng loại"]["Điểm trung bình"] == 630
    _, _, results = preview("results")
    assert results["Thông tin báo cáo"]["Lịch chương trình"] == "Sau vòng loại"
    assert results["Công bố kết quả"]["Thí sinh có điểm vòng loại được đánh dấu vào chung kết"] == 1

    params, report, final = preview("final")
    assert final["Vòng chung kết"]["Điểm cao nhất"] == 830
    saved = admin.post(base, json={**params, "preview_id": report["preview_id"]})
    assert saved.status_code == 201, saved.text
    assert saved.json()["period_key"] == "PM119-2026-final"
    assert admin.get(base, params=params).json()["reports"] == [saved.json()]
    assert not admin.get(base, params={**params, "stage": "qualifier"}).json()["reports"]
    download = f"{base}/{saved.json()['_id']}/download"
    assert "theo giai đoạn" in Document(io.BytesIO(admin.get(download, params={
        "partner": "NEU", "format": "docx",
    }).content)).paragraphs[0].text
