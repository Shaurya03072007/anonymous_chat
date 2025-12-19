# 🗄️ Supabase Setup Guide

Complete guide to set up Supabase database for your Anonymous Chat application.

## 📋 Prerequisites

- A free Supabase account - [Sign up here](https://supabase.com)
- Node.js installed on your machine

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### Step 2: Create a New Project

1. Click **"New Project"** in your dashboard
2. Fill in the details:
   - **Name**: `anonymous-chat` (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (perfect for this app)
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be created

### Step 3: Get Your Supabase Credentials

1. In your project dashboard, click **"Settings"** (gear icon)
2. Click **"API"** in the left sidebar
3. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

**Copy both of these - you'll need them!**

### Step 4: Run the Database Schema

1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

You should see: **"Success. No rows returned"**

### Step 5: Enable Realtime

1. In Supabase dashboard, go to **"Database"** → **"Replication"**
2. Find the `messages` table
3. Toggle **"Enable Realtime"** to ON
4. Or run this SQL in SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Step 6: Set Environment Variables

#### For Local Development

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
NODE_ENV=development
```

**Replace:**
- `your-project-id` with your actual project ID
- `your-anon-key-here` with your actual anon key

#### For Production (Railway/Render)

1. **Railway:**
   - Go to your service → **Variables** tab
   - Add:
     - `SUPABASE_URL` = your Supabase URL
     - `SUPABASE_ANON_KEY` = your anon key

2. **Render:**
   - Go to your service → **Environment** section
   - Add:
     - `SUPABASE_URL` = your Supabase URL
     - `SUPABASE_ANON_KEY` = your anon key

### Step 7: Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` package.

### Step 8: Test the Setup

1. Start your server:
   ```bash
   npm start
   ```

2. You should see:
   ```
   ✅ Supabase client initialized
   ✅ Loaded X messages from Supabase
   ```

3. Open `http://localhost:3000` in your browser
4. Send a test message
5. Check Supabase dashboard → **Table Editor** → `messages` table
6. You should see your message there!

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database schema executed (no errors)
- [ ] Realtime enabled for `messages` table
- [ ] Environment variables set (`.env` file or platform)
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] Messages appear in Supabase table
- [ ] Messages load on page refresh

## 🔍 Troubleshooting

### Error: "Supabase credentials not found"

**Solution:**
- Check `.env` file exists in root directory
- Verify variable names: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Restart server after adding variables

### Error: "relation 'messages' does not exist"

**Solution:**
- Run the SQL schema from `supabase/schema.sql`
- Check SQL Editor for any errors
- Verify table was created in Table Editor

### Messages not saving

**Solution:**
- Check Supabase dashboard → Table Editor → `messages` table
- Verify RLS policies are set correctly (should allow public access)
- Check server logs for errors

### Realtime not working

**Solution:**
- Go to Database → Replication
- Enable Realtime for `messages` table
- Or run: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

### Can't connect to Supabase

**Solution:**
- Verify your Supabase URL is correct
- Check your internet connection
- Verify project is not paused (free tier projects pause after inactivity)

## 📊 Database Structure

### Messages Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `text` | TEXT | Message content |
| `sender` | TEXT | Sender name (random Indian name) |
| `created_at` | TIMESTAMP | When message was created |
| `updated_at` | TIMESTAMP | When message was last updated |

## 🔒 Security

The database uses **Row Level Security (RLS)** with public access policies:
- ✅ Anyone can read messages
- ✅ Anyone can insert messages
- ✅ Anyone can update/delete (for future features)

**Note**: This is a public chat app. For production with authentication, you'd want to restrict access.

## 📈 Free Tier Limits

Supabase free tier includes:
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth
- ✅ Unlimited API requests
- ✅ Realtime subscriptions

**For this app**: Free tier is more than enough!

## 🚀 Next Steps

1. ✅ Database setup complete
2. ✅ Backend configured
3. ✅ Frontend ready
4. 🎉 Start chatting!

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Need Help?** Check the troubleshooting section or Supabase documentation!

