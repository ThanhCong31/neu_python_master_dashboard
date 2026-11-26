"""Danh mục đối tác, module dashboard và quyền mặc định.

Phân quyền gồm 2 lớp:
  1. Module: đối tác được mở trang nào (lưu ở collection `partners`, admin sửa được).
  2. Dòng dữ liệu: mỗi document nghiệp vụ có mảng `partners` gồm mã đối tác được xem nó.
     Quy tắc gắn mã nằm ở etl/tagging.py; API chỉ cần thêm điều kiện {"partners": <mã>}.
"""

def find_partner(db, code: str | None, *, active_only: bool = False) -> dict | None:
    if not code:
        return None
    match = {"_id": code}
    if active_only:
        match["active"] = {"$ne": False}
    return db.partners.find_one(match)


MODULES: dict[str, str] = {
    "overview": "Tổng quan",
    "contacts": "CRM & phễu tuyển sinh",
    "marketing": "Kênh & ROI",
    "leads": "Lead Talkshow & Facebook",
    "exams": "Kết quả thi",
    "sponsorship": "Nhà tài trợ & truyền thông",
    "quality": "Chất lượng dữ liệu",
}

PARTNERS: list[dict] = [
    {
        "code": "DN",
        "name": "Doanh nghiệp",
        "type": "Doanh nghiệp",
        "description": "Đối tác doanh nghiệp / nhà tài trợ",
        "scope_rule": "Kết quả thi toàn bộ thí sinh (nguồn nhân tài), quyền lợi nhà tài trợ, hiệu quả kênh truyền thông. Không xem dữ liệu CRM.",
        "modules": ["overview", "exams", "sponsorship"],
    },
    {
        "code": "NEU",
        "name": "Đại học Kinh tế Quốc dân",
        "type": "Đại học",
        "description": "Trường Đại học Kinh tế Quốc dân (Đơn vị chủ trì / tuyển sinh Bảng B & ĐH)",
        "scope_rule": "Liên hệ, lead và điểm thi thí sinh Bảng B (sinh viên) và thí sinh định hướng xét tuyển NEU.",
        "modules": ["overview", "contacts", "marketing", "leads", "exams"],
    },
    {
        "code": "NH",
        "name": "THPT Chuyên Nguyễn Huệ",
        "type": "THPT",
        "description": "Trường THPT Chuyên Nguyễn Huệ (Trường đối tác nguồn Bảng A)",
        "scope_rule": "Học sinh, lead và kết quả thi của thí sinh thuộc trường THPT Chuyên Nguyễn Huệ (Bảng A).",
        "modules": ["overview", "contacts", "leads", "exams"],
    },
    {
        "code": "THPT",
        "name": "Trường THPT",
        "type": "Khối đối tác",
        "description": "Đối tác trường trung học phổ thông",
        "scope_rule": "Liên hệ, lead và điểm thi thuộc Bảng A (13–18 tuổi, học sinh THCS & THPT).",
        "modules": ["overview", "contacts", "leads", "exams"],
    },
    {
        "code": "DH",
        "name": "Trường Đại học",
        "type": "Khối đối tác",
        "description": "Đối tác trường đại học",
        "scope_rule": "Liên hệ, lead và điểm thi thuộc Bảng B (19–24 tuổi, sinh viên CĐ & ĐH).",
        "modules": ["overview", "contacts", "leads", "exams"],
    },
    {
        "code": "INFO",
        "name": "Info – Đối tác trường",
        "type": "Nguồn dữ liệu",
        "description": "Nguồn UTM partner = info (kênh Đối tác trường)",
        "scope_rule": "Liên hệ được gán kênh Đối tác trường (UTM partner = info) cùng lead, điểm thi và ngân sách của kênh này.",
        "modules": ["overview", "contacts", "marketing", "leads", "exams"],
    },
    {
        "code": "METAADS",
        "name": "Meta Ads",
        "type": "Nguồn dữ liệu",
        "description": "Đối tác quảng cáo Meta Ads (Facebook/Instagram)",
        "scope_rule": "Liên hệ kênh Facebook (UTM partner = metaads hoặc có FB Lead Form), toàn bộ lead FB Lead Form, ngân sách & ROI kênh Facebook.",
        "modules": ["overview", "contacts", "marketing", "leads", "exams"],
    },
    {
        "code": "MIENNAM",
        "name": "Miền Nam",
        "type": "Nguồn dữ liệu",
        "description": "Đối tác khu vực miền Nam",
        "scope_rule": "Liên hệ/lead có UTM partner = miennam, ở tỉnh thành miền Nam hoặc thi tại điểm TP.HCM; điểm thi của thí sinh miền Nam.",
        "modules": ["overview", "contacts", "marketing", "leads", "exams"],
    },
]

PARTNER_CODES = [p["code"] for p in PARTNERS]

# Tài khoản mặc định: 1 admin + 1 tài khoản cho mỗi đối tác
DEFAULT_USERS: list[dict] = [
    {"username": "admin", "full_name": "Quản trị hệ thống", "role": "admin", "partner_code": None},
    {"username": "dn", "full_name": "Đối tác Doanh nghiệp", "role": "partner", "partner_code": "DN"},
    {"username": "neu", "full_name": "Đại học Kinh tế Quốc dân", "role": "partner", "partner_code": "NEU"},
    {"username": "nh", "full_name": "THPT Chuyên Nguyễn Huệ", "role": "partner", "partner_code": "NH"},
    {"username": "thpt", "full_name": "Đối tác Khối THPT", "role": "partner", "partner_code": "THPT"},
    {"username": "dh", "full_name": "Đối tác Khối Đại học", "role": "partner", "partner_code": "DH"},
    {"username": "info", "full_name": "Partner Info", "role": "partner", "partner_code": "INFO"},
    {"username": "metaads", "full_name": "Partner Meta Ads", "role": "partner", "partner_code": "METAADS"},
    {"username": "miennam", "full_name": "Partner Miền Nam", "role": "partner", "partner_code": "MIENNAM"},
]
