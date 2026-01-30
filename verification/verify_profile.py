from playwright.sync_api import sync_playwright
import time
import random

def test_profile(page):
    # Random user to avoid conflicts
    rand_id = random.randint(1000, 9999)
    email = f"coach{rand_id}@metacoach.gg"
    password = "password123"
    username = f"Coach{rand_id}"

    print(f"Navigating to Auth with {email}...")
    try:
        page.goto("http://localhost:3000/auth", timeout=60000)
    except Exception as e:
        print(f"Failed to load page: {e}")
        return

    # Switch to Signup
    page.click("text=Create account")

    # Fill Form
    page.fill("input[name='username']", username)
    page.fill("input[name='email']", email)
    page.fill("input[name='password']", password)

    # Submit
    page.click("button[type='submit']")

    # Wait for navigation to Onboarding Step 1
    try:
        page.wait_for_url("**/onboarding/step-1", timeout=15000)
        print("Signup successful, proceeding to onboarding...")
    except:
        print("Signup might have required verification or failed. Checking content...")
        if page.get_by_text("check your email").is_visible():
            print("Email verification required. Cannot proceed automatically.")
            return
        else:
            print("Unknown failure.")
            page.screenshot(path="/home/jules/verification/signup_fail.png")
            return

    # Onboarding Step 1: Choose Game
    print("Step 1: Choosing Game...")
    page.click("text=League of Legends")

    # Wait for teams to load
    try:
        # Wait for at least one team button (assuming logic renders buttons)
        # The component code shows: button with onClick handleTeamSelect
        # They have the team name.
        page.wait_for_selector("button:has-text('Cloud9')", timeout=10000)
        page.click("button:has-text('Cloud9')")
        print("Selected Cloud9")
    except:
        print("Cloud9 not found or teams failed to load. Checking for any team...")
        # Try finding any button that isn't the 'Continue' button (which is disabled initially)
        # The team buttons are in a grid.
        # We can try clicking the first button in the grid.
        # The grid container has class 'grid-cols-2'
        try:
            page.click(".grid-cols-2 button:first-child")
            print("Selected first available team.")
        except:
             print("No teams found.")
             page.screenshot(path="/home/jules/verification/step1_fail.png")
             return

    # Click Continue
    page.click("button:has-text('Continue to Roster')")

    # Step 2: Roster
    print("Step 2: Roster...")
    page.wait_for_url("**/onboarding/step-2")
    page.click("text=Confirm Roster")

    # Step 3: Calibrate
    print("Step 3: Calibrate...")
    page.wait_for_url("**/onboarding/step-3")
    page.click("text=Initialize Dashboard")

    # Dashboard
    print("Waiting for Dashboard...")
    page.wait_for_url("**/dashboard")
    print("Reached Dashboard!")

    # Go to Profile
    print("Navigating to Profile...")
    # The sidebar or nav link to profile
    # Usually /dashboard/profile
    page.goto("http://localhost:3000/dashboard/profile")

    # Verify Content
    # Should see the username
    print("Verifying Profile content...")
    page.wait_for_selector(f"text={username}", timeout=10000)

    # Take Screenshot 1: Initial State
    page.screenshot(path="/home/jules/verification/profile_initial.png")
    print("Initial screenshot taken.")

    # Edit Profile
    print("Editing Profile...")
    page.click("button:has-text('edit')") # The edit button usually has an icon or text, simpler to query by role if possible, but text 'edit' might not be there (it's an icon).
    # The code has: <span className="material-icons-outlined text-lg">edit</span>
    # Button contains that span.
    # Playwright might not see "edit" text if it's a ligature.
    # Try finding the button by the icon class or aria-label if present?
    # The code: <button ... onClick={() => setIsEditModalOpen(true)}><span ...>edit</span></button>
    # I can try selector `button:has(.material-icons-outlined:text('edit'))` or simply `button:has-text('edit')` might work if it renders text.
    # Safest: Click the button that looks like edit.
    # There are two buttons in the header: Contact and Edit.
    # Edit is the second one, or the one with the edit icon.
    page.click("button:has(.material-icons-outlined:text-is('edit'))")

    page.wait_for_selector("text=Edit Profile")

    # Change Bio
    page.fill("#bio", "This is a verified bio update.")
    page.fill("#location", "New York, NY")

    # Save
    page.click("text=Save Changes")

    # Verify Update
    print("Verifying updates...")
    page.wait_for_selector("text=This is a verified bio update.", timeout=5000)
    page.wait_for_selector("text=New York, NY")

    # Take Screenshot 2: Updated State
    page.screenshot(path="/home/jules/verification/profile_updated.png")
    print("Verification complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_profile(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
