# Environment Variables & Backend Integration Guide

This project integrates three industry-standard cloud providers:
1. **Clerk**: Authentication, user accounts, JWT sessions, multi-factor & social logins.
2. **Supabase**: PostgreSQL database, Row-Level Security (RLS), real-time leaderboards & 3D asset storage.
3. **Resend**: Transactional emails, welcome bonus confirmations, tournament announcements.

---

## 1. Setting Up Clerk Authentication
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com) and create an application named **Naija Street Arcade**.
2. Under **API Keys**, copy:
   - `Publishable key` $\rightarrow$ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` $\rightarrow$ `CLERK_SECRET_KEY`
3. Under **Webhooks**, click **Add Endpoint**:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the Signing Secret $\rightarrow$ `CLERK_WEBHOOK_SECRET`

---

## 2. Setting Up Supabase Database & Storage
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. In the **SQL Editor**, paste and run the contents of [`supabase/schema.sql`](../supabase/schema.sql).
3. Under **Project Settings > API**, copy:
   - `Project URL` $\rightarrow$ `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` $\rightarrow$ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` $\rightarrow$ `SUPABASE_SERVICE_ROLE_KEY`
4. Under **Storage**, verify that the following buckets were created:
   - `avatars` (public)
   - `game_assets` (public)
   - `match_replays` (authenticated)

---

## 3. Setting Up Resend Email
1. Go to [https://resend.com](https://resend.com) and create an API key.
2. Copy the key $\rightarrow$ `RESEND_API_KEY`.
3. Set your verified domain email $\rightarrow$ `RESEND_FROM_EMAIL`. For local development, you can use `onboarding@resend.dev`.

---

## 4. Local Run Instructions
Copy the example file to `.env.local`:
```bash
cp env/.env.local.example .env.local
```
Add your live keys, then start the server:
```bash
npm run dev
```
