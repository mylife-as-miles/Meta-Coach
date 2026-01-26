from playwright.sync_api import sync_playwright, expect

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1600, 'height': 900})
        page = context.new_page()

        print("Navigating to dashboard...")

        try:
            page.goto("http://localhost:3000/dashboard")

            # Wait for main content
            expect(page.get_by_text("Live Operations")).to_be_visible(timeout=15000)

            # Verify Match Card
            expect(page.get_by_text("Upcoming Match")).to_be_visible()
            # "C9" appears multiple times
            expect(page.get_by_text("C9").first).to_be_visible()
            expect(page.get_by_text("T1").first).to_be_visible()

            # Verify Nav
            expect(page.get_by_text("MetaCoach", exact=True)).to_be_visible()
            expect(page.get_by_role("link", name="Match History")).to_be_visible()

            print("Taking screenshot...")
            page.screenshot(path="verification/dashboard_new.png", full_page=True)
            print("Verification passed!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/dashboard_failed.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
