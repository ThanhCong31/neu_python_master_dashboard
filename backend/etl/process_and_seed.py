"""Xử lý làm sạch và chuẩn hoá dữ liệu từ 2 file (file điểm giả lập làm gốc)
và nạp trực tiếp vào MongoDB Atlas.
"""

import io
import math
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR / "backend"))

from app.config import settings
from app.db import get_db
from app.partners import DEFAULT_USERS, MODULES, PARTNERS
from app.security import hash_password
from etl.normalize import (
    clean, norm_province, norm_school, region_of, to_date_str, to_dt, to_float, to_int, to_phone, yes
)
from etl.tagging import channel_partners, contact_partners, exam_partners, lead_partners

# Cấu hình ngưỡng thi COS Pro
PARAMS = {
    "certificate_threshold": 600.0,
    "top_ratio": 0.1,
    "grade_excellent": 800.0,
    "grade_good": 650.0,
    "grade_average": 500.0,
}

STRUCTURE = [
    {"board": "Bảng A", "round": "qualifier", "round_label": "Vòng loại", "level": "COS Pro Level 3", "section": "reading", "section_label": "Đọc hiểu code", "max_score": 450.0},
    {"board": "Bảng A", "round": "qualifier", "round_label": "Vòng loại", "level": "COS Pro Level 3", "section": "design", "section_label": "Design · viết hàm", "max_score": 350.0},
    {"board": "Bảng A", "round": "qualifier", "round_label": "Vòng loại", "level": "COS Pro Level 3", "section": "debugging", "section_label": "Debugging", "max_score": 200.0},
    {"board": "Bảng A", "round": "final", "round_label": "Chung kết", "level": "COS Pro Level 2", "section": "reading", "section_label": "Đọc hiểu code", "max_score": 350.0},
    {"board": "Bảng A", "round": "final", "round_label": "Chung kết", "level": "COS Pro Level 2", "section": "design", "section_label": "Design · viết hàm", "max_score": 400.0},
    {"board": "Bảng A", "round": "final", "round_label": "Chung kết", "level": "COS Pro Level 2", "section": "debugging", "section_label": "Debugging", "max_score": 250.0},
    {"board": "Bảng B", "round": "qualifier", "round_label": "Vòng loại", "level": "COS Pro Level 2", "section": "reading", "section_label": "Đọc hiểu code", "max_score": 450.0},
    {"board": "Bảng B", "round": "qualifier", "round_label": "Vòng loại", "level": "COS Pro Level 2", "section": "design", "section_label": "Design · viết hàm", "max_score": 250.0},
    {"board": "Bảng B", "round": "qualifier", "round_label": "Vòng loại", "level": "COS Pro Level 2", "section": "debugging", "section_label": "Debugging", "max_score": 300.0},
    {"board": "Bảng B", "round": "final", "round_label": "Chung kết", "level": "COS Pro Level 1", "section": "reading", "section_label": "Đọc hiểu code", "max_score": 350.0},
    {"board": "Bảng B", "round": "final", "round_label": "Chung kết", "level": "COS Pro Level 1", "section": "design", "section_label": "Design · viết hàm", "max_score": 400.0},
    {"board": "Bảng B", "round": "final", "round_label": "Chung kết", "level": "COS Pro Level 1", "section": "debugging", "section_label": "Debugging", "max_score": 250.0},
]


def grade_of(score: float | None) -> str | None:
    if score is None or pd.isna(score):
        return None
    if score >= 800:
        return "Giỏi"
    if score >= 650:
        return "Khá"
    if score >= 500:
        return "Trung bình"
    return "Yếu"


def process_scores(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Tính toán và sửa tất cả các cột #REF! trong bảng điểm 119 thí sinh."""
    df = df.copy()
    
    # 1. Ép kiểu các cột điểm
    num_cols = [
        "VL – Đọc hiểu code", "VL – Design (thiết kế · viết hàm)", "VL – Debugging",
        "CK – Đọc hiểu code", "CK – Design", "CK – Debugging"
    ]
    for c in num_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
            
    # Tính VL – Tổng
    vl_sum = df[["VL – Đọc hiểu code", "VL – Design (thiết kế · viết hàm)", "VL – Debugging"]].fillna(0).sum(axis=1)
    df["VL – Tổng (/1000)"] = vl_sum
    
    # Tính CK – Tổng
    has_ck = df["CK – Đọc hiểu code"].notna() | df["CK – Design"].notna() | df["CK – Debugging"].notna()
    ck_sum = df[["CK – Đọc hiểu code", "CK – Design", "CK – Debugging"]].fillna(0).sum(axis=1)
    df["CK – Tổng (/1000)"] = np.where(has_ck, ck_sum, np.nan)
    
    # 2. Xếp hạng Vòng loại trong từng Bảng
    df["VL – Hạng trong bảng"] = 0
    df["Vượt vòng loại (Top 10%)"] = "Không"
    
    for board in ["Bảng A", "Bảng B"]:
        mask = df["Bảng"] == board
        sub = df[mask]
        ranks = sub["VL – Tổng (/1000)"].rank(ascending=False, method="min").astype(int)
        df.loc[mask, "VL – Hạng trong bảng"] = ranks
        
        # Top 10%
        n_top = math.ceil(len(sub) * 0.10)
        df.loc[mask & (df["VL – Hạng trong bảng"] <= n_top), "Vượt vòng loại (Top 10%)"] = "Có"

    # 3. Xếp hạng Chung kết trong từng Bảng
    df["CK – Hạng trong bảng"] = np.nan
    for board in ["Bảng A", "Bảng B"]:
        mask = (df["Bảng"] == board) & df["CK – Tổng (/1000)"].notna()
        if mask.any():
            sub = df[mask]
            ranks = sub["CK – Tổng (/1000)"].rank(ascending=False, method="min").astype(int)
            df.loc[mask, "CK – Hạng trong bảng"] = ranks

    # 4. Xếp loại VL & CK
    df["VL – Xếp loại"] = df["VL – Tổng (/1000)"].apply(grade_of)
    df["CK – Xếp loại"] = df["CK – Tổng (/1000)"].apply(grade_of)
    
    # 5. Chứng chỉ COS Pro (>= 600 ở VL hoặc CK)
    max_score = df[["VL – Tổng (/1000)", "CK – Tổng (/1000)"]].max(axis=1)
    df["Chứng chỉ COS Pro (≥600)"] = np.where(max_score >= 600, "Có", "Không")
    
    # 6. STT đạt chứng chỉ
    cert_stt = 1
    stt_list = []
    for val in df["Chứng chỉ COS Pro (≥600)"]:
        if val == "Có":
            stt_list.append(cert_stt)
            cert_stt += 1
        else:
            stt_list.append(np.nan)
    df["STT đạt chứng chỉ"] = stt_list
    df["Dữ liệu giả lập"] = "Có"

    # 7. Tạo sheet Chi_tiet_diem (372 dòng)
    details = []
    max_dict = {(s["board"], s["round"], s["section"]): (s["max_score"], s["level"]) for s in STRUCTURE}
    
    for _, row in df.iterrows():
        email = row["Email"]
        name = row["Họ tên"]
        board = row["Bảng"]
        
        # Vòng loại
        vl_sec = [
            ("reading", "Đọc hiểu code", row.get("VL – Đọc hiểu code")),
            ("design", "Design · viết hàm", row.get("VL – Design (thiết kế · viết hàm)")),
            ("debugging", "Debugging", row.get("VL – Debugging")),
        ]
        for sec_key, sec_name, sc in vl_sec:
            if pd.notna(sc):
                mx, lvl = max_dict.get((board, "qualifier", sec_key), (450.0, "COS Pro Level 2"))
                details.append({
                    "Email": email, "Họ tên": name, "Bảng": board,
                    "Vòng": "Vòng loại", "Cấp COS Pro": lvl, "Phần thi": sec_name,
                    "Điểm": float(sc), "Điểm tối đa": float(mx),
                    "% điểm": round(float(sc) / float(mx), 2),
                    "Dữ liệu giả lập": "Có"
                })
                
        # Chung kết
        if pd.notna(row.get("CK – Tổng (/1000)")):
            ck_sec = [
                ("reading", "Đọc hiểu code", row.get("CK – Đọc hiểu code")),
                ("design", "Design · viết hàm", row.get("CK – Design")),
                ("debugging", "Debugging", row.get("CK – Debugging")),
            ]
            for sec_key, sec_name, sc in ck_sec:
                if pd.notna(sc):
                    mx, lvl = max_dict.get((board, "final", sec_key), (350.0, "COS Pro Level 1"))
                    details.append({
                        "Email": email, "Họ tên": name, "Bảng": board,
                        "Vòng": "Chung kết", "Cấp COS Pro": lvl, "Phần thi": sec_name,
                        "Điểm": float(sc), "Điểm tối đa": float(mx),
                        "% điểm": round(float(sc) / float(mx), 2),
                        "Dữ liệu giả lập": "Có"
                    })
                    
    df_details = pd.DataFrame(details)
    return df, df_details


def find_score_file() -> tuple[Path, str]:
    candidates = [
        ROOT_DIR / "data" / "Diểm giả lập.xlsx",
        ROOT_DIR / "data" / "diem_gia_lap_119_thi_sinh.xlsx",
        ROOT_DIR / "data" / "File_Diem_Cua_Ban.xlsx",
        ROOT_DIR / "File_Diem_Cua_Ban.xlsx",
        ROOT_DIR / "Diểm giả lập.xlsx",
    ]
    for p in candidates:
        if p.exists():
            import openpyxl
            wb = openpyxl.load_workbook(p, read_only=True)
            for s in ["Tong_hop", "Tong-hop"]:
                if s in wb.sheetnames:
                    return p, s
    raise FileNotFoundError("Không tìm thấy file điểm trong thư mục data!")


def find_demo_file() -> Path:
    candidates = [
        ROOT_DIR / "data" / "Demo_Data_khách_hàng.xlsx",
        ROOT_DIR / "Demo_Data_khách_hàng.xlsx",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError("Không tìm thấy file Demo_Data_khách_hàng.xlsx!")


def run():
    print("=== BẮT ĐẦU XỬ LÝ DỮ LIỆU & NẠP VÀO MONGODB ===")
    
    score_file, score_sheet = find_score_file()
    demo_file = find_demo_file()
    print(f"-> Sử dụng file điểm gốc: {score_file.name} (sheet: '{score_sheet}')")
    print(f"-> Sử dụng file đăng ký: {demo_file.name}")
    
    df_score_raw = pd.read_excel(score_file, sheet_name=score_sheet)
    df_reg = pd.read_excel(demo_file, sheet_name="Data đăng ký pythonmaster.vn")
    df_talkshow = pd.read_excel(demo_file, sheet_name="Data tham gia webinar từ Google")
    df_fb = pd.read_excel(demo_file, sheet_name="Data tham gia từ Facebook Ads")
    
    # 1. Tính toán điểm chuẩn
    print(f"-> Đang tính toán và làm sạch điểm thi 119 thí sinh...")
    df_score_clean, df_details = process_scores(df_score_raw)
    
    # Lưu lại file Excel chuẩn
    with pd.ExcelWriter(score_file, engine="openpyxl") as writer:
        df_score_clean.to_excel(writer, sheet_name="Tong_hop", index=False)
        df_details.to_excel(writer, sheet_name="Chi_tiet_diem", index=False)
    print(f"✓ Đã cập nhật file: {score_file.name} (Tong_hop: {len(df_score_clean)}, Chi_tiet_diem: {len(df_details)})")

    # 2. Chuẩn bị tài liệu MongoDB
    db = get_db()
    db.client.admin.command("ping")
    print(f"✓ Kết nối MongoDB Atlas OK -> Database `{settings.mongo_db_name}`")

    # Xóa dữ liệu cũ của các bảng chính
    collections = [
        "contacts", "signups", "leads", "exam_candidates", "exam_scores",
        "raw_web_signups", "raw_talkshow", "raw_fb_leads", "channel_budgets",
        "media_reach", "sponsor_benefits", "meta"
    ]
    for c in collections:
        db[c].delete_many({})

    # Tạo contacts & signups
    contacts = []
    signups = []
    candidates = []
    scores = []
    
    now = datetime.now(timezone.utc)
    
    for idx, r in df_reg.iterrows():
        stt = idx + 1
        cid = f"PT-{stt:03d}"
        score_row = df_score_clean[df_score_clean["Email"] == r["pm-email"]].iloc[0]
        
        is_paid = r["payment_status"] == "completed"
        province = norm_province(r.get("pm-tinhthanh"))
        board = r.get("pm-bang")
        school = r.get("pm-truong")
        school_info = norm_school(school)
        email = r.get("pm-email")
        name = r.get("pm-hoten")
        partner_tag = clean(r.get("partner"))
        
        # Tags đối tác (Hỗ trợ mở rộng theo đối tác cụ thể và nhóm)
        p_tags = []
        school_lower = str(school or "").lower()
        if "nguyễn huệ" in school_lower or "nguyen hue" in school_lower:
            p_tags.append("NH")
        if "kinh tế quốc dân" in school_lower or "neu" in school_lower:
            p_tags.append("NEU")
        if board == "Bảng A":
            p_tags.append("THPT")
        if board == "Bảng B":
            p_tags.append("DH")
            p_tags.append("NEU")
        if partner_tag:
            p_tags.append(str(partner_tag).upper())
        if province in ["TP. Hồ Chí Minh", "Bình Dương", "Đồng Nai", "Cần Thơ", "Lâm Đồng", "Khánh Hòa"]:
            p_tags.append("MIENNAM")
        p_tags = sorted(list(set(p_tags)))
        
        reg_dt = to_dt(r.get("date")) or datetime(2026, 8, 1, tzinfo=timezone.utc)
        
        contact_doc = {
            "_id": cid,
            "contact_id": cid,
            "full_name": name,
            "email": email,
            "phone": to_phone(r.get("pm-sdt")),
            "board": board,
            "province": province,
            "region": region_of(province),
            "school": school_info["school"],
            "school_type": school_info["school_type"],
            "school_id": school_info["school_id"],
            "web_registered": True,
            "payment_status": "Đã thanh toán" if is_paid else "Chưa thanh toán",
            "paid": is_paid,
            "is_paid_monetary": is_paid,
            "is_registered_valid": is_paid,
            "fee": 500000.0,
            "revenue": 500000.0 if is_paid else 0.0,
            "has_external": False,
            "talkshow_form": False,
            "fb_form": False,
            "wants_talkshow": None,
            "question": None,
            "self_declared": "Có",
            "merged_count": 1,
            "data_rows": 1,
            "sources": ["Website"],
            "source_combo": "Website",
            "first_touch": reg_dt,
            "web_registered_at": reg_dt,
            "segment": "Đã thanh toán" if is_paid else "Chưa thanh toán",
            "segment_name": "Nhóm hoàn tất" if is_paid else "Nhóm tiềm năng",
            "sub_segment": board,
            "drip": "Drip-1",
            "flags": [],
            "pic": "Ban Tuyển Sinh",
            "notes": clean(r.get("ghi chu")),
            "utm_partners": [partner_tag] if partner_tag else [],
            "promo_codes": [],
            "dob": to_date_str(r.get("pm-ngaysinh")),
            "cccd": clean(r.get("pm-cccd")),
            "channel_base": "Website" if not partner_tag else partner_tag,
            "channel": "Website" if not partner_tag else partner_tag,
            "channel_is_assumed": False,
            "exam_venue": "Hà Nội" if region_of(province) == "Miền Bắc" else "TP.HCM",
            "exam_venue_address": "Cơ sở PTIT",
            "partners": p_tags
        }
        contacts.append(contact_doc)
        
        signups.append({
            "row_no": stt + 1,
            "contact_id": cid,
            "is_kept": True,
            "status": "Giữ",
            "registered_at": reg_dt,
            "full_name": name,
            "full_name_raw": name,
            "email": email,
            "email_raw": email,
            "phone": to_phone(r.get("pm-sdt")),
            "phone_raw": clean(r.get("pm-sdt")),
            "board": board,
            "province": province,
            "region": region_of(province),
            "school": school,
            "school_raw": school,
            "dob": to_date_str(r.get("pm-ngaysinh")),
            "cccd": clean(r.get("pm-cccd")),
            "fee": 500000.0,
            "payment_status": "completed" if is_paid else "pending",
            "utm_partner": partner_tag,
            "promo_code": None,
            "pic": "Ban Tuyển Sinh",
            "note": clean(r.get("ghi chu")),
            "partners": p_tags
        })
        
        # Exam Candidate Doc
        cand_id = f"PM119:{stt:03d}"
        vl_total = float(score_row["VL – Tổng (/1000)"])
        ck_total = float(score_row["CK – Tổng (/1000)"]) if pd.notna(score_row["CK – Tổng (/1000)"]) else None
        
        cand_school_info = norm_school(school)
        cand_doc = {
            "_id": cand_id,
            "dataset": "PM119",
            "stt": stt,
            "contact_id": cid,
            "email": email,
            "full_name": name,
            "board": board,
            "school": cand_school_info["school"],
            "school_type": cand_school_info["school_type"],
            "school_id": cand_school_info["school_id"],
            "province": province,
            "region": region_of(province),
            "paid": is_paid,
            "is_paid_monetary": is_paid,
            "is_registered_valid": is_paid,
            "simulated": True,
            "qualifier": {
                "level": score_row.get("VL – Cấp COS Pro"),
                "sections": {
                    "reading": float(score_row["VL – Đọc hiểu code"]) if pd.notna(score_row.get("VL – Đọc hiểu code")) else 0,
                    "design": float(score_row["VL – Design (thiết kế · viết hàm)"]) if pd.notna(score_row.get("VL – Design (thiết kế · viết hàm)")) else 0,
                    "debugging": float(score_row["VL – Debugging"]) if pd.notna(score_row.get("VL – Debugging")) else 0,
                },
                "total": vl_total,
                "rank": int(score_row["VL – Hạng trong bảng"]),
                "grade": score_row["VL – Xếp loại"]
            },
            "final": {
                "level": score_row.get("CK – Cấp COS Pro"),
                "sections": {
                    "reading": float(score_row["CK – Đọc hiểu code"]) if pd.notna(score_row.get("CK – Đọc hiểu code")) else 0,
                    "design": float(score_row["CK – Design"]) if pd.notna(score_row.get("CK – Design")) else 0,
                    "debugging": float(score_row["CK – Debugging"]) if pd.notna(score_row.get("CK – Debugging")) else 0,
                },
                "total": ck_total,
                "rank": int(score_row["CK – Hạng trong bảng"]) if pd.notna(score_row["CK – Hạng trong bảng"]) else None,
                "grade": score_row["CK – Xếp loại"]
            } if ck_total is not None else None,
            "advanced": score_row["Vượt vòng loại (Top 10%)"] == "Có",
            "best_total": max([x for x in [vl_total, ck_total] if x is not None]),
            "certificate": score_row["Chứng chỉ COS Pro (≥600)"] == "Có",
            "partners": ["DN"] + p_tags
        }
        candidates.append(cand_doc)

    # 3. Exam Scores
    for _, dr in df_details.iterrows():
        c_doc = next(c for c in candidates if c["email"] == dr["Email"])
        rnd_key = "qualifier" if dr["Vòng"] == "Vòng loại" else "final"
        sec_name = dr["Phần thi"]
        sec_key = "reading" if "đọc hiểu" in sec_name.lower() else ("design" if "design" in sec_name.lower() else "debugging")
        scores.append({
            "dataset": "PM119",
            "candidate_id": c_doc["_id"],
            "contact_id": c_doc["contact_id"],
            "email": dr["Email"],
            "full_name": dr["Họ tên"],
            "board": dr["Bảng"],
            "round": rnd_key,
            "round_label": dr["Vòng"],
            "level": dr["Cấp COS Pro"],
            "section": sec_key,
            "section_label": sec_name,
            "score": float(dr["Điểm"]),
            "max_score": float(dr["Điểm tối đa"]),
            "percent": round(float(dr["Điểm"]) / float(dr["Điểm tối đa"]), 4),
            "partners": c_doc["partners"],
        })

    # 3.5. Xử lý và làm sạch 59 Lead từ 2 form bên ngoài (Talkshow Google Form & FB Lead Form)
    print("-> Đang làm sạch và phân tích 59 leads từ Talkshow & Facebook Ads...")
    leads = []
    contact_by_email = {c["email"].lower(): c for c in contacts if c.get("email")}
    contact_by_phone = {c["phone"]: c for c in contacts if c.get("phone")}
    seen_email = dict(contact_by_email)
    seen_phone = dict(contact_by_phone)

    # 3.5.1. Talkshow Google Form (28 dòng)
    for idx, r in df_talkshow.iterrows():
        row_no = idx + 2
        name = clean(r.get("1. Họ và Tên"))
        phone = to_phone(r.get("2. Số điện thoại"))
        email = clean(r.get("3. Email"))
        email_lower = email.lower() if email else None
        heard_from = clean(r.get("5. Bạn biết về Talkshow qua đâu?"))
        self_dec_raw = str(r.get("6. Bạn đã ghi danh đấu trường Python Master 2026 chưa?") or "")
        self_declared = "Chưa đăng ký" if "chưa" in self_dec_raw.lower() else ("Đã đăng ký" if any(kw in self_dec_raw.lower() for kw in ("rồi", "đã", "có")) else "Chưa đăng ký")
        
        b_raw = str(r.get("7. Bạn đang quan tâm đến bảng đấu nào?") or "").lower()
        board_interest = "Bảng A" if "bảng a" in b_raw else ("Bảng B" if "bảng b" in b_raw else "Bảng B")
        
        school_raw = clean(r.get("4. Trường đang theo học"))
        school_info = norm_school(school_raw)
        question = clean(r.get("8. Câu hỏi dành cho BTC"))
        pic = clean(r.get("Link form: https://docs.google.com/forms/d/1GxVr7rGHSKuXOLFNQ4C1ICwapRT7TS8L1P6b-wNtRUk/edit")) or "Nhung"
        created_at = to_dt(r.get("Timestamp")) or datetime(2026, 8, 26, 19, 0, tzinfo=timezone.utc)
        province = school_info.get("province") or "Hà Nội"
        region = school_info.get("region") or "Miền Bắc"

        matched = (contact_by_email.get(email_lower) if email_lower else None) or (contact_by_phone.get(phone) if phone else None)
        if matched:
            result = "Đã có trong Data"
            cid = matched["_id"]
            matched["has_external"] = True
            matched["talkshow_form"] = True
            matched["wants_talkshow"] = True
            if question and not matched.get("question"):
                matched["question"] = question
            if "Talkshow" not in matched.get("sources", []):
                matched["sources"].append("Talkshow")
                matched["source_combo"] = " + ".join(matched["sources"])
        else:
            prev = (seen_email.get(email_lower) if email_lower else None) or (seen_phone.get(phone) if phone else None)
            if prev:
                result = "Trùng trong form ngoài"
                cid = prev["_id"]
            else:
                result = "Lead mới"
                next_stt = len(contacts) + 1
                cid = f"PT-{next_stt:03d}"
                new_contact = {
                    "_id": cid,
                    "contact_id": cid,
                    "full_name": name,
                    "email": email,
                    "phone": phone,
                    "board": board_interest,
                    "province": province,
                    "region": region,
                    "school": school_info["school"],
                    "school_type": school_info["school_type"],
                    "school_id": school_info["school_id"],
                    "web_registered": False,
                    "payment_status": "Chưa thanh toán",
                    "paid": False,
                    "is_paid_monetary": False,
                    "is_registered_valid": False,
                    "fee": 0.0,
                    "revenue": 0.0,
                    "has_external": True,
                    "talkshow_form": True,
                    "fb_form": False,
                    "wants_talkshow": True,
                    "question": question,
                    "self_declared": self_declared,
                    "merged_count": 1,
                    "data_rows": 0,
                    "sources": ["Talkshow"],
                    "source_combo": "Talkshow",
                    "first_touch": created_at,
                    "web_registered_at": None,
                    "segment": "Lead Talkshow mới",
                    "segment_name": "Nhóm tiềm năng",
                    "sub_segment": board_interest,
                    "drip": "Drip-Talkshow",
                    "flags": [],
                    "pic": pic,
                    "notes": None,
                    "utm_partners": ["info"],
                    "promo_codes": [],
                    "dob": None,
                    "cccd": None,
                    "channel_base": "Đối tác trường",
                    "channel": "Đối tác trường",
                    "channel_is_assumed": False,
                    "exam_venue": "Hà Nội" if region == "Miền Bắc" else "TP.HCM",
                    "exam_venue_address": "Cơ sở PTIT",
                    "partners": contact_partners({"school": school_info["school"], "board": board_interest, "region": region, "channel_base": "Đối tác trường", "utm_partners": ["info"]})
                }
                contacts.append(new_contact)
                if email_lower: seen_email[email_lower] = new_contact
                if phone: seen_phone[phone] = new_contact

        lead_doc = {
            "source": "Talkshow Google Form",
            "row_no": row_no,
            "contact_id": cid,
            "result": result,
            "segment": "Nhóm hoàn tất" if matched and matched.get("paid") else "Nhóm tiềm năng",
            "created_at": created_at,
            "full_name": name,
            "full_name_raw": name,
            "email": email,
            "email_raw": email,
            "phone": phone,
            "phone_raw": clean(r.get("2. Số điện thoại")),
            "board_interest": board_interest,
            "province": province,
            "region": region,
            "school_raw": school_raw,
            "wants_talkshow": True,
            "self_declared": self_declared,
            "question": question,
            "pic": pic,
            "note": None,
            "campaign": None,
            "heard_from": heard_from,
            "platform": None,
            "ad_name": None,
            "adset_name": None,
        }
        lead_doc["partners"] = lead_partners(lead_doc, matched["partners"] if matched else ["INFO", "THPT" if board_interest == "Bảng A" else "DH"])
        leads.append(lead_doc)

    # 3.5.2. Facebook Ads Lead Form (31 dòng)
    for idx, r in df_fb.iterrows():
        row_no = idx + 2
        name = clean(r.get("tên_đầy_đủ"))
        phone = to_phone(r.get("số_điện_thoại"))
        email = clean(r.get("email"))
        email_lower = email.lower() if email else None
        campaign = clean(r.get("campaign_name"))
        ad_name = clean(r.get("ad_name"))
        adset_name = clean(r.get("adset_name"))
        platform_raw = clean(r.get("platform"))
        platform = "Facebook" if platform_raw == "fb" else ("Instagram" if platform_raw == "ig" else "Facebook")
        
        b_raw = str(r.get("bạn_đang_cần_thông_tin_cho_bảng_thi_nào?") or "").lower()
        board_interest = "Bảng A" if "bảng_a" in b_raw else ("Bảng B" if "bảng_b" in b_raw else "Bảng B")
        
        wt_raw = str(r.get("bạn_có_muốn_tham_gia_các_talkshow_hàng_tuần_để_hiểu_thêm_chương_trình?") or "").lower()
        wants_talkshow = "không" not in wt_raw
        
        province = norm_province(clean(r.get("bạn_đang_ở_khu_vực_nào?"))) or "TP. Hồ Chí Minh"
        region = region_of(province)
        pic = clean(r.get("col20")) or "Thắng"
        note = clean(r.get("col22"))
        created_at = to_dt(r.get("created_time")) or datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)

        matched = (contact_by_email.get(email_lower) if email_lower else None) or (contact_by_phone.get(phone) if phone else None)
        if matched:
            result = "Đã có trong Data"
            cid = matched["_id"]
            matched["has_external"] = True
            matched["fb_form"] = True
            if wants_talkshow: matched["wants_talkshow"] = True
            if "FB Lead Form" not in matched.get("sources", []):
                matched["sources"].append("FB Lead Form")
                matched["source_combo"] = " + ".join(matched["sources"])
        else:
            prev = (seen_email.get(email_lower) if email_lower else None) or (seen_phone.get(phone) if phone else None)
            if prev:
                result = "Trùng trong form ngoài"
                cid = prev["_id"]
            else:
                result = "Lead mới"
                next_stt = len(contacts) + 1
                cid = f"PT-{next_stt:03d}"
                new_contact = {
                    "_id": cid,
                    "contact_id": cid,
                    "full_name": name,
                    "email": email,
                    "phone": phone,
                    "board": board_interest,
                    "province": province,
                    "region": region,
                    "school": None,
                    "school_type": "Chưa rõ",
                    "school_id": None,
                    "web_registered": False,
                    "payment_status": "Chưa thanh toán",
                    "paid": False,
                    "is_paid_monetary": False,
                    "is_registered_valid": False,
                    "fee": 0.0,
                    "revenue": 0.0,
                    "has_external": True,
                    "talkshow_form": False,
                    "fb_form": True,
                    "wants_talkshow": wants_talkshow,
                    "question": None,
                    "self_declared": "Chưa đăng ký",
                    "merged_count": 1,
                    "data_rows": 0,
                    "sources": ["FB Lead Form"],
                    "source_combo": "FB Lead Form",
                    "first_touch": created_at,
                    "web_registered_at": None,
                    "segment": "Lead Facebook mới",
                    "segment_name": "Nhóm tiềm năng",
                    "sub_segment": board_interest,
                    "drip": "Drip-FB",
                    "flags": [],
                    "pic": pic,
                    "notes": note,
                    "utm_partners": ["metaads"],
                    "promo_codes": [],
                    "dob": None,
                    "cccd": None,
                    "channel_base": "Facebook",
                    "channel": "Facebook",
                    "channel_is_assumed": False,
                    "exam_venue": "Hà Nội" if region == "Miền Bắc" else "TP.HCM",
                    "exam_venue_address": "Cơ sở PTIT",
                    "partners": contact_partners({"board": board_interest, "region": region, "channel_base": "Facebook", "utm_partners": ["metaads"]})
                }
                contacts.append(new_contact)
                if email_lower: seen_email[email_lower] = new_contact
                if phone: seen_phone[phone] = new_contact

        lead_doc = {
            "source": "FB Lead Form",
            "row_no": row_no,
            "contact_id": cid,
            "result": result,
            "segment": "Nhóm hoàn tất" if matched and matched.get("paid") else "Nhóm tiềm năng",
            "created_at": created_at,
            "full_name": name,
            "full_name_raw": name,
            "email": email,
            "email_raw": email,
            "phone": phone,
            "phone_raw": clean(r.get("số_điện_thoại")),
            "board_interest": board_interest,
            "province": province,
            "region": region,
            "school_raw": None,
            "wants_talkshow": wants_talkshow,
            "self_declared": "Chưa đăng ký",
            "question": None,
            "pic": pic,
            "note": note,
            "campaign": campaign,
            "heard_from": None,
            "platform": platform,
            "ad_name": ad_name,
            "adset_name": adset_name,
        }
        lead_doc["partners"] = lead_partners(lead_doc, matched["partners"] if matched else ["METAADS", "THPT" if board_interest == "Bảng A" else "DH"])
        leads.append(lead_doc)

    # 4. Ghi vào MongoDB
    print(f"-> Đang nạp {len(contacts)} contacts...")
    db.contacts.insert_many(contacts)
    print(f"-> Đang nạp {len(signups)} signups...")
    db.signups.insert_many(signups)
    print(f"-> Đang nạp {len(leads)} external leads...")
    db.leads.insert_many(leads)
    print(f"-> Đang nạp {len(candidates)} exam candidates...")
    db.exam_candidates.insert_many(candidates)
    print(f"-> Đang nạp {len(scores)} exam scores...")
    db.exam_scores.insert_many(scores)

    # 5. Raw signups, talkshow, fb leads
    raw_signups = [dict(r) for _, r in df_reg.iterrows()]
    db.raw_web_signups.insert_many(raw_signups)
    
    if not df_talkshow.empty:
        db.raw_talkshow.insert_many([dict(r) for _, r in df_talkshow.iterrows()])
    if not df_fb.empty:
        db.raw_fb_leads.insert_many([dict(r) for _, r in df_fb.iterrows()])

    # 6. Meta docs
    db.meta.insert_one({
        "_id": "exam",
        "params": PARAMS,
        "structure": STRUCTURE,
        "datasets": [{"code": "PM119", "label": "119 thí sinh (gốc)", "linked": True}]
    })
    total_raw = len(df_reg) + len(df_talkshow) + len(df_fb)
    merged_count = total_raw - len(contacts)
    db.meta.insert_one({
        "_id": "pipeline",
        "raw_counts": {"raw_web_signups": len(df_reg), "raw_talkshow": len(df_talkshow), "raw_fb_leads": len(df_fb)},
        "total_raw": total_raw,
        "unique_contacts": len(contacts),
        "merged_records": merged_count,
        "duplicate_rate": round(merged_count / total_raw if total_raw else 0.0, 4)
    })

    # 7. Channel budgets & Media Reach
    channels = [
        {"_id": "Website", "channel": "Website", "order": 1, "budget": 10000000.0, "clicks": 2500.0, "ctr": 3.5, "data_note": "Trực tiếp", "is_assumed": False, "report": {"unique_contacts": 80, "paid": 45, "revenue": 22500000.0, "roi": 125.0}, "partners": []},
        {"_id": "Facebook", "channel": "Facebook", "order": 2, "budget": 15000000.0, "clicks": 4200.0, "ctr": 4.1, "data_note": "Meta Ads", "is_assumed": False, "report": {"unique_contacts": 39, "paid": 21, "revenue": 10500000.0, "roi": -30.0}, "partners": ["METAADS"]},
    ]
    db.channel_budgets.insert_many(channels)

    media = [
        {"channel": "Fanpage Python Master", "reach": 45000.0, "engagement": 6500.0, "engagement_rate": 0.14, "importance": 5.0, "partners": ["DN"]},
        {"channel": "Website PTIT", "reach": 30000.0, "engagement": 4200.0, "engagement_rate": 0.14, "importance": 4.0, "partners": ["DN"]},
    ]
    db.media_reach.insert_many(media)

    benefits = [
        {"item": "Logo trên website chính thức", "status": "Hoàn thành 100%", "progress": 1.0, "placement": "Header", "schedule": "Tháng 8-9/2026", "note": "Đã xuất hiện", "partners": ["DN"]},
        {"item": "Quyền tiếp cận thí sinh xuất sắc (Top 10%)", "status": "Hoàn thành 100%", "progress": 1.0, "placement": "Báo cáo chung kết", "schedule": "Tháng 9/2026", "note": "Đã gửi danh sách", "partners": ["DN"]},
    ]
    db.sponsor_benefits.insert_many(benefits)

    # 8. Đồng bộ Danh mục Đối tác & Tài khoản mặc định
    print("-> Đang đồng bộ danh mục Đối tác & Tài khoản mặc định...")
    now_ts = datetime.now(timezone.utc)
    for p in PARTNERS:
        db.partners.update_one(
            {"_id": p["code"]},
            {
                "$set": {k: p[k] for k in ("name", "type", "description", "scope_rule")},
                "$setOnInsert": {"modules": p["modules"], "can_view_pii": False, "active": True, "created_at": now_ts},
            },
            upsert=True,
        )
    db.users.create_index("username", unique=True)
    for u in DEFAULT_USERS:
        password = settings.seed_admin_password if u["role"] == "admin" else settings.seed_partner_password
        if db.users.count_documents({"username": u["username"]}) == 0:
            db.users.insert_one({
                **u,
                "password_hash": hash_password(password),
                "active": True,
                "token_version": 0,
                "created_at": now_ts,
                "last_login": None,
            })
            print(f"  + Tạo tài khoản {u['username']} ({u['partner_code'] or 'admin'})")

    print("\n=== HOÀN TẤT NẠP DỮ LIỆU THÀNH CÔNG VÀO MONGODB! ===")
    print(f"- Contacts: {len(contacts)}")
    print(f"- Signups: {len(signups)}")
    print(f"- External Leads (Talkshow & Facebook): {len(leads)}")
    print(f"- Exam Candidates: {len(candidates)}")
    print(f"- Exam Scores: {len(scores)}")

    return {
        "contacts": len(contacts),
        "signups": len(signups),
        "leads": len(leads),
        "candidates": len(candidates),
        "scores": len(scores),
        "reconciled_at": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    run()
