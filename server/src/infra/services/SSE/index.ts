import { ApiError } from "@/core/http";
import { DomainEvent } from "@/modules/notifications/notification.interface";
import { Application, Response } from "express";

class SSE {

  private static app: Application = null
  private static response: Response = null

  static init(app: Application) {
    this.app = app
    this.app.get('/events', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      this.response = res;
    });
  }

  static verifyInitialized() {
    if (!this.app) throw new ApiError({
      statusCode: 500,
      code: "APP_NOT_INITIALIZE",
      message: "app is not initialized for SSE",
    })
    if (!this.response) throw new ApiError({
      statusCode: 500,
      code: "RESPONSE_NOT_FOUND",
      message: "response object not found in SSE"
    })
  }

  static close() {
    this.verifyInitialized()
    this.response.end()
    this.response = null
    this.app = null
  }

  // METHODS

  static notifyViaSSEHandler(receiverId: string, aggregationKey: string) {
    this.verifyInitialized();
    this.response.write(JSON.stringify({ receiverId, aggregationKey }));
  }
}

export default SSE