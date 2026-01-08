import { Application } from "express";
import authRouter from "@/modules/auth/auth.route";
import userRouter from "@/modules/user/user.route";
import bookmarkRouter from "@/modules/bookmark/bookmark.route";
import collegeRouter from "@/modules/college/college.route";
import commentRouter from "@/modules/comment/comment.route";
import feedbackRouter from "@/modules/feedback/feedback.route";
import postRouter from "@/modules/post/post.route";
import reportRouter from "@/modules/report/report.routes";
import voteRouter from "@/modules/vote/vote.route";
import notificationRouter from "@/modules/notification/notification.routes";
import adminRouter from "@/modules/admin/admin.route";
import { registerHealthRoutes } from "./health.routes";

export const registerRoutes = (app: Application) => {
  app.use("/api/v1/posts", postRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/bookmarks", bookmarkRouter);
  app.use("/api/v1/colleges", collegeRouter);
  app.use("/api/v1/comments", commentRouter);
  app.use("/api/v1/feedbacks", feedbackRouter);
  app.use("/api/v1/reports", reportRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/votes", voteRouter);
  app.use("/api/v1/admin", adminRouter);

  registerHealthRoutes(app)
};
