# Dog Vibes: Netlify Deployment Instructions

This site is a git repo with a `netlify.toml` already configured (`publish = "."`, forms auto-detected). The intended deploy method is Git-connected, not drag-and-drop.

---

## Option A: Git-connected deploy (current method)

1. Push this repo to GitHub: `klarke0/thedogvibes`
2. In Netlify, go to **Sites > Add new site > Import an existing project**
3. Connect the GitHub repo. Build settings come from `netlify.toml` automatically (no build command, publish directory `.`)
4. Auto-deploy on push is currently **disabled**. To ship a change: commit, push to GitHub, then trigger a deploy manually from the Netlify dashboard (**Deploys > Trigger deploy**)

## Option B: Deploy via Netlify CLI (one-off / testing)

1. In your terminal, run:
   ```
   npx netlify-cli login
   ```
2. This opens a browser window. Authorize with your Netlify account
3. Then deploy:
   ```
   npx netlify-cli deploy --dir="/Users/kevin/Desktop/Work Spaces/Dog.Vibes/CTO - Web Developer/Site" --prod
   ```
4. It will print the live URL when done

---

## Connect thedogvibes.com to Netlify

### In Netlify:
1. Go to your site dashboard
2. Click **Domain management** (or **Settings > Domain management**)
3. Click **Add a custom domain**
4. Enter: `thedogvibes.com`
5. Netlify will tell you to update DNS records

### In Squarespace (where the domain is registered):
1. Go to **squarespace.com** and log in
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
6. Back in Netlify, click **Verify** on the domain. It may take up to 48 hours for DNS to propagate, but usually works within minutes

### Enable HTTPS:
1. In Netlify > Domain management > HTTPS
2. Click **Verify DNS configuration**, then **Provision certificate**
3. Netlify provides free SSL via Let's Encrypt. This happens automatically once DNS is verified

---

## After Deployment

- Test all pages: Home, About, Services, Blog (and each post), FAQ, Book, Guestbook, Privacy Policy, Terms of Service
- Test mobile responsiveness (resize browser or use phone)
- Test all navigation links and CTA buttons
- Confirm the guestbook form submits and shows up under Netlify > Forms (it's auto-detected via `data-netlify="true"` in `guestbook.html`)
- The Book page's Tally embed is live and working. No placeholder to swap
- Replace the GA4 placeholder (`G-XXXXXXXXXX`) with the real Google Analytics ID when Kevin provides one

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
- `book.html` — Booking page (live Tally embed)
- `blog.html` — Blog index
- `blog-leash.html`, `blog-enrichment.html`, `blog-cooperative-care.html` — Blog posts
- `guestbook.html` — Guestbook (Netlify Forms)
- `privacy.html` — Privacy Policy
- `terms.html` — Terms of Service
- `styles.css` — All styling
- `animations.js` — Scroll/interaction animations
- `netlify.toml` — Netlify build and forms config
- `images/` — Logo and photos
