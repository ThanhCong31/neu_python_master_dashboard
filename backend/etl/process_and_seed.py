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
    clean, norm_province, region_of, to_date_str, to_dt, to_float, to_int, to_phone, yes
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
        email = r.get("pm-email")
        name = r.get("pm-hoten")
        partner_tag = clean(r.get("partner"))
        
        # Tags đối tác
        p_tags = []
        if board == "Bảng A":
            p_tags.append("THPT")
        if board == "Bảng B":
            p_tags.append("DH")
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
            "school": school,
            "web_registered": True,
            "payment_status": "Đã thanh toán" if is_paid else "Chưa thanh toán",
            "paid": is_paid,
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
        
        cand_doc = {
            "_id": cand_id,
            "dataset": "PM119",
            "stt": stt,
            "contact_id": cid,
            "email": email,
            "full_name": name,
            "board": board,
            "school": school,
            "school_type": "THPT" if str(school).startswith("THPT") else "Đại học / Học viện",
            "province": province,
            "region": region_of(province),
            "paid": is_paid,
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

    # 4. Ghi vào MongoDB
    print(f"-> Đang nạp {len(contacts)} contacts...")
    db.contacts.insert_many(contacts)
    print(f"-> Đang nạp {len(signups)} signups...")
    db.signups.insert_many(signups)
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
    db.meta.insert_one({
        "_id": "pipeline",
        "raw_counts": {"raw_web_signups": len(contacts), "raw_talkshow": len(df_talkshow), "raw_fb_leads": len(df_fb)},
        "total_raw": len(contacts) + len(df_talkshow) + len(df_fb),
        "unique_contacts": len(contacts),
        "merged_records": 0,
        "duplicate_rate": 0.0
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

    print("\n=== HOÀN TẤT NẠP DỮ LIỆU THÀNH CÔNG VÀO MONGODB! ===")
    print(f"- Contacts: {len(contacts)}")
    print(f"- Signups: {len(signups)}")
    print(f"- Exam Candidates: {len(candidates)}")
    print(f"- Exam Scores: {len(scores)}")


if __name__ == "__main__":
    run()
