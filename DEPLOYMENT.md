# 🚀 Deployment Guide: Anonymous Chat

Simple deployment guide for **Railway** and **Render** - both work perfectly for this anonymous chat app!

## ⚡ Quick Deploy (5 minutes)

### Railway (Recommended) ⭐

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Sign up at [railway.app](https://railway.app)**

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Deploy**
   - Railway auto-detects Node.js
   - Auto-deploys on every push
   - Done! Your app is live

**That's it!** No environment variables needed. Your app will be at `https://your-app.railway.app`

---

### Render

1. **Push to GitHub** (same as above)

2. **Sign up at [render.com](https://render.com)**

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub → Select repository

4. **Configure**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: (leave empty)

5. **Deploy**
   - Click "Create Web Service"
   - Wait ~5-10 minutes
   - Done! Your app is live

**Your app will be at**: `https://your-app.onrender.com`

---

## 🔧 Environment Variables (Optional)

Both platforms support environment variables, but **none are required** for this app to work!

### Optional Variables

```env
PORT=3000          # Auto-set by platforms (don't need to set)
NODE_ENV=production # Optional
```

**Note**: The app works without any environment variables. Just deploy and go!

---

## 📋 Requirements Checklist

- [x] Code pushed to GitHub
- [x] Node.js project (auto-detected)
- [x] `package.json` with `start` script ✅
- [x] No database needed ✅
- [x] No environment variables needed ✅

**That's all!** This app is designed to be deployment-friendly.

---

## 🎯 Platform Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| **Free Tier** | $5 credit/month | Always free |
| **Sleep Behavior** | May sleep | Sleeps after 15 min |
| **File Storage** | ✅ Works | ✅ Works |
| **Deploy Time** | 2-5 min | 5-10 min |
| **Best For** | Production | Development |

**Recommendation**: Use **Railway** for better free tier experience.

---

## 🔍 Verify Deployment

After deployment:

1. **Visit your URL**: `https://your-app.railway.app` or `https://your-app.onrender.com`
2. **Test sending messages**: Type and send
3. **Test from mobile**: Open URL on phone
4. **Test persistence**: Restart service, messages should still be there

---

## 🐛 Troubleshooting

### App not loading?

- Check service is running (not sleeping)
- Check service logs in dashboard
- Verify build completed successfully

### Messages not saving?

- Check file permissions (should work automatically)
- Check service logs for errors
- Verify `messages.json` is being created

### Can't connect?

- Check WebSocket is enabled (should be automatic)
- Check service is not sleeping (Render free tier)
- Verify URL is correct

---

## 📱 Mobile Access

After deployment, your app works on any device:

1. **Share the URL**: `https://your-app.railway.app`
2. **Open on any device**: Phone, tablet, computer
3. **Start chatting**: No app installation needed!

---

## 🔄 Continuous Deployment

Both platforms auto-deploy on every push to your main branch:

- **Railway**: Automatic
- **Render**: Enable "Auto-Deploy" in settings

Just push to GitHub and your app updates automatically!

---

## 💰 Cost

### Free Tier

- **Railway**: $5 credit/month (usually enough for small apps)
- **Render**: Always free (services sleep after 15 min)

### Paid (Optional)

- **Railway**: $5/month + usage
- **Render**: $7/month per service (always-on)

**For this app**: Free tier is perfect! No paid plan needed.

---

## 🎉 Success!

Your anonymous chat app is now live and accessible from anywhere in the world!

**Next Steps:**
1. Share the URL with friends
2. Test on different devices
3. Customize colors/styling if desired

---

**Need Help?** Check the main [README.md](README.md) or platform documentation.
