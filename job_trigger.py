import smtplib
import ssl
import csv
import os
import time
import random
from email.message import EmailMessage

# =====================================================
# FILL YOUR DETAILS HERE
# =====================================================

GMAIL_ID = "knareshtr@gmail.com"
GMAIL_PASSWORD = "vmta bcib wqtl isya"

EMAIL_LIST_FILE = (
    "C:/Users/DELL/Downloads/Extracted_Emails_STS_March_2026.txt"  # one email per line
)
TRACKER_FILE = "./src/tracker.csv"
RESUME_PATH = r"C:/Users/DELL/Naresh_K/QA/Profiles/Naresh_K_LAM.pdf"

YOUR_NAME = "Naresh K"
YOUR_LOCATION = "Chennai"
PREFERRED_LOCATION = f"Chennai | Bangalore | Hyderabad"

YEARS_EXPERIENCE = "13+ yrs"

# ROLES = [
#     "QA Lead",
#     "QA Manager",
#     "Test Manager",
#     "Playwright Automation Engineer",
#     "SDET",
# ]


DAILY_LIMIT = 100
DELAY_BETWEEN_EMAILS = (5, 10)  # seconds random delay

# =====================================================
# FUNCTIONS
# =====================================================


def load_emails():
    with open(EMAIL_LIST_FILE, "r", encoding="utf-8") as f:
        emails = [line.strip() for line in f if line.strip()]
    return emails


def load_sent_emails():
    sent = set()

    if os.path.exists(TRACKER_FILE):
        with open(TRACKER_FILE, "r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if row:
                    sent.add(row[0].strip().lower())

    return sent


def mark_sent(email):
    with open(TRACKER_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([email])


def get_company_name(email):
    domain = email.split("@")[1]
    company = domain.split(".")[0]
    return company.upper()


def build_subject():
    return f"Immediate Joiner | QA Lead or SDET (Playwright)"


def build_body():
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; color:#222; line-height:1.6;">

        <div style="max-width:650px; margin:auto; padding:25px; border:1px solid #e6e6e6; border-radius:10px;">

            <p style="font-size:15px;">Hi Hiring Team,</p>

            <p style="font-size:15px;">
                I hope you are doing well.
            </p>

            <p style="font-size:15px;">
                I am writing to express my interest in opportunities related to
                <span style="color:#0b57d0;"><b>QA Manager | QA Lead | SDET</b></span> roles.
            </p>

            <p style="font-size:15px;">
                I bring <b>{YEARS_EXPERIENCE}</b> years of experience in
                Quality Assurance, Test Leadership, Automation Strategy,
                Team Management, and Delivery Excellence.
            </p>

            <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-top:15px;">

                <p style="margin:0 0 8px 0;">
                    <b style="color:#0b57d0;">Core Skills</b>
                </p>

                <p style="margin:0;">
                    <b>Automation Skills:</b> Playwright • Python • Pytest • UI Testing • API Testing • GitHub • CI/CD (Jenkins)<br><br><b>Manual Skills:</b> Test Planning • Stakeholder Management • Team Leadership • Agile • SDLC • UI Testing • API Testing • DB Testing • AWS • Postgres SQL • Postman <br><br>
                    <b>AI Skills:</b> Agentic AI in Testing • RAG • MCP • LangFlow
                </p>

            </div>

            <table style="margin-top:18px; font-size:15px;">
                <tr>
                    <td><b>Current Location:</b></td>
                    <td>{YOUR_LOCATION}</td>
                </tr>
                <tr>
                    <td><b>Preferred Location:</b></td>
                    <td>{PREFERRED_LOCATION}</td>
                </tr>
                <tr>
                    <td><b>Relevant Experience:</b></td>
                    <td>{YEARS_EXPERIENCE}</td>
                </tr>
            </table>

            <p style="margin-top:18px; font-size:15px;">
                Please find my resume attached for your review.
            </p>

            <p style="font-size:15px;">
                I would be glad to discuss any suitable openings.
            </p>

            <hr style="border:none; border-top:1px solid #eee; margin:25px 0;">

            <p style="margin:0; font-size:15px;">
                Regards,<br>
                <b>{YOUR_NAME}</b>
            </p>

            <p style="margin:8px 0 0 0;">
                📞 <a href="tel:8317432766" style="text-decoration:none; color:#0b57d0;">
                8317432766
                </a>
            </p>

            <p style="margin:5px 0 0 0;">
                ✉️ <a href="mailto:knareshtr@gmail.com" style="text-decoration:none; color:#0b57d0;">
                knareshtr@gmail.com
                </a>
            </p>

        </div>

    </body>
    </html>
    """


def attach_resume(msg):
    with open(RESUME_PATH, "rb") as f:
        file_data = f.read()

    filename = os.path.basename(RESUME_PATH)

    msg.add_attachment(
        file_data, maintype="application", subtype="octet-stream", filename=filename
    )


def send_email(receiver):
    # company = get_company_name(receiver)
    # role = random.choice(ROLES)

    subject = build_subject()
    body = build_body()

    msg = EmailMessage()
    msg["From"] = GMAIL_ID
    msg["To"] = receiver
    msg["Subject"] = subject
    msg.set_content("Please view this email in HTML supported mail client.")
    msg.add_alternative(body, subtype="html")

    attach_resume(msg)

    context = ssl.create_default_context()

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as smtp:
        smtp.login(GMAIL_ID, GMAIL_PASSWORD)
        smtp.send_message(msg)

    print(f"Sent to: {receiver}")


# =====================================================
# MAIN
# =====================================================


def main():
    emails = load_emails()
    sent = load_sent_emails()

    sent_today = 0

    for email in emails:

        email = email.lower()

        if email in sent:
            continue

        if sent_today >= DAILY_LIMIT:
            print("Daily limit reached.")
            break

        try:
            send_email(email)
            mark_sent(email)

            sent_today += 1

            wait = random.randint(*DELAY_BETWEEN_EMAILS)
            print(f"Waiting {wait} sec...")
            time.sleep(wait)

        except Exception as e:
            print(f"Failed: {email} | {e}")


if __name__ == "__main__":
    main()
