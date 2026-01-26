import time
import random
import string
from playwright.sync_api import sync_playwright, expect

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def verify_flow(page):
    username = f"user_{generate_random_string()}"
    email = f"{username}@example.com"
    password = "password123"

    print(f"Starting verification flow for {username}...")

    # 1. Sign Up
    page.goto("http://localhost:3002/auth")
    page.get_by_text("Create account").click()

    page.fill('input[placeholder="MetaCoachUser"]', username)
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.get_by_role("button", name="Create Account").click()

    # Wait for navigation to Onboarding Step 1
    expect(page.get_by_text("Select Battlespace")).to_be_visible(timeout=10000)
    print("Step 1 reached.")

    # 2. Step 1: Choose League of Legends
    # Clicking the text bubbles up to the card's onClick handler.
    # We do NOT click the button separately because the first click changes the button text to "Connecting...",
    # causing the subsequent selector for "Connect Data Source" to match the *other* game's button (Valorant),
    # which leads to the wrong game being selected.
    page.get_by_text("League of Legends").first.click()

    # Wait for Step 2
    expect(page.get_by_text("Sync Your Roster")).to_be_visible(timeout=10000)
    print("Step 2 reached.")

    # 3. Step 2: Sync Roster
    # Inputs do not have IDs, select by placeholder.
    # Note: nth(0) is Top, nth(1) is Jungle, etc.
    page.get_by_placeholder("Enter Player IGN...").nth(0).fill("PlayerOne")
    page.get_by_placeholder("Enter Player IGN...").nth(1).fill("PlayerTwo")
    page.get_by_placeholder("Enter Player IGN...").nth(2).fill("PlayerThree")
    page.get_by_placeholder("Enter Player IGN...").nth(3).fill("PlayerFour")
    page.get_by_placeholder("Enter Player IGN...").nth(4).fill("PlayerFive")

    page.get_by_role("button", name="Next Step").click()

    # Wait for Step 3
    expect(page.get_by_text("Finalizing Strategy Engine")).to_be_visible(timeout=10000)
    print("Step 3 reached.")

    # 4. Step 3: Calibrate AI
    # Just click Confirm & Launch.
    page.get_by_role("button", name="Confirm & Launch").click()

    # Wait for Dashboard
    expect(page.get_by_text("Dashboard", exact=True)).to_be_visible(timeout=15000)
    # Note: Dashboard component title might be different, let's check exact text or use url
    # Actually Dashboard.tsx usually has a "Dashboard" header or menu item.

    print("Dashboard reached.")

    # 5. Verify Dashboard Content
    expect(page.get_by_text(username)).to_be_visible()
    expect(page.get_by_text("League of Legends")).to_be_visible()

    # Take Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/dashboard_complete.png")
    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_flow(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
