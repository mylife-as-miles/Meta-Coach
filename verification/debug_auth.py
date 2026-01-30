from playwright.sync_api import sync_playwright

def debug_auth(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

    try:
        page.goto("http://localhost:3000/auth", timeout=60000)
        page.wait_for_timeout(5000)
        page.screenshot(path="verification/debug_auth.png")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        debug_auth(page)
        browser.close()
