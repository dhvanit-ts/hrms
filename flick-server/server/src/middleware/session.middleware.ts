import { Request, Response, NextFunction } from "express";

const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if the sessionId exists (maybe from cookie or header)
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'];

  // If no session ID, create a new one (could be based on a UUID or another strategy)
  if (!sessionId) {
    req.sessionId = generateSessionId();  // Example: generate a new session ID
  } else {
    req.sessionId = sessionId;
  }

  // Optionally, you can perform actions like:
  // - Check session validity
  // - Track session expiration
  // - Log session activity

  next(); // Pass control to the next middleware/route handler
};

// Utility function to generate session ID (you can customize this)
function generateSessionId(): string {
  return `session-${Math.random().toString(36).substring(2)}`;
}

export { sessionMiddleware };
