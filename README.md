# FST Marketing Hub

One tool, two engines: **fill the Wednesday workshop** (B2C) and **open outplacement conversations** (B2B). Content gets created, approved, published, and measured here.

## The machine

```
BRIEF GENERATOR ──▶ APPROVALS ──▶ 📤 SCHEDULE (Blotato) ──▶ posts go out
OUTREACH desk   ──▶ daily CSV in ──▶ personalized invites ──▶ workshop registrations
B2B PIPELINE    ──▶ layoff triggers in ──▶ cold/follow-up sequence ──▶ calls on John's calendar
DASHBOARD       ──▶ weekly scoreboard — the Monday habit that keeps it honest
```

## Weekly operating rhythm

| When | Who | What |
|------|-----|------|
| Daily (60–90 min) | Outbound operator | Paste `daily_prospects_*.csv` into **Outreach** → verify each Tier-1 prospect on Sales Navigator → Generate invite → send connection note → mark Invited. Follow up at 3–5 days. |
| Monday | Outbound operator | Pull the week's WARN filings + layoffs.fyi events (500–5,000 employees, RIFs 20–200) → add as **B2B Pipeline** target accounts → send Touch #1 to 2–3 contacts per company. |
| Tue–Thu | Content operator | Cut last workshop recording into clips/posts → **Brief Generator** → John/Ian approve → 📤 schedule the week via Blotato. Every FST post CTA = workshop registration. |
| Wednesday 11am CT | John | Run the workshop. Record it — it's next week's content. |
| Monday (15 min) | John + team | **Dashboard** → enter GoToWebinar registrations/attendees + B2B conversations → save. If a number hasn't moved in 3 weeks, change the play. |

## Setup (one time)

Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | already set (brief generation) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | already set |
| `BLOTATO_API_KEY` | **new** — Blotato dashboard → Settings → API |

Blotato account IDs: Blotato dashboard → Accounts → copy the numeric ID per connected platform. First time you schedule, paste the ID and tick "Remember this account" — it autofills after that.

Database: tables (`prospects`, `b2b_accounts`, `b2b_touches`, `publish_targets`, `published_posts`, `weekly_metrics`) are already created in the `fst-marketing-hub` Supabase project — see `supabase.sql` for the reference schema.

## Platform notes for scheduling

- **Facebook** requires a Page ID. **LinkedIn** company pages need a Page ID; personal profile posts don't.
- **TikTok** posts use safe defaults (public, comments on, not flagged AI-generated — John is on camera).
- **YouTube** needs a title (prefilled from the asset title), posts public, notifies subscribers.
- Media URLs must be publicly accessible (Blotato fetches them).

## Security note

This app has no login and the Supabase tables use open policies — anyone with the URL can read/write. Keep the URL private, or turn on Vercel Deployment Protection (Settings → Deployment Protection → Password) — 2 minutes, worth it now that prospect names live here.
