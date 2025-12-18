# ⚡ Quick Deployment Checklist

## 🚂 Railway (Recommended)

### 1. Setup (5 minutes)
- [ ] Push code to GitHub
- [ ] Sign up at [railway.app](https://railway.app)
- [ ] Create new project → Deploy from GitHub
- [ ] Select your repository

### 2. Environment Variables
Add in Railway dashboard → Variables:
```env
NODE_ENV=production
SESSION_SECRET=<generate-32-char-secret>
ALLOWED_ORIGINS=https://your-app.railway.app
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Deploy
- [ ] Railway auto-deploys on push
- [ ] Wait for deployment
- [ ] Get your URL: `https://your-app.railway.app`

### 4. Update Mobile App
Change `SOCKET_URL` in `chat-mobile/App.js`:
```javascript
const SOCKET_URL = "https://your-app.railway.app";
```

---

## 🎨 Render

### 1. Setup (5 minutes)
- [ ] Push code to GitHub
- [ ] Sign up at [render.com](https://render.com)
- [ ] New → Web Service
- [ ] Connect GitHub → Select repository

### 2. Service Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: (leave empty)

### 3. Environment Variables
Add in Render dashboard → Environment:
```env
NODE_ENV=production
SESSION_SECRET=<generate-32-char-secret>
ALLOWED_ORIGINS=https://your-app.onrender.com
```

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait ~5-10 minutes for first deploy
- [ ] Get your URL: `https://your-app.onrender.com`

### 5. Update Mobile App
Change `SOCKET_URL` in `chat-mobile/App.js`:
```javascript
const SOCKET_URL = "https://your-app.onrender.com";
```

---

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - **Railway**: Services may sleep after inactivity
   - **Render**: Services sleep after 15 min (cold start ~30 sec)

2. **Session Storage:**
   - Sessions are in-memory (lost on restart)
   - This is expected behavior

3. **CORS:**
   - Must set `ALLOWED_ORIGINS` with your production URL
   - Format: `https://domain1.com,https://domain2.com`

4. **Testing:**
   - Test web client at your production URL
   - Update mobile app `SOCKET_URL` before testing
   - Verify WebSocket connections work

---

## 🔧 Troubleshooting

**Can't connect?**
- Check service is running (not sleeping)
- Verify environment variables
- Check service logs

**CORS errors?**
- Add client URL to `ALLOWED_ORIGINS`
- Restart service after updating env vars

**WebSocket fails?**
- Verify service is not sleeping
- Check Socket.io configuration
- Review service logs

---

For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

