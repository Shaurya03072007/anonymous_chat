# 💬 Anonymous Chat Application

A simple, anonymous real-time chat application that works on **any device** (web, mobile, tablet). No registration, no login - just open and chat!

## ✨ Features

- 🔓 **100% Anonymous** - No registration, no login, no tracking
- 💬 **Real-time Messaging** - Instant message delivery using Socket.io
- 📱 **Works on Any Device** - Responsive design for mobile, tablet, and desktop
- 💾 **Persistent Storage** - Messages saved to file (survives server restarts)
- 📜 **Long Chat History** - Stores up to 10,000 messages
- 🌐 **Public Access** - Anyone can join and chat
- ⚡ **Lightweight** - Simple, fast, and easy to deploy

## 🏗️ Architecture

```
whatsapp-main/
├── chat-backend/          # Express + Socket.io server
│   ├── server.js         # Main server file
│   ├── index.html        # Web client (responsive)
│   └── messages.json     # Message storage (auto-created)
└── package.json          # Dependencies
```

## 📋 Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Supabase Account** (free) - [Sign up](https://supabase.com)

## 🗄️ Database Setup Required

This app uses **Supabase** for persistent message storage. You need to:

1. **Create Supabase account** (free)
2. **Create a project** in Supabase
3. **Run the database schema** (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
4. **Set environment variables** (Supabase URL and key)

**Quick Setup**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

## 🚀 Quick Start

### Step 1: Set Up Supabase Database

**Important**: You must set up Supabase first!

1. Follow the complete guide: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. Or quick steps:
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Run SQL from `supabase/schema.sql` in SQL Editor
   - Get your URL and anon key from Settings → API

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the Server

```bash
npm start
```

The server will:
- ✅ Connect to Supabase
- ✅ Load all previous messages from database
- ✅ Start on **http://localhost:3000**

### Step 5: Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

**That's it!** Start chatting - all messages are saved in Supabase!

## 🌐 Access from Any Device

### On the Same Network

1. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` → Look for "IPv4 Address"
   - **Mac/Linux**: Run `ifconfig` → Look for "inet"

2. On any device (phone, tablet, another computer), open:
   ```
   http://YOUR_LOCAL_IP:3000
   ```

### Example:
If your IP is `192.168.1.100`, open `http://192.168.1.100:3000` on any device.

## 🚀 Deploy to Free Hosting

### Recommended Free Platforms

1. **Railway** ⭐ (Best for this app)
   - Free tier: $5 credit/month
   - Auto HTTPS
   - File storage works perfectly
   - [Deployment Guide](DEPLOYMENT.md#-railway-deployment)

2. **Render**
   - Always free
   - Services sleep after 15 min (free tier)
   - [Deployment Guide](DEPLOYMENT.md#-render-deployment)

3. **Fly.io**
   - Free tier available
   - Good for persistent storage

### Quick Deploy to Railway

1. Push code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Select your repository
5. Add environment variable (optional):
   ```env
   PORT=3000
   ```
6. Deploy! Your app will be live at `https://your-app.railway.app`

**No other configuration needed!** The app works out of the box.

## 📝 How It Works

1. **Anonymous Chat**: Users get random Indian names (saved in browser)
2. **Database Storage**: Messages are saved to Supabase database
3. **Persistent**: Messages survive server restarts (stored in cloud)
4. **Real-time**: Instant message delivery via Socket.io
5. **History**: All messages loaded from database on startup
6. **Active Users**: Shows count of online users in header

## 🔧 Configuration

### Supabase Credentials

Set in `.env` file or environment variables:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Change Message Limit

Edit `chat-backend/server.js`:
```javascript
const MAX_MESSAGES = 10000; // Change this number
```

### Change Port

Set environment variable:
```bash
PORT=8080 npm start
```

Or edit `chat-backend/server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

## 📂 File Structure

```
whatsapp-main/
├── chat-backend/
│   ├── server.js          # Main server (uses Supabase)
│   └── index.html         # Web client
├── supabase/
│   └── schema.sql         # Database schema
├── package.json           # Dependencies
├── README.md              # This file
├── SUPABASE_SETUP.md      # Supabase setup guide
└── DEPLOYMENT.md          # Deployment guide
```

## 🎯 Features Explained

### Anonymous Messaging
- No user accounts
- No registration
- All messages from "Unknown"
- Complete privacy

### Persistent Storage
- Messages saved to Supabase database
- Survives server restarts
- All messages loaded on startup
- Cloud-based (accessible from anywhere)

### Responsive Design
- Works on phones, tablets, desktops
- Touch-friendly interface
- Auto-adjusts to screen size
- Smooth scrolling

### Real-time Updates
- Instant message delivery
- No page refresh needed
- Auto-reconnection on disconnect
- Connection status indicator

## 🐛 Troubleshooting

### "Supabase credentials not found" error?

1. Create `.env` file in root directory
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Restart server

### Messages not appearing?

1. Check server is running
2. Check browser console for errors
3. Verify Supabase connection (check server logs)
4. Verify messages table exists in Supabase

### Messages not saving?

1. Check Supabase dashboard → Table Editor
2. Verify RLS policies are set (should allow public access)
3. Check server logs for Supabase errors

### Can't access from mobile device?

1. Ensure same Wi-Fi network
2. Check firewall allows port 3000
3. Use local IP address (not localhost)

### Port already in use?

Change the port:
```bash
PORT=8080 npm start
```

### Database connection issues?

1. Verify Supabase project is active (not paused)
2. Check your internet connection
3. Verify credentials in `.env` file
4. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for help

## 🔒 Privacy & Security

- **No Tracking**: No user accounts, no cookies, no tracking
- **Anonymous**: All users appear as "Unknown"
- **Public**: Anyone with the URL can join
- **No Moderation**: All messages are allowed (up to 2000 chars)

**Note**: This is a public chat room. Anyone can see all messages. Use responsibly.

## 📊 Technical Details

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloud database (Supabase)
- **Protocol**: WebSocket for real-time communication
- **Max Message Length**: 2000 characters
- **Max Messages Loaded**: 10,000 (configurable)
- **Real-time**: Socket.io for instant messaging

## 🚀 Production Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect Railway to GitHub
3. Deploy (automatic)
4. Done! No configuration needed.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Environment Variables (Optional)

```env
PORT=3000
NODE_ENV=production
```

That's it! No other configuration needed.

## 📱 Mobile Access

The web app is fully responsive and works on:
- ✅ iPhone/iPad (Safari, Chrome)
- ✅ Android phones/tablets (Chrome, Firefox)
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Any device with a web browser

Just open the URL in your mobile browser - no app installation needed!

## 🎨 Customization

### Change Colors

Edit `chat-backend/index.html` CSS:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
Change the hex colors to your preference.

### Change Message Limit

Edit `MAX_MESSAGES` in `server.js`

### Change Auto-save Interval

Edit the `setInterval` in `server.js`

## 📄 License

ISC

## 🤝 Contributing

Contributions welcome! Feel free to submit pull requests.

## ⚠️ Important Notes

1. **Public Chat**: Anyone with the URL can join and see all messages
2. **No Moderation**: All messages are allowed (within length limits)
3. **File Storage**: Messages stored in `messages.json` file
4. **No Database**: Uses simple file-based storage
5. **Free Hosting**: Works great on Railway, Render, Fly.io free tiers

---

**Ready to chat?** Just run `npm install && npm start` and open `http://localhost:3000`! 🚀
