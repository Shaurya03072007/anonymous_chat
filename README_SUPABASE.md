# 💬 Anonymous Chat - Supabase Version

Real-time anonymous chat application powered by **Supabase** (PostgreSQL + Realtime).

## ✨ Features

- 🔓 **100% Anonymous** - No registration, no login
- 💬 **Real-time Messaging** - Instant delivery via Supabase Realtime
- 💾 **Persistent Storage** - PostgreSQL database (never loses data!)
- 📱 **Works on Any Device** - Responsive design
- 👥 **Active User Count** - See how many users are online
- 🎲 **Random Indian Names** - Auto-assigned, saved in browser
- 🌐 **Fully Hosted** - Deploy to Vercel/Netlify (free)

## 🏗️ Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: Supabase PostgreSQL
- **Realtime**: Supabase Realtime subscriptions
- **Presence**: Supabase Presence for active users
- **Hosting**: Vercel/Netlify (static hosting)

**No backend server needed!** Everything runs in the browser.

## 🚀 Quick Start

### 1. Set Up Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL schema from `supabase/schema.sql`
4. Get your API keys from Settings → API

### 2. Configure App

Edit `chat-backend/index.html` and add your Supabase credentials:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

### 3. Test Locally

```bash
# Option 1: Python
cd chat-backend
python -m http.server 8000

# Option 2: Node.js
npx http-server chat-backend -p 3000

# Option 3: VS Code Live Server
# Right-click index.html → Open with Live Server
```

Open `http://localhost:8000` (or 3000) in your browser.

### 4. Deploy

**Vercel (Recommended):**
```bash
npm i -g vercel
cd chat-backend
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
cd chat-backend
netlify deploy
```

## 📚 Detailed Setup

See **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** for complete step-by-step instructions.

## 🎯 What's Different from Socket.io Version?

| Feature | Socket.io Version | Supabase Version |
|---------|------------------|------------------|
| **Backend** | Node.js server needed | No server needed! |
| **Storage** | JSON file | PostgreSQL database |
| **Realtime** | Socket.io | Supabase Realtime |
| **Hosting** | Railway/Render | Vercel/Netlify (static) |
| **Persistence** | File-based | Database (more reliable) |
| **Scalability** | Limited | Highly scalable |

## 🔒 Security

- **RLS Enabled**: Row Level Security policies configured
- **Public Read/Write**: Anyone can read and send messages
- **Anon Key**: Safe to expose in frontend code

## 📊 Database Schema

```sql
messages (
  id UUID PRIMARY KEY,
  text TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🎨 Features

- ✅ Anonymous messaging
- ✅ Real-time updates
- ✅ Active user tracking
- ✅ Random Indian names
- ✅ Persistent storage
- ✅ Mobile-optimized
- ✅ No backend required

## 🐛 Troubleshooting

**Messages not loading?**
- Check Supabase URL and key
- Verify RLS policies are set
- Check browser console for errors

**Realtime not working?**
- Enable Realtime in Supabase dashboard
- Go to Database → Replication
- Enable for `messages` table

**Active users not showing?**
- Check Presence is enabled
- Open multiple tabs to test

## 📈 Supabase Free Tier

- ✅ 500 MB database storage
- ✅ 5 GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Unlimited Realtime connections

**Perfect for a chat app!**

## 🚀 Deployment

### Vercel

1. Install: `npm i -g vercel`
2. Deploy: `cd chat-backend && vercel`
3. Set environment variables in dashboard
4. Done!

### Netlify

1. Install: `npm i -g netlify-cli`
2. Deploy: `cd chat-backend && netlify deploy`
3. Set environment variables
4. Done!

## 📝 Files

- `chat-backend/index.html` - Main app (frontend)
- `supabase/schema.sql` - Database schema
- `SUPABASE_SETUP.md` - Complete setup guide

## 🎉 Benefits of Supabase

1. **No Server Management** - Everything in the browser
2. **Persistent Storage** - PostgreSQL (never lose data)
3. **Real-time** - Built-in Realtime subscriptions
4. **Scalable** - Handles millions of messages
5. **Free Tier** - Generous free limits
6. **Easy Deployment** - Static hosting (Vercel/Netlify)

---

**Ready to deploy?** Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions! 🚀

