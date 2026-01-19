import SSE from "@/infra/services/SSE";

function notifyViaSSE(receiverId: string, aggregationKey: string, notificationData?: any) {
  try {
    // Parse receiverId format: "user_123" or "employee_456"
    const [userType, userId] = receiverId.split('_');

    if (userType && userId && (userType === 'user' || userType === 'employee')) {
      // Admin user IDs are strings (UUIDs), employee IDs are numbers
      const parsedUserId = userType === 'user' ? userId : Number(userId);

      SSE.notifyUser(parsedUserId, userType, {
        aggregationKey,
        receiverId,
        ...notificationData
      });
    } else {
      // Fallback to legacy method
      SSE.notifyViaSSEHandler(receiverId, aggregationKey);
    }
  } catch (error) {
    console.error('Failed to send SSE notification:', error);
  }
}

export default notifyViaSSE;