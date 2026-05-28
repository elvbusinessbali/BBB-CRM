# BBB CRM

A dead-simple CRM for small business owners. Customers, interactions, lifetime value, pipeline.

Built with **Next.js 16** + **Supabase** + **Tailwind**. Mobile-first. EN + ID.

## What's in it

- **Sign up / log in** — email + password
- **Customer database** — name, phone, email, birthday, tags, notes, status
- **Pipeline status** per customer: Cold · Warm · Hot · Deal done · Paused
- **Interactions timeline** — log visits, calls, sales (with amount)
- **Lifetime Value** — auto-summed from interactions, shown per customer + totals on the dashboard
- **Dashboard** — total customers, dormant (30+ days), birthdays today, pipeline counts

Multi-tenant: each business sees only its own data (Supabase Row-Level Security).

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase keys
npm run dev
```

Visit http://localhost:3000.

### Supabase setup

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query**: paste [`supabase/schema.sql`](supabase/schema.sql), Run.
3. If you ran the schema before status existed, also run [`supabase/migrations/01_add_status.sql`](supabase/migrations/01_add_status.sql).
4. **Project Settings → API**: copy the URL + `anon` key into `.env.local`.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Both are safe to expose in the browser bundle — your data is protected by RLS policies on the server side.

## Deploy

Vercel — connect this repo, paste the two env vars, click Deploy. Then add your Vercel URL to Supabase → Authentication → URL Configuration.
