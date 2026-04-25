# ==========================================================
# backend/app/whatsapp.py
# WATCHER V5 HUMAN-LIKE MODE
# - Watches only selected chat
# - Reads newest incoming message only
# - Ignores old preview/sidebar DOM noise
# - Ignores already processed files (daily)
# - 2-step PDF download
# - Human-like behavior
# ==========================================================

import json
import asyncio
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright

BASE_DIR = Path(__file__).resolve().parent

USER_DATA_DIR = BASE_DIR / "browser_data"
USER_DATA_DIR.mkdir(exist_ok=True)

DOWNLOAD_DIR = BASE_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

HISTORY_FILE = BASE_DIR / "processed_files.json"


def log(msg):
    print(f"[WHATSAPP] {msg}")


class WhatsAppEngine:
    def __init__(self):
        self.playwright = None
        self.context = None
        self.page = None

    # --------------------------------------------------
    # HISTORY
    # --------------------------------------------------
    def load_history(self):
        try:
            if HISTORY_FILE.exists():
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return []

    def save_history(self, data):
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(data[-500:], f, indent=2)
        except:
            pass

    def today_key(self, filename):
        return filename + "_" + datetime.now().strftime("%Y-%m-%d")

    def already_processed(self, filename):
        data = self.load_history()
        return self.today_key(filename) in data

    def mark_processed(self, filename):
        data = self.load_history()

        key = self.today_key(filename)

        if key not in data:
            data.append(key)

        self.save_history(data)

    # --------------------------------------------------
    # START
    # --------------------------------------------------
    async def start(self):
        log("Launching browser...")

        self.playwright = await async_playwright().start()

        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=str(USER_DATA_DIR),
            headless=False,
            channel="chrome",
            args=["--start-maximized"],
            viewport=None,
            accept_downloads=True,
        )

        if self.context.pages:
            self.page = self.context.pages[0]
        else:
            self.page = await self.context.new_page()

        await self.page.goto("https://web.whatsapp.com", wait_until="domcontentloaded")

        await self.page.wait_for_timeout(5000)

        log("Browser started")

    # --------------------------------------------------
    # LOGIN
    # --------------------------------------------------
    async def is_logged_in(self):
        try:
            for s in ['div[role="textbox"]', '[contenteditable="true"]', "header"]:
                try:
                    await self.page.wait_for_selector(s, timeout=3000)
                    return True
                except:
                    pass

            return False
        except:
            return False

    # --------------------------------------------------
    # OPEN CHAT
    # --------------------------------------------------
    async def open_chat(self, contact_name):
        try:
            log(f"Searching chat: {contact_name}")

            # safer search selectors near top-left only
            selectors = [
                '[aria-label*="Search"]',
                '[title*="Search"]',
                'input[type="text"]',
            ]

            search = None

            for sel in selectors:
                try:
                    els = await self.page.query_selector_all(sel)
                    for el in els:
                        box = await el.bounding_box()
                        if box and box["y"] < 250 and box["width"] > 150:
                            search = el
                            break
                    if search:
                        break
                except:
                    pass

            if not search:
                log("Search box not found")
                return False

            await search.click(force=True)
            await self.page.keyboard.press("Control+A")
            await self.page.keyboard.press("Backspace")

            try:
                await search.fill(contact_name)
            except:
                await self.page.keyboard.type(contact_name)

            await self.page.wait_for_timeout(2000)

            # click matching chat result instead of Enter
            result = await self.page.query_selector(f'span[title="{contact_name}"]')

            if result:
                await result.click(force=True)
                await self.page.wait_for_timeout(2000)
                log("Chat opened")
                return True

            log("Chat result not found")
            return False

        except Exception as e:
            log(f"Open chat failed: {e}")
            return False

    # --------------------------------------------------
    # FIND NEWEST INCOMING PDF ONLY
    # --------------------------------------------------
    async def download_latest_pdf(self):
        try:
            import re

            log("Looking for newest incoming PDF...")

            rows = await self.page.query_selector_all(
                'div[data-testid="msg-container"], main div'
            )

            if not rows:
                log("No message rows found")
                return None

            latest_row = None
            filename = None

            # ---------------------------------------
            # Reverse scan newest messages first
            # ---------------------------------------
            for row in reversed(rows[-50:]):
                try:
                    txt = (await row.inner_text()).strip()

                    if not txt:
                        continue

                    # ignore outgoing/self messages
                    html = await row.inner_html()

                    if "message-out" in html:
                        continue

                    # STRICT filename match only
                    match = re.search(r"([A-Za-z0-9_\-\s]+\.pdf)", txt, re.IGNORECASE)

                    if match:
                        latest_row = row
                        filename = match.group(1).strip()

                        break

                except:
                    pass

            # ---------------------------------------
            # No valid PDF filename found
            # ---------------------------------------
            if not latest_row or not filename:
                log("No new incoming PDF found")
                return None

            log(f"Detected filename raw: {filename}")

            # ---------------------------------------
            # Daily dedupe
            # ---------------------------------------
            if self.already_processed(filename):
                log(f"Already processed today: {filename}")
                return None

            log(f"New PDF found: {filename}")

            # ---------------------------------------
            # STEP 1 Open preview
            # ---------------------------------------
            await latest_row.click(force=True)

            await self.page.wait_for_timeout(2500)

            log("PDF preview opened")

            # ---------------------------------------
            # STEP 2 Download button
            # ---------------------------------------
            selectors = [
                'span[data-icon="download"]',
                '[aria-label*="Download"]',
                '[title*="Download"]',
                "button",
            ]

            btn = None

            for sel in selectors:
                try:
                    els = await self.page.query_selector_all(sel)

                    for e in els:
                        box = await e.bounding_box()

                        if box and box["y"] < 220:
                            btn = e
                            break

                    if btn:
                        break

                except:
                    pass

            if not btn:
                log("Download button not found")
                return None

            async with self.page.expect_download(timeout=15000) as d:

                await btn.click(force=True)

            download = await d.value

            path = DOWNLOAD_DIR / download.suggested_filename

            await download.save_as(str(path))

            # ---------------------------------------
            # Mark processed
            # ---------------------------------------
            self.mark_processed(filename)

            log(f"Downloaded PDF: {download.suggested_filename}")

            await self.page.keyboard.press("Escape")

            return str(path)

        except Exception as e:
            log(f"Download failed: {e}")
            return None

    # --------------------------------------------------
    # WATCHER LOOP
    # --------------------------------------------------
    async def watch_contact(self, contact_name, interval, callback):
        log(f"Watcher started for {contact_name}")

        while True:
            try:
                ok = await self.open_chat(contact_name)

                if ok:
                    file_path = await self.download_latest_pdf()

                    if file_path:
                        log(f"Processing: {file_path}")

                        await callback(file_path)

            except Exception as e:
                log(f"Watcher error: {e}")

            await asyncio.sleep(interval)

    # --------------------------------------------------
    # CLOSE
    # --------------------------------------------------
    async def close(self):
        try:
            if self.context:
                await self.context.close()

            if self.playwright:
                await self.playwright.stop()

            log("Browser closed")
        except:
            pass


wa_engine = WhatsAppEngine()
