# 🚀 Quick Setup Guide

## Installation (One Command)

```bash
npm run install:all
```

This installs all dependencies for both backend and mobile app.

## Running the Application

### Terminal 1: Start Backend Server

```bash
npm start
```

Server runs on: **http://localhost:3000**

### Terminal 2: Start Mobile App

```bash
npm run mobile
```

Then:
- Press `w` for web browser
- Scan QR code with Expo Go app (mobile device)
- Press `a` for Android emulator
- Press `i` for iOS simulator

## ⚠️ Important for Mobile Testing

**Update the IP address in `chat-mobile/App.js` (line 13):**

```javascript
const SOCKET_URL = "http://YOUR_LOCAL_IP:3000";
```

**Find your local IP:**
- **Windows**: `ipconfig` → Look for "IPv4 Address"
- **Mac/Linux**: `ifconfig` → Look for "inet"

## ✅ Verification Checklist

- [ ] Backend server running (check terminal for "✅ Server running")
- [ ] Web client accessible at http://localhost:3000
- [ ] Mobile app started (Expo QR code visible)
- [ ] IP address updated in App.js (for mobile device testing)
- [ ] Can register with username
- [ ] Can send and receive messages

## 🐛 Common Issues

**Port 3000 already in use?**
- Change PORT in `chat-backend/server.js` or kill the process

**Mobile can't connect?**
- Check IP address is correct
- Ensure same Wi-Fi network
- Check firewall allows port 3000

**Dependencies missing?**
- Run `npm run install:all` again

---

For detailed documentation, see [README.md](README.md)


