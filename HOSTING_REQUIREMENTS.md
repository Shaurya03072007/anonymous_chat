# 📋 Hosting Requirements: Railway & Render

## ✅ What You Need

### 1. **GitHub Repository**
   - Your code must be on GitHub (public or private)
   - Both platforms connect via GitHub

### 2. **Account Setup**
   - **Railway**: [Sign up](https://railway.app/) (Free tier available)
   - **Render**: [Sign up](https://render.com/) (Free tier available)

### 3. **Required Environment Variables**

Both platforms need these environment variables configured:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ Yes | Set to `production` | `production` |
| `SESSION_SECRET` | ✅ Yes | Secret key for sessions (min 32 chars) | `your-secret-key-here` |
| `ALLOWED_ORIGINS` | ✅ Yes | Comma-separated allowed origins | `https://app.railway.app` |
| `PORT` | ❌ No | Auto-set by platforms | `3000` (automatic) |

### 4. **Generate SESSION_SECRET**

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Online Generator:**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (256-bit)

---

## 🚂 Railway Requirements

### Minimum Requirements
- ✅ Node.js project (auto-detected)
- ✅ `package.json` with `start` script
- ✅ GitHub repository

### Configuration
- **Build Command**: `npm install` (auto-detected)
- **Start Command**: `npm start` (from package.json)
- **Root Directory**: Empty (or `chat-backend` if deploying only backend)

### Environment Variables to Set
```env
NODE_ENV=production
SESSION_SECRET=<your-generated-secret>
ALLOWED_ORIGINS=https://your-app-name.railway.app
```

### Free Tier Limits
- $5 credit/month
- Services may sleep after inactivity
- Auto HTTPS included
- WebSocket support ✅

### Deployment Steps
1. Connect GitHub account
2. Create new project → Deploy from GitHub
3. Select repository
4. Add environment variables
5. Deploy (automatic on push)

**Time to Deploy**: ~2-5 minutes

---

## 🎨 Render Requirements

### Minimum Requirements
- ✅ Node.js project
- ✅ `package.json` with `start` script
- ✅ GitHub repository

### Configuration
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: Empty (or `chat-backend` if deploying only backend)
- **Environment**: Node
- **Plan**: Free (or paid for always-on)

### Environment Variables to Set
```env
NODE_ENV=production
SESSION_SECRET=<your-generated-secret>
ALLOWED_ORIGINS=https://your-app-name.onrender.com
```

### Free Tier Limits
- Always free
- Services sleep after 15 min inactivity
- Cold start delay (~30 seconds after sleep)
- Auto HTTPS included
- WebSocket support ✅

### Deployment Steps
1. Connect GitHub account
2. New → Web Service
3. Select repository
4. Configure build/start commands
5. Add environment variables
6. Create service

**Time to Deploy**: ~5-10 minutes (first time)

---

## 🔧 Code Requirements

### Your `package.json` must have:
```json
{
  "scripts": {
    "start": "node chat-backend/server.js"
  },
  "dependencies": {
    "express": "^5.2.1",
    "socket.io": "^4.8.1",
    "express-session": "^1.18.1",
    "cors": "^2.8.5",
    "uuid": "^11.0.3"
  }
}
```

### Your server must:
- ✅ Listen on `process.env.PORT` (both platforms set this automatically)
- ✅ Handle CORS properly (already configured)
- ✅ Support WebSocket connections (Socket.io handles this)

---

## ⚠️ Important Considerations

### Session Storage Limitation
- **Current Setup**: In-memory session storage
- **Impact**: Sessions and messages are lost on server restart
- **For Production**: Consider Redis or database for persistence

### Free Tier Limitations

**Railway:**
- Services may sleep after inactivity
- Good for development/testing

**Render:**
- Services sleep after 15 minutes of inactivity
- First request after sleep has ~30 second delay
- WebSocket connections disconnect on sleep
- **Solution**: Upgrade to paid plan ($7/month) for always-on

### CORS Configuration
- Must set `ALLOWED_ORIGINS` with your production URL
- Format: `https://domain1.com,https://domain2.com` (comma-separated, no spaces)
- Include both web and mobile app URLs if different

### WebSocket Support
- ✅ Both platforms support WebSocket (Socket.io works)
- ✅ No additional configuration needed
- ⚠️ Render free tier: WebSocket disconnects when service sleeps

---

## 📊 Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| **Free Tier** | $5 credit/month | Always free |
| **Sleep Behavior** | May sleep | Sleeps after 15 min |
| **Cold Start** | Fast | ~30 seconds |
| **WebSocket** | ✅ Works | ✅ Works (disconnects on sleep) |
| **HTTPS** | ✅ Auto | ✅ Auto |
| **Deploy Time** | 2-5 min | 5-10 min (first) |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Recommended For** | Development/Production | Development/Testing |

---

## 🎯 Recommended Setup

### For Development/Testing
- **Railway** (better free tier experience, faster)

### For Production
- **Railway Paid** ($5/month + usage) OR
- **Render Paid** ($7/month per service)
- Consider adding Redis for session persistence

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Code is pushed to GitHub
- [ ] `package.json` has correct `start` script
- [ ] `.gitignore` excludes `node_modules`
- [ ] Environment variables ready:
  - [ ] `NODE_ENV=production`
  - [ ] `SESSION_SECRET` (32+ chars, generated)
  - [ ] `ALLOWED_ORIGINS` (your production URL)
- [ ] Tested locally with `npm start`
- [ ] Mobile app `SOCKET_URL` ready to update

---

## 🚀 Quick Start

**Railway:**
1. Push to GitHub
2. Sign up at railway.app
3. New Project → Deploy from GitHub
4. Add environment variables
5. Deploy (automatic)

**Render:**
1. Push to GitHub
2. Sign up at render.com
3. New → Web Service
4. Connect GitHub → Select repo
5. Configure build/start commands
6. Add environment variables
7. Create service

---

## 📚 Detailed Guides

- **Full Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Quick Checklist**: [DEPLOYMENT_QUICK.md](DEPLOYMENT_QUICK.md)
- **Main README**: [README.md](README.md)

---

## 🆘 Need Help?

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
2. Review troubleshooting section
3. Check platform documentation:
   - [Railway Docs](https://docs.railway.app/)
   - [Render Docs](https://render.com/docs)

---

**Ready to deploy?** Start with [DEPLOYMENT_QUICK.md](DEPLOYMENT_QUICK.md) for a step-by-step checklist!


