# Dog Vibes — Netlify Deployment Instructions

Your site is fully built and ready to deploy. Here's exactly what to do.

---

## Option A: Deploy via Netlify Drag-and-Drop (Easiest)

1. Go to **app.netlify.com** and sign up / log in (use your email or GitHub)
2. On the dashboard, look for **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**
3. Open Finder and navigate to:
   ```
   /Users/kevin/Desktop/Work Spaces/Dog.Vibes/CTO - Web Developer/Site/
   ```
4. Drag the entire **Site** folder onto the Netlify drop zone
5. Netlify will deploy immediately and give you a URL like `random-name-123.netlify.app`
6. Done — your site is live at that URL

---

## Option B: Deploy via Netlify CLI (Terminal)

1. In your terminal, run:
   ```
   npx netlify-cli login
   ```
2. This opens a browser window — authorize with your Netlify account
3. Then deploy:
   ```
   npx netlify-cli deploy --dir="/Users/kevin/Desktop/Work Spaces/Dog.Vibes/CTO - Web Developer/Site" --prod
   ```
4. If it asks to create a new site, say yes
5. It will print the live URL when done

---

## Connect thedogvibes.com to Netlify

After deploying, connect your custom domain:

### In Netlify:
1. Go to your site dashboard on Netlify
2. Click **Domain management** (or **Settings > Domain management**)
3. Click **Add a custom domain**
4. Enter: `thedogvibes.com`
5. Netlify will tell you to update DNS records

### In Squarespace (where your domain is registered):
1. Go to **squarespace.com** > log in
2. Go to **Settings > Domains > thedogvibes.com > DNS Settings**
3. Delete any existing A or CNAME records pointing to Squarespace
4. Add these DNS records:

**A Record:**
- Host: `@` (or blank)
- Value: `75.2.60.5`

**CNAME Record:**
- Host: `www`
- Value: `[your-site-name].netlify.app` (the URL Netlify gave you)

5. Save changes
6. Back in Netlify, click **Verify** on the domain — it may take up to 48 hours for DNS to propagate, but usually works within minutes

### Enable HTTPS:
1. In Netlify > Domain management > HTTPS
2. Click **Verify DNS configuration** then **Provision certificate**
3. Netlify provides free SSL via Let's Encrypt — this happens automatically once DNS is verified

---

## After Deployment

- Test all pages: Home, About, Services, FAQ, Book, Privacy Policy, Terms of Service
- Test mobile responsiveness (resize browser or use phone)
- Test all navigation links and CTA buttons
- The Tally form on the Book page is a placeholder — replace it with your embed code when ready

---

## Site Files Location

All files are at:
```
/Users/kevin/Desktop/Work Spaces/Dog.Vibes/CTO - Web Developer/Site/
```

Files:
- `index.html` — Home page
- `about.html` — About page
- `services.html` — Services page
- `faq.html` — FAQ page
- `book.html` — Booking page (with Tally placeholder)
- `privacy.html` — Privacy Policy
- `terms.html` — Terms of Service
- `styles.css` — All styling
- `images/` — Logo and photos
