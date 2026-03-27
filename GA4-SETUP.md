# Google Analytics 4 — Setup Guide

GA4 tracking code has been added to all 7 pages of thedogvibes.com. You just need to create your GA4 property and drop in your Measurement ID.

---

## Step 1 — Create a GA4 Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Sign in with your Google account (use kevin@thedogvibes.com)
3. Click **Start measuring** (or **Admin** > **Create** > **Property** if you already have an account)
4. Property name: `The Dog Vibes`
5. Time zone: `United States — Pacific Time`
6. Currency: `US Dollar`
7. Click **Next** — select **Web** as your platform
8. Enter your website URL: `https://thedogvibes.com`
9. Stream name: `The Dog Vibes Website`
10. Click **Create stream**

---

## Step 2 — Get Your Measurement ID

After creating the stream, you'll see a **Measurement ID** that looks like: `G-ABC123XYZ`

Copy it.

---

## Step 3 — Add Your ID to the Site Files

Open each of the 7 HTML files listed below and do a find-and-replace:

- Find: `G-XXXXXXXXXX`
- Replace with: your actual Measurement ID (e.g. `G-ABC123XYZ`)

**Files to update** (all in `/CTO - Web Developer/Site/`):
- `index.html`
- `about.html`
- `services.html`
- `faq.html`
- `book.html`
- `privacy.html`
- `terms.html`

Each file has two instances of `G-XXXXXXXXXX` — replace both.

If you use VS Code, you can do a global find-and-replace across all files at once:
- Mac: `Cmd + Shift + H`
- Search: `G-XXXXXXXXXX`
- Replace: your real ID
- Click **Replace All**

---

## Step 4 — Redeploy the Site

After updating the files, redeploy to Netlify (drag-and-drop the Site folder, or via CLI). See `DEPLOY-INSTRUCTIONS.md` for the full steps.

---

## Step 5 — Verify It's Working

1. In GA4, go to **Reports** > **Realtime**
2. Open your live website in a browser tab
3. Within a minute or two, you should see **1 active user** in the Realtime report — that's you

If you see the activity, GA4 is working correctly.

---

## What GA4 Tracks (Out of the Box)

Once live, GA4 will automatically track:
- Page views (which pages get the most traffic)
- Sessions and users
- Traffic sources (Google search, direct, referral, social)
- Device type (mobile vs. desktop)
- Geographic location of visitors

No extra configuration needed for the basics. This is everything you need to understand how people find and use the site.
