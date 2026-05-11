# v3-retro working branch — see docs/superpowers/specs/2026-05-10-v3-retro-redesign-design.md

## Guestbook moderation

When a new submission arrives via Netlify Forms:
1. Open Netlify dashboard → Forms → guestbook submissions.
2. Read the new submission. If keep-worthy:
3. Edit /CTO - Web Developer/Site/data/guestbook-entries.json, append:
     { "name": "<their name>", "message": "<their message>", "date": "YYYY-MM-DD" }
4. Commit + push to v3-retro (or main once merged).
5. Trigger Netlify deploy (auto-deploy is off).
