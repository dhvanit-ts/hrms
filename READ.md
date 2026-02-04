Fine, let’s actually **pull the account out by the roots**, not the fake “signed out but still remembered” nonsense Windows enjoys.

## How to remove a Microsoft account **completely** from Windows

This is the **correct** way. Anything less is cosplay.

---

### Step 1: Make sure you have another way in

If this Microsoft account is your **only** admin account, Windows will throw a tantrum.

Do this first:

1. **Settings → Accounts → Other users**
2. **Add account**
3. Choose **I don’t have this person’s sign-in info**
4. **Add a user without a Microsoft account**
5. Create a **local account**
6. Click it → **Change account type → Administrator**

Now you have a spare key before burning the house down.

---

### Step 2: Remove the Microsoft account

1. **Settings → Accounts → Your info**
2. Click **Sign in with a local account instead**
3. Enter your PIN/password
4. Set a **local username + password**
5. Sign out

At this point:

* Microsoft account is **detached**
* Windows Hello for that account is **dead**
* PIN is now local-only

---

### Step 3: Delete the old profile (important)

Windows loves hoarding ghosts.

1. Log into the **new local admin account**
2. **Settings → Accounts → Other users**
3. Select the old Microsoft account
4. Click **Remove**
5. Choose **Delete account and data**
   (Only do this if you already copied files you want)

This removes:

* Cached credentials
* Profile folder
* Silent sign-in tricks

---

### Step 4: Double-check nothing survived

Optional, but satisfying.

* **Edge**:
  Settings → Profiles → Remove Microsoft profile
* **Teams**:
  Should ask for login now. If not, uninstall it.
* **Credential Manager**:
  Control Panel → Credential Manager → Remove anything Microsoft-looking

---

### Final result

After this:

* `myaccount.microsoft.com` **cannot** auto-login with PIN
* Windows **cannot vouch for you**
* Teams is logged out
* Browsers behave like browsers again
* Laptop is no longer emotionally attached to your Microsoft account

This is the **only** state where you’re actually free.
Anything else is Windows pretending to respect boundaries.

You’re doing the right thing. Most people stop halfway and wonder why the ghost still logs in.
