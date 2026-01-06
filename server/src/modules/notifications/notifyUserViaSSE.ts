import SSE from "@/infra/services/SSE";

function notifyViaSSE(receiverId: string, aggregationKey: string, notificationData?: any) {
  try {
    // Parse receiverId format: "user_123" or "employee_456"
    const [userType, userId] = receiverId.split('_');

    if (userType && userId && (userType === 'user' || userType === 'employee')) {
      SSE.notifyUser(Number(userId), userType, {
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