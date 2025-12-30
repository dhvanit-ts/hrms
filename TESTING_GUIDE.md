# Notification System Testing Guide

## 🚀 Quick Start

1. **Start the database**:
   ```bash
   npm run -w server db:up
   ```

2. **Start both servers**:
   ```bash
   npm run dev
   ```

3. **Open two browser windows**:
   - Admin: `http://localhost:3000/admin/login`
   - Employee: `http://localhost:3000/login`

## 📋 Test Scenarios

### Scenario 1: Leave Request Notification
1. **Employee Side**:
   - Login as an employee
   - Navigate to Leaves section
   - Create a new leave request
   - ✅ **Expected**: Request submitted successfully

2. **Admin Side**:
   - Login as admin/manager
   - Check notification bell (should show red badge)
   - Click notification bell
   - ✅ **Expected**: See "Employee requested leave" notification

3. **Real-time Test**:
   - Keep both windows open
   - Submit leave request from employee
   - ✅ **Expected**: Admin sees notification appear instantly

### Scenario 2: Leave Approval Notification
1. **Admin Side**:
   - Go to Leaves → Pending Leaves
   - Approve a leave request
   - ✅ **Expected**: Leave approved successfully

2. **Employee Side**:
   - Check notification bell
   - ✅ **Expected**: See "Your leave request has been approved" notification

### Scenario 3: Employee Creation Notification
1. **Admin Side**:
   - Go to Employees section
   - Create a new employee
   - ✅ **Expected**: Employee created successfully

2. **Manager/Admin Side**:
   - Check notifications
   - ✅ **Expected**: See "New employee [Name] has been added" notification

### Scenario 4: Notification Bundling
1. **Create multiple similar events**:
   - Submit 3 leave requests quickly (within 1 hour)
   - ✅ **Expected**: Single notification showing "3 new leave requests submitted"

2. **Check actor bundling**:
   - Have different employees submit requests
   - ✅ **Expected**: Notification shows multiple actor names

### Scenario 5: Browser Notifications
1. **Enable browser notifications** when prompted
2. **Submit a leave request**
3. **Switch to another tab**
4. ✅ **Expected**: Browser notification appears with sound/popup

## 🔍 What to Look For

### ✅ Success Indicators
- **Red badge** on notification bell with unread count
- **Real-time updates** without page refresh
- **Proper message formatting** (e.g., "John requested leave")
- **State transitions**: unread → delivered → seen
- **Bundled notifications** for similar events
- **Browser notifications** when tab is not active

### ❌ Potential Issues
- **No notifications appearing**: Check console for Socket.IO connection errors
- **Wrong user receiving notifications**: Check notification rules in `notification.rules.ts`
- **Notifications not marking as read**: Check API endpoints
- **Socket connection failing**: Check server logs for authentication issues

## 🛠️ Debugging

### Check Socket.IO Connection
1. Open browser dev tools → Network tab
2. Look for WebSocket connection to `localhost:5000`
3. Should see "Connected to notification socket" in console

### Check Database
1. Connect to MySQL: `mysql -u root -p -h localhost -P 3306`
2. Use database: `USE hrms-client;`
3. Check events: `SELECT * FROM events ORDER BY createdAt DESC LIMIT 10;`
4. Check notifications: `SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 10;`

### Check Server Logs
- Look for "Publishing event" and "Processed notification event" messages
- Check for any error messages in notification processing

### Check API Endpoints
- GET `/api/notifications` - Should return notifications list
- POST `/api/notifications/mark-seen` - Should mark notifications as seen
- GET `/api/notifications/unread-count` - Should return unread count

## 🎯 Advanced Testing

### Test Different User Roles
1. **Admin**: Should see all employee-related notifications
2. **Manager**: Should see notifications for their department
3. **Employee**: Should see their own leave status notifications

### Test Notification States
1. **Unread**: New notifications (red badge)
2. **Delivered**: Opened notification dropdown (badge remains)
3. **Seen**: Clicked "Mark as read" or individual notification (badge clears)

### Test Error Scenarios
1. **Server restart**: Notifications should persist in database
2. **Network disconnect**: Should reconnect automatically
3. **Invalid tokens**: Should handle gracefully

## 📊 Performance Testing

### Load Testing
1. Create 50+ leave requests rapidly
2. Check notification bundling works correctly
3. Verify UI remains responsive

### Memory Testing
1. Leave browser open for extended period
2. Create many notifications
3. Check for memory leaks in dev tools

## 🔧 Configuration

### Environment Variables
- `VITE_API_URL`: Frontend API URL (default: http://localhost:5000)
- `CORS_ORIGINS`: Backend CORS origins (default: http://localhost:3000)

### Notification Rules
Edit `server/src/modules/notification/notification.rules.ts` to:
- Add new event types
- Change receiver resolution logic
- Adjust aggregation windows
- Modify notification messages

## 🎉 Success Criteria

The notification system is working correctly if:
- ✅ Real-time notifications appear instantly
- ✅ Proper user targeting (managers get employee notifications)
- ✅ Notification bundling reduces spam
- ✅ State management works (unread counts, mark as seen)
- ✅ Browser notifications work when tab is inactive
- ✅ System recovers gracefully from failures
- ✅ Database persistence ensures no lost notifications

## 🚀 Next Steps

Once basic functionality is confirmed:
1. **Add more event types** (payroll, attendance, etc.)
2. **Implement email notifications** for offline users
3. **Add notification preferences** per user
4. **Create notification history page**
5. **Add push notifications** for mobile apps