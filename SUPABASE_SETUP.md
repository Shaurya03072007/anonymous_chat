# 🚀 Supabase Setup Guide

Complete guide to set up your anonymous chat app with Supabase.

## 📋 Prerequisites

1. **Supabase Account** - Sign up at [supabase.com](https://supabase.com) (Free tier available)
2. **GitHub Account** - For hosting (optional, can use Vercel/Netlify)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Fill in:
   - **Organization**: Create new or select existing
   - **Project Name**: `anonymous-chat` (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be ready

---

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see: **"Success. No rows returned"**

This creates:
- `messages` table
- Indexes for performance
- Row Level Security policies (public read/write)
- Auto-update triggers

---

## Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

**Keep these safe!** You'll need them in the next step.

---

## Step 4: Configure the App

### Option A: Direct Configuration (Quick Test)

Edit `chat-backend/index.html` and replace these lines:

```javascript
const SUPABASE_URL = window.SUPABASE_URL || prompt("Enter your Supabase URL:");
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || prompt("Enter your Supabase Anon Key:");
```

With:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

### Option B: Environment Variables (Recommended for Production)

For production, use environment variables. See deployment section below.

---

## Step 5: Test Locally

1. Open `chat-backend/index.html` in your browser
   - Or use a local server: `python -m http.server 8000`
   - Or use Live Server in VS Code

2. Send a test message
3. Check Supabase dashboard → **Table Editor** → `messages`
4. You should see your message!

---

## Step 6: Deploy to Production

### Option A: Vercel (Recommended - Free)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd chat-backend
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add:
     - `SUPABASE_URL` = Your Supabase URL
     - `SUPABASE_ANON_KEY` = Your anon key

4. **Update HTML to use environment variables:**
   ```javascript
   const SUPABASE_URL = window.SUPABASE_URL || "https://your-project.supabase.co";
   const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "your-anon-key";
   ```

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Option B: Netlify (Free)

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd chat-backend
   netlify deploy
   ```

3. **Set Environment Variables** in Netlify dashboard

### Option C: GitHub Pages (Free)

1. Push code to GitHub
2. Go to repository → Settings → Pages
3. Select source branch
4. Your app will be at: `https://username.github.io/repo-name`

**Note:** For GitHub Pages, you'll need to hardcode the keys (not recommended for production).

---

## 🔒 Security Notes

### Row Level Security (RLS)

The schema includes RLS policies that allow:
- ✅ **Public read** - Anyone can read messages
- ✅ **Public write** - Anyone can send messages

This is perfect for an anonymous chat app!

### API Keys

- **Anon Key**: Safe to expose in frontend (it's public)
- **Service Role Key**: **NEVER expose this** - Keep it secret!

---

## 📊 Database Structure

### Messages Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `text` | TEXT | Message content |
| `sender` | TEXT | Sender name |
| `created_at` | TIMESTAMP | Auto-set on insert |
| `updated_at` | TIMESTAMP | Auto-updated |

### Indexes

- `idx_messages_created_at` - Fast queries by date

---

## 🧪 Testing

### Test Database Connection

1. Open browser console
2. Check for errors
3. Send a message
4. Verify in Supabase dashboard → Table Editor

### Test Realtime

1. Open app in two browser windows
2. Send message from one
3. Should appear instantly in the other

### Test Active Users

1. Open app in multiple tabs/windows
2. Check active user count updates

---

## 🐛 Troubleshooting

### "Failed to load messages"

**Check:**
- Supabase URL is correct
- Anon key is correct
- RLS policies are enabled
- Table exists (run schema.sql)

### "Realtime not working"

**Check:**
- Realtime is enabled in Supabase dashboard
- Go to Database → Replication
- Enable replication for `messages` table

### "Active users not updating"

**Check:**
- Presence is enabled
- Multiple tabs/windows are open
- Browser allows WebSocket connections

---

## 📈 Performance Tips

1. **Limit Messages**: The app loads last 10,000 messages
2. **Add Pagination**: For very large datasets
3. **Enable Indexes**: Already included in schema
4. **Monitor Usage**: Check Supabase dashboard for usage

---

## 💰 Supabase Free Tier Limits

- **Database**: 500 MB storage
- **Bandwidth**: 5 GB/month
- **API Requests**: Unlimited
- **Realtime**: Unlimited connections

**For a chat app**: Free tier is usually enough!

---

## 🎉 Success!

Your app is now:
- ✅ Using Supabase PostgreSQL (persistent storage)
- ✅ Using Supabase Realtime (real-time updates)
- ✅ Using Supabase Presence (active user tracking)
- ✅ Fully hosted and scalable

**Next Steps:**
1. Customize the UI
2. Add features (file uploads, reactions, etc.)
3. Monitor usage in Supabase dashboard

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

---

**Need Help?** Check Supabase dashboard logs or open an issue!

