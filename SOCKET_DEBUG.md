# Socket.IO Connection Debugging Guide

## 🔍 Quick Debugging Steps

### 1. Check Server Startup
When you start the server (`npm run -w server dev`), you should see these logs:
```
✅ Setting up Socket.IO server
✅ Initializing notification system with Socket.IO  
✅ Socket.IO setup complete
✅ Server listening on http://localhost:4000
```

### 2. Check Frontend Connection Attempt
Open browser dev tools → Console. When you login, you should see:
```
✅ Attempting to connect to Socket.IO { userId: X, userType: "employee", hasToken: true }
✅ Connecting to: http://localhost:4000
```

### 3. Check Connection Success
If successful, you'll see:
```
Frontend: ✅ Connected to notification socket { socketId: "abc123", userId: X, userType: "employee" }
Backend:  ✅ Socket authenticated successfully { userId: X, userType: "employee" }
Backend:  ✅ User connected to notifications { userId: X, userType: "employee", socketId: "abc123", roomName: "employee:X" }
```

## ❌ Common Issues & Solutions

### Issue 1: "connect_error" in Frontend Console
**Symptoms**: `❌ Socket connection error: Error: xhr poll error`

**Solutions**:
1. **Check server is running**: Visit `http://localhost:4000/healthz` - should return `{"status":"ok"}`
2. **Check port**: Server runs on port 4000, not 5000
3. **Check CORS**: Make sure `CORS_ORIGINS=http://localhost:3000` in server `.env`

### Issue 2: "Authentication required" Error
**Symptoms**: `❌ Socket connection error: Error: Authentication required`

**Solutions**:
1. **Check login**: Make sure you're logged in (admin or employee)
2. **Check token**: Look for `hasToken: true` in connection logs
3. **Check auth context**: Verify `useAuth()` returns valid user/employee data

### Issue 3: Connection Succeeds but No Notifications
**Symptoms**: Socket connects but no notifications appear when creating leave requests

**Solutions**:
1. **Check notification system initialization**: Look for "Initializing notification system" in server logs
2. **Check event publishing**: Look for "Publishing event" logs when creating leave requests
3. **Check notification processing**: Look for "Processed notification event" logs

### Issue 4: Frontend Shows Wrong Port
**Symptoms**: Frontend tries to connect to `localhost:5000` instead of `localhost:4000`

**Solution**: Already fixed - frontend now uses port 4000

## 🛠️ Manual Testing

### Test 1: Basic Connection
1. Start server: `npm run -w server dev`
2. Start client: `npm run -w client dev`  
3. Login as employee at `http://localhost:3000/login`
4. Check console for connection logs

### Test 2: Notification Flow
1. Open two browser windows:
   - Employee: `http://localhost:3000/login`
   - Admin: `http://localhost:3000/admin/login`
2. Employee: Create a leave request
3. Admin: Check notification bell for new notification
4. Admin: Approve the leave request  
5. Employee: Check notification bell for approval notification

## 🔧 Advanced Debugging

### Check Network Tab
1. Open Dev Tools → Network tab
2. Filter by "WS" (WebSocket)
3. Should see connection to `localhost:4000` with status "101 Switching Protocols"

### Check Server Logs
Look for these specific log messages:
- `Setting up Socket.IO server`
- `Socket authenticated successfully`
- `User connected to notifications`
- `Publishing event`
- `Processed notification event`

### Check Database
```sql
-- Check if events are being stored
SELECT * FROM events ORDER BY createdAt DESC LIMIT 5;

-- Check if notifications are being created  
SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 5;
```

## 🚨 Emergency Fallback

If Socket.IO continues to fail, the notification system will still work via:
1. **HTTP polling**: Notifications will appear when you refresh the page
2. **API endpoints**: You can manually call `/api/notifications` to get notifications
3. **Email notifications**: Leave approvals/rejections will still send emails

The system is designed to degrade gracefully if real-time features fail.

## 📞 Getting Help

If you're still having issues, please share:
1. **Server startup logs** (first 10 lines after starting server)
2. **Browser console logs** (when attempting to connect)
3. **Network tab screenshot** (showing WebSocket connection attempt)
4. **Your current auth state** (admin or employee, user ID)

This will help identify the exact issue quickly!