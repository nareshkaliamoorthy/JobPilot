import sys
import asyncio

# MUST be first on Windows
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, set_key
from fastapi.responses import FileResponse
from app.whatsapp import wa_engine
import os
import shutil
import smtplib
import re
import fitz
import json
from email.message import EmailMessage
import traceback

load_dotenv()

ENV_FILE = ".env"

app = FastAPI(title="JobPilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


watch_task = None

dashboard_jobs = []

dashboard_summary = {
    "total_jobs": 0,
    "applied": 0,
    "rejected": 0,
    "blocked": 0,
    "low_match": 0,
    "success_rate": 0,
}
# =====================================================
# ENV
# =====================================================
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =====================================================
# CONFIG
# =====================================================
def load_env_list(key, fallback):
    value = os.getenv(key, "")
    if value.strip():
        return [x.strip() for x in value.split(",") if x.strip()]
    return fallback


DEFAULT_KEYWORDS = load_env_list(
    "KEYWORDS", ["Playwright", "Python", "SQL", "API", "Automation"]
)

DEFAULT_BLOCK_KEYWORDS = load_env_list(
    "BLOCK_KEYWORDS", ["Manual Testing", "Night Shift", "Contract"]
)

MATCH_THRESHOLD = 20

ALLOWED_LOCATIONS = ["chennai", "bangalore", "bengaluru", "hyderabad", "remote"]

LOCATION_STARTERS = [
    "chennai",
    "bangalore",
    "bengaluru",
    "hyderabad",
    "pune",
    "mumbai",
    "delhi",
    "noida",
    "gurgaon",
    "kolkata",
    "coimbatore",
]


# =====================================================
# HELPERS
# =====================================================
def get_company_from_email(email):
    try:
        domain = email.split("@")[1]
        company = domain.split(".")[0]
        return company.capitalize()
    except:
        return "Company"


def send_email(to_email, company, resume_path):
    msg = EmailMessage()

    msg["Subject"] = f"Immediate Joiner | QA Lead or SDET"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    msg.set_content(
        f"""
Hello Hiring Team,

I am writing to express my interest in opportunities related to QA Lead | SDET roles.

I bring 13+ yrs years of experience in Quality Assurance, Test Leadership, Automation Strategy, Team Management, and Delivery Excellence.

Current Location:	Chennai
Preferred Location:	Chennai | Bangalore | Hyderabad

Tech Stack: Test Planning • Stakeholder Management • Team Leadership • Agile • SDLC • UI Testing • API Testing • DB Testing • AWS • Postgres SQL • Postman • Playwright • Python • Pytest • Javascript/Typescript • UI Testing • API Testing • Allure • GitHub • CI/CD (Jenkins)

AI Skills: Agentic AI in Testing • RAG • MCP • LangFlow

Please find my resume attached.

Regards,
Naresh K
8317432766
"""
    )

    with open(resume_path, "rb") as f:
        file_data = f.read()

    msg.add_attachment(
        file_data,
        maintype="application",
        subtype="pdf",
        filename=os.path.basename(resume_path),
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(SMTP_EMAIL.strip(), SMTP_PASSWORD.strip())
        smtp.send_message(msg)


def is_location_line(line):
    l = line.lower().strip()
    return any(l.startswith(city) for city in LOCATION_STARTERS)


def extract_experience(lines):
    for line in lines[:6]:
        match = re.search(r"(\d+)\+?\s*[-to]+\s*(\d+)\+?\s*years", line.lower())
        if match:
            return f"{match.group(1)}-{match.group(2)} Years"

        match2 = re.search(r"(\d+)\+?\s*years", line.lower())
        if match2:
            return f"{match2.group(1)}+ Years"

    return "Not Found"


def extract_role(lines):
    candidates = lines[1:5]

    ignore_words = ["years", "experience", "location", "salary", "interview"]

    for line in candidates:
        text = line.strip()

        if len(text) < 4:
            continue

        if any(word in text.lower() for word in ignore_words):
            continue

        return text[:80]

    return "QA Engineer"


def allowed_location(location):
    l = location.lower()
    return any(city in l for city in ALLOWED_LOCATIONS)


# =====================================================
# PDF PARSER
# JOB STARTS WITH LOCATION
# JOB ENDS WITH:
# Interview Prep Kit Download
# =====================================================
def extract_jobs_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)

    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"

    lines = [x.strip() for x in full_text.splitlines() if x.strip()]

    # -----------------------------------------
    # START OF EACH JOB:
    # Pan India / Remote / Chennai / Bangalore
    # END OF EACH JOB:
    # line containing email
    # -----------------------------------------
    START_WORDS = [
        "pan india",
        "remote",
        "chennai",
        "bangalore",
        "bengaluru",
        "hyderabad",
        "pune",
        "mumbai",
        "noida",
        "gurgaon",
    ]

    jobs_raw = []
    block = []
    collecting = False

    for line in lines:
        low = line.lower()

        # START OF JOB
        if any(low.startswith(word) for word in START_WORDS):
            if block:
                jobs_raw.append(block)

            block = [line]
            collecting = True
            continue

        if collecting:
            block.append(line)

            # END OF JOB = EMAIL FOUND
            if re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", line):
                jobs_raw.append(block)
                block = []
                collecting = False

    if block:
        jobs_raw.append(block)

    parsed_jobs = []

    # =================================================
    # SMART EXTRACTION
    # =================================================
    for idx, block in enumerate(jobs_raw):

        block_text = "\n".join(block)

        # -----------------------------------------
        # EMAIL
        # -----------------------------------------
        emails = re.findall(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", block_text
        )

        email = emails[-1] if emails else ""

        # -----------------------------------------
        # LOCATION = FIRST LINE
        # -----------------------------------------
        location = block[0]

        # -----------------------------------------
        # EXPERIENCE
        # examples:
        # 2-8 Yrs
        # 2+ Yrs
        # 5 Years
        # -----------------------------------------
        experience = "Not Found"

        for line in block[:6]:
            match = re.search(r"(\d+\s*[\-\–to]+\s*\d+\s*(yrs|years))", line.lower())
            if match:
                experience = line
                break

            match2 = re.search(r"(\d+\+?\s*(yrs|years))", line.lower())
            if match2:
                experience = line
                break

        # -----------------------------------------
        # ROLE
        # usually 2nd / 3rd / 4th line
        # ignore company names and exp lines
        # -----------------------------------------
        role = "QA Engineer"

        ignore_words = [
            "yrs",
            "years",
            "interview",
            "newsletter",
            "whatsapp",
            "disclaimer",
            "jobs",
            "testing studio",
        ]

        candidates = block[1:5]

        for line in candidates:

            txt = line.strip()

            if len(txt) < 4:
                continue

            if any(word in txt.lower() for word in ignore_words):
                continue

            # role indicators
            if any(
                word in txt.lower()
                for word in [
                    "engineer",
                    "tester",
                    "qa",
                    "analyst",
                    "sdet",
                    "automation",
                    "performance",
                ]
            ):
                role = txt
                break

        # -----------------------------------------
        # COMPANY
        # If recruiter email exists → domain
        # Else detect line after location
        # -----------------------------------------
        company = get_company_from_email(email) if email else f"Company {idx+1}"

        # better detection if 2nd line company-like
        if len(block) > 1:
            line2 = block[1].strip()

            if (
                role != line2
                and "tester" not in line2.lower()
                and "engineer" not in line2.lower()
                and "yrs" not in line2.lower()
            ):
                company = line2

        parsed_jobs.append(
            {
                "company": company,
                "role": role,
                "experience": experience,
                "location": location,
                "email": email,
                "text": block_text,
            }
        )

    return parsed_jobs


# =====================================================
# ROUTES
# =====================================================
@app.get("/")
def root():
    return {"message": "JobPilot Running"}


@app.get("/api/settings")
def get_settings():
    return {
        "keywords": DEFAULT_KEYWORDS,
        "blocked_keywords": DEFAULT_BLOCK_KEYWORDS,
        "theme": os.getenv("THEME", "dark"),
    }


@app.post("/api/settings")
async def save_settings(
    keywords: str = Form(...),
    blocked_keywords: str = Form(...),
    theme: str = Form("dark"),
):
    kw = json.loads(keywords)
    bk = json.loads(blocked_keywords)

    set_key(ENV_FILE, "KEYWORDS", ",".join(kw))
    set_key(ENV_FILE, "BLOCK_KEYWORDS", ",".join(bk))
    set_key(ENV_FILE, "THEME", theme)

    return {"message": "Settings Saved"}


@app.post("/api/auto-apply")
async def auto_apply(
    resume: UploadFile = File(...),
    job_pdf: UploadFile = File(...),
    keywords: str = Form(...),
    blocked_keywords: str = Form(...),
):
    # ==========================================
    # Dynamic keywords from UI
    # ==========================================
    try:
        KEYWORDS = json.loads(keywords)
        if not KEYWORDS:
            KEYWORDS = DEFAULT_KEYWORDS
    except:
        KEYWORDS = DEFAULT_KEYWORDS

    try:
        BLOCK_KEYWORDS = json.loads(blocked_keywords)
        if not BLOCK_KEYWORDS:
            BLOCK_KEYWORDS = DEFAULT_BLOCK_KEYWORDS
    except:
        BLOCK_KEYWORDS = DEFAULT_BLOCK_KEYWORDS

    # ==========================================
    # Save uploaded files
    # ==========================================
    resume_path = os.path.join(UPLOAD_DIR, resume.filename)

    pdf_path = os.path.join(UPLOAD_DIR, job_pdf.filename)

    with open(resume_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)

    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(job_pdf.file, f)

    # ==========================================
    # Parse jobs from PDF
    # ==========================================
    jobs = extract_jobs_from_pdf(pdf_path)

    # ==========================================
    # Stats
    # ==========================================
    results = []

    applied = 0
    failed = 0
    blocked_count = 0
    low_match_count = 0

    # ==========================================
    # Process each job
    # ==========================================
    for j in jobs:

        text_lower = j["text"].lower()

        hits = [k for k in KEYWORDS if k.lower() in text_lower]

        blocked = [k for k in BLOCK_KEYWORDS if k.lower() in text_lower]

        pct = int((len(hits) / len(KEYWORDS)) * 100) if KEYWORDS else 0

        status = "Skipped"
        error_reason = ""

        # --------------------------------------
        # 1. Blocked keywords found
        # --------------------------------------
        if blocked:
            status = "Blocked"
            blocked_count += 1

            error_reason = "Blocked keywords: " + ", ".join(blocked)

        # --------------------------------------
        # 2. Location rejected
        # --------------------------------------
        elif not allowed_location(j["location"]):
            status = "Location Rejected"

            error_reason = (
                "Only Chennai / Bangalore / " "Hyderabad / Remote / Pan India allowed"
            )

        # --------------------------------------
        # 3. No recruiter email
        # --------------------------------------
        elif not j["email"]:
            status = "No Recruiter Email"

            error_reason = "No recruiter email found"

        # --------------------------------------
        # 4. Low match threshold
        # --------------------------------------
        elif pct < MATCH_THRESHOLD:
            status = "Low Match"
            low_match_count += 1

            error_reason = f"Threshold {MATCH_THRESHOLD}, got {pct}"

        # --------------------------------------
        # 5. Send email
        # --------------------------------------
        else:
            try:
                send_email(j["email"], j["company"], resume_path)

                status = "Email Sent"
                applied += 1

            except Exception as e:
                status = "Failed"
                failed += 1
                error_reason = str(e)

        # --------------------------------------
        # Add row result
        # --------------------------------------
        results.append(
            {
                "company": j["company"],
                "role": j["role"],
                "experience": j["experience"],
                "location": j["location"],
                "email": j["email"],
                "match_percent": pct,
                "matched_terms": hits,
                "blocked_terms": blocked,
                "status": status,
                "error_reason": error_reason,
            }
        )

    # ==========================================
    # Response
    # ==========================================
    total_jobs = len(results)

    return {
        "summary": {
            "total_jobs": total_jobs,
            "applied": applied,
            "failed": failed,
            "blocked": blocked_count,
            "low_match": low_match_count,
            "rejected": total_jobs - applied,
            "success_rate": int((applied / total_jobs) * 100) if total_jobs else 0,
        },
        "jobs": results,
    }


@app.get("/api/dashboard")
async def get_dashboard():
    return {"summary": dashboard_summary, "jobs": dashboard_jobs}


# ---------------------------------------------
# WhatsApp Status
# ---------------------------------------------
@app.get("/api/whatsapp/status")
async def whatsapp_status():
    try:
        if wa_engine.page:
            logged = await wa_engine.is_logged_in()
            return {"connected": logged}

        return {"connected": False}

    except Exception as e:
        return {"connected": False, "error": str(e)}


# ---------------------------------------------
# Start WhatsApp Browser
# ---------------------------------------------
@app.post("/api/whatsapp/connect")
async def whatsapp_connect():
    try:
        print("Launching WhatsApp...")

        if not wa_engine.page:
            await wa_engine.start()

        return {"success": True, "message": "Started"}

    except Exception as e:
        err = traceback.format_exc()

        print(err)

        return {"success": False, "error": err}


# ---------------------------------------------
# Get QR
# ---------------------------------------------
@app.get("/api/whatsapp/qr")
async def whatsapp_qr():
    try:
        path = await wa_engine.get_qr()

        if not path:
            return {"error": "QR not ready"}

        return FileResponse(path, media_type="image/png")

    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------
# Wait for Login
# ---------------------------------------------
@app.get("/api/whatsapp/wait-login")
async def whatsapp_wait_login():
    try:
        if not wa_engine.page:
            return {"connected": False}

        ok = await wa_engine.is_logged_in()

        return {"connected": ok}

    except Exception as e:
        return {"connected": False, "error": str(e)}


# ---------------------------------------------
# Disconnect
# ---------------------------------------------
@app.post("/api/whatsapp/disconnect")
async def whatsapp_disconnect():
    try:
        await wa_engine.close()

        return {"message": "Disconnected"}

    except Exception as e:
        return {"error": str(e)}


async def process_whatsapp_pdf(file_path):
    global dashboard_jobs, dashboard_summary

    print(f"Processing: {file_path}")

    try:
        jobs = extract_jobs_from_pdf(file_path)

        print(f"Jobs found: {len(jobs)}")

        if not jobs:
            return

        # use saved settings
        KEYWORDS = DEFAULT_KEYWORDS
        BLOCK_KEYWORDS = DEFAULT_BLOCK_KEYWORDS

        for j in jobs:
            text_lower = j["text"].lower()

            hits = [k for k in KEYWORDS if k.lower() in text_lower]

            blocked = [k for k in BLOCK_KEYWORDS if k.lower() in text_lower]

            pct = int((len(hits) / len(KEYWORDS)) * 100) if KEYWORDS else 0

            status = "Rejected"
            error_reason = ""

            # ---------------------------
            # BLOCKED KEYWORDS
            # ---------------------------
            if blocked:
                status = "Blocked"
                error_reason = "Blocked keywords: " + ", ".join(blocked)

            # ---------------------------
            # LOCATION FILTER
            # ---------------------------
            elif not allowed_location(j["location"]):
                status = "Location Rejected"
                error_reason = "Location not allowed"

            # ---------------------------
            # MATCH + EMAIL SEND
            # ---------------------------
            elif j["email"] and pct >= MATCH_THRESHOLD:
                try:
                    resume_path = os.path.join(UPLOAD_DIR, "default_resume.pdf")

                    send_email(j["email"], j["company"], resume_path)

                    status = "Email Sent"

                    print(f"Applied: {j['company']}")

                except Exception as e:
                    status = "Failed"
                    error_reason = str(e)

            else:
                if not j["email"]:
                    status = "No Recruiter Email"
                    error_reason = "No email found"
                else:
                    status = "Low Match"
                    error_reason = f"Threshold {MATCH_THRESHOLD}, got {pct}"

            # ---------------------------
            # DASHBOARD ENTRY
            # ---------------------------
            dashboard_jobs.insert(
                0,
                {
                    "company": j["company"],
                    "role": j["role"],
                    "experience": j["experience"],
                    "location": j["location"],
                    "email": j["email"],
                    "match_percent": pct,
                    "matched_terms": hits,
                    "blocked_terms": blocked,
                    "status": status,
                    "error_reason": error_reason,
                },
            )

        # ---------------------------------
        # KEEP LAST 200 ROWS ONLY
        # ---------------------------------
        dashboard_jobs = dashboard_jobs[:200]

        # ---------------------------------
        # SUMMARY
        # ---------------------------------
        total = len(dashboard_jobs)

        applied = len([x for x in dashboard_jobs if x["status"] == "Email Sent"])

        blocked_count = len([x for x in dashboard_jobs if x["status"] == "Blocked"])

        low_match = len([x for x in dashboard_jobs if x["status"] == "Low Match"])

        rejected = total - applied

        dashboard_summary = {
            "total_jobs": total,
            "applied": applied,
            "rejected": rejected,
            "blocked": blocked_count,
            "low_match": low_match,
            "success_rate": int((applied / total) * 100) if total else 0,
        }

        print("Dashboard updated")

    except Exception as e:
        print("process_whatsapp_pdf error:", str(e))


# ---------------------------------------------
# Start Watcher
# ---------------------------------------------
@app.post("/api/whatsapp/start-watch")
async def start_watch(contact_name: str = Form(...), interval: int = Form(60)):
    global watch_task

    if watch_task:
        watch_task.cancel()

    watch_task = asyncio.create_task(
        wa_engine.watch_contact(contact_name, interval, process_whatsapp_pdf)
    )

    return {"message": f"Watching {contact_name}"}


# ---------------------------------------------
# Stop Watcher
# ---------------------------------------------
@app.post("/api/whatsapp/stop-watch")
async def stop_watch():
    global watch_task

    if watch_task:
        watch_task.cancel()
        watch_task = None

    return {"message": "Watcher stopped"}


@app.post("/api/upload-resume")
async def upload_resume(resume: UploadFile = File(...)):
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        file_path = os.path.join(UPLOAD_DIR, "default_resume.pdf")

        with open(file_path, "wb") as f:
            shutil.copyfileobj(resume.file, f)

        return {"success": True, "message": "Resume uploaded"}

    except Exception as e:
        return {"success": False, "error": str(e)}
