import { ApiError } from "@/core/http";
import { Application, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { loadEnv } from "@/config/env";

interface SSEClient {
  id: string;
  userId: string | number; // Support both string (admin) and number (employee) IDs
  userType: "user" | "employee";
  response: Response;
  lastPing: Date;
}

class SSE {
  private static app: Application = null;
  private static clients: Map<string, SSEClient> = new Map();

  static init(app: Application) {
    this.app = app;

    // SSE endpoint with authentication via query parameter or cookie
    this.app.get('/api/events', (req: Request, res: Response) => {
      const env = loadEnv();

      // Try to get token from query parameter first, then from Authorization header
      let token = req.query.token as string;
      if (!token) {
        const header = req.headers.authorization;
        if (header?.startsWith("Bearer ")) {
          token = header.slice("Bearer ".length);
        }
      }

      if (!token) {
        res.status(401).json({ error: "Authentication token required" });
        return;
      }

      let userId: string | number;
      let userType: "user" | "employee";

      try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;

        // Check if it's an admin token (has roles property)
        if (payload.roles) {
          userId = payload.sub as string; // Admin IDs are strings
          userType = "user";
        }
        // Check if it's an employee token (has employeeId property)
        else if (payload.employeeId) {
          userId = parseInt(payload.sub); // Employee IDs are numbers
          userType = "employee";
        } else {
          console.log('Invalid token payload:', payload);
          res.status(401).json({ error: "Invalid token format" });
          return;
        }
      } catch (error) {
        console.log('JWT verification failed:', error);

        // Provide specific error messages for different JWT errors
        if (error.name === 'TokenExpiredError') {
          res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
        } else if (error.name === 'JsonWebTokenError') {
          res.status(401).json({ error: "Invalid token", code: "INVALID_TOKEN" });
        } else {
          res.status(401).json({ error: "Token verification failed", code: "TOKEN_VERIFICATION_FAILED" });
        }
        return;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Create unique client ID
      const clientId = `${userType}_${userId}_${Date.now()}`;

      // Store client
      const client: SSEClient = {
        id: clientId,
        userId,
        userType,
        response: res,
        lastPing: new Date()
      };

      this.clients.set(clientId, client);

      console.log(`SSE client connected: ${clientId} (${userType} ${userId})`);

      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: 'connected', clientId, userId, userType })}\n\n`);

      // Handle client disconnect
      req.on('close', () => {
        this.clients.delete(clientId);
        console.log(`SSE client disconnected: ${clientId}`);
      });

      res.on('close', () => {
        this.clients.delete(clientId);
        console.log(`SSE client disconnected: ${clientId}`);
      });

      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        if (this.clients.has(clientId)) {
          try {
            res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
            client.lastPing = new Date();
          } catch (error) {
            clearInterval(pingInterval);
            this.clients.delete(clientId);
          }
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds
    });
  }

  static verifyInitialized() {
    if (!this.app) {
      throw new ApiError({
        statusCode: 500,
        code: "APP_NOT_INITIALIZE",
        message: "app is not initialized for SSE",
      });
    }
  }

  static getClientCount(): number {
    return this.clients.size;
  }

  static getClientsForUser(userId: string | number, userType: "user" | "employee"): SSEClient[] {
    return Array.from(this.clients.values()).filter(
      client => client.userId === userId && client.userType === userType
    );
  }

  // Send notification to specific user - support both string and number IDs
  static notifyUser(userId: string | number, userType: "user" | "employee", data: any) {
    const userClients = this.getClientsForUser(userId, userType);

    console.log(`Sending notification to ${userType} ${userId}, found ${userClients.length} clients`);

    userClients.forEach(client => {
      try {
        const message = `data: ${JSON.stringify({
          type: 'notification',
          ...data,
          timestamp: Date.now()
        })}\n\n`;

        client.response.write(message);
      } catch (error) {
        console.error('Failed to send SSE message:', error);
        // Remove dead client
        this.clients.delete(client.id);
      }
    });
  }

  // Broadcast to all clients
  static broadcast(data: any) {
    const message = `data: ${JSON.stringify({
      type: 'broadcast',
      ...data,
      timestamp: Date.now()
    })}\n\n`;

    this.clients.forEach((client, clientId) => {
      try {
        client.response.write(message);
      } catch (error) {
        this.clients.delete(clientId);
      }
    });
  }

  // Clean up dead connections
  static cleanup() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    this.clients.forEach((client, clientId) => {
      if (now.getTime() - client.lastPing.getTime() > timeout) {
        try {
          client.response.end();
        } catch (error) {
          // Ignore errors when closing dead connections
        }
        this.clients.delete(clientId);
      }
    });
  }

  static close() {
    this.clients.forEach((client, clientId) => {
      try {
        client.response.end();
      } catch (error) {
        // Ignore errors
      }
    });
    this.clients.clear();
    this.app = null;
  }

  // Legacy method for backward compatibility
  static notifyViaSSEHandler(receiverId: string, aggregationKey: string) {
    // Parse receiverId to extract user info
    const [userType, userId] = receiverId.split('_');
    if (userType && userId) {
      // Convert to appropriate type based on userType
      const parsedUserId = userType === 'user' ? userId : Number(userId);
      this.notifyUser(parsedUserId, userType as "user" | "employee", {
        aggregationKey,
        receiverId
      });
    }
  }
}

export default SSE;