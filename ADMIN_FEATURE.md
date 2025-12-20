# 🔐 Admin Feature Documentation

## Overview

The admin feature allows access to an admin control panel using a secret 10-digit alphanumeric code.

## How It Works

1. **Enter Admin Code**: Type the admin code in the chat message input
2. **Send Message**: Click send (the code won't be sent as a regular message)
3. **Auto-Redirect**: You'll be automatically redirected to `/admin` control panel
4. **Session Storage**: Admin access is stored in browser localStorage

## Setting Admin Code

### Option 1: Environment Variable (Recommended)

Set in your `.env` file or platform environment variables:

```env
ADMIN_CODE=YOUR10DIGITCODE
```

**Example:**
```env
ADMIN_CODE=ADMIN12345
```

### Option 2: Default Code

If not set, default code is: `ADMIN12345`

**⚠️ IMPORTANT**: Change this in production!

## Admin Panel Features

The admin panel (`/admin`) includes:

1. **Statistics Dashboard**
   - Total messages
   - Active users
   - Reported messages count
   - Messages today

2. **Message Management**
   - View all messages
   - Search messages by text or sender
   - Delete messages
   - Report messages

3. **Real-time Updates**
   - Live active user count
   - New messages appear automatically

## Security Notes

- Admin code is checked server-side
- Admin session stored in localStorage (client-side)
- No authentication required (public chat)
- Admin code should be kept secret
- Change default code in production

## Usage

1. **Access Admin Panel**:
   - Type admin code in chat
   - Click send
   - Auto-redirects to `/admin`

2. **Return to Chat**:
   - Click "Back to Chat" button in admin panel
   - Or navigate to `/`

3. **Admin Session**:
   - Stored in localStorage
   - Persists across page refreshes
   - Can be cleared by clearing browser data

## API Endpoints

### Admin Panel Access
- **Route**: `GET /admin`
- **Access**: Anyone (but code required to know about it)

### Delete Message
- **Route**: `DELETE /api/messages/:id`
- **Access**: Public (no auth, but only accessible from admin panel)

## Code Location

- **Backend Check**: `chat-backend/server.js` - `send_message` handler
- **Frontend Redirect**: `chat-backend/index.html` - `admin_access_granted` event
- **Admin Panel**: `chat-backend/admin.html`

## Default Admin Code

**Default**: `ADMIN12345`

**To Change**: Set `ADMIN_CODE` environment variable

## Example Usage

1. User types: `ADMIN12345` in chat input
2. Clicks "Send"
3. Server detects admin code
4. Sends `admin_access_granted` event
5. Frontend stores admin session
6. Redirects to `/admin`
7. User can now manage messages

---

**Remember**: Change the default admin code in production! 🔒

