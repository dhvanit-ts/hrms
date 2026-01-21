import allowedOrigins from "./conf/allowedOrigins.js";
import http from "http";
import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";

import { SocketService } from "./services/socket.service.js";
import { Server } from "socket.io";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";
import userRouter from "./routes/user.routes.js";
import voteRouter from "./routes/vote.routes.js";
import collegeRouter from "./routes/college.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import manageRouter from "./routes/manage.route.js";
import bookmarkRouter from "./routes/bookmark.route.js";
import reportRouter from "./routes/report.routes.js";
import adminRouter from "./routes/admin.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import { verifyAdminJWT } from "./middleware/auth.middleware.js";
import { sessionMiddleware } from "./middleware/session.middleware.js";
import {
  apiLimiter,
  authLimiter,
  rateLimitMiddleware,
} from "./middleware/ratelimit.middleware.js";

const socketService = new SocketService();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socketService.listenSocket(socket);
});

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.set("trust proxy", true);

const commonPublicRoute = "/api/public/v1/";
const commonAdminRoute = "/api/admin/v1/";

// global middlewares
app.use(sessionMiddleware);

// public routes
app.use(
  `${commonPublicRoute}posts`,
  rateLimitMiddleware(apiLimiter),
  postRouter
);
app.use(
  `${commonPublicRoute}users`,
  rateLimitMiddleware(apiLimiter),
  userRouter
);
app.use(
  `${commonPublicRoute}votes`,
  rateLimitMiddleware(apiLimiter),
  voteRouter
);
app.use(
  `${commonPublicRoute}comments`,
  rateLimitMiddleware(apiLimiter),
  commentRouter
);
app.use(
  `${commonPublicRoute}reports`,
  rateLimitMiddleware(apiLimiter),
  reportRouter
);
app.use(
  `${commonPublicRoute}bookmarks`,
  rateLimitMiddleware(apiLimiter),
  bookmarkRouter
);
app.use(
  `${commonPublicRoute}feedback`,
  rateLimitMiddleware(apiLimiter),
  feedbackRouter
);
app.use(
  `${commonPublicRoute}notifications`,
  rateLimitMiddleware(apiLimiter),
  notificationRouter
);
app.get(`/health-check`, rateLimitMiddleware(authLimiter), (req, res) => {
  res.status(200).json({ message: "OK" });
});

// admin routes
app.use(
  `${commonAdminRoute}manage`,
  verifyAdminJWT,
  rateLimitMiddleware(apiLimiter),
  manageRouter
);
app.use(
  `${commonAdminRoute}colleges`,
  verifyAdminJWT,
  rateLimitMiddleware(apiLimiter),
  collegeRouter
);
app.use(
  `${commonAdminRoute}auth`,
  rateLimitMiddleware(authLimiter),
  adminRouter
);

export { app, server, io };
