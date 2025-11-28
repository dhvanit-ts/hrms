import asyncHandler from "@/core/http/asyncHandler";
import { upload } from "@/core/middlewares/upload.middleware";
import { Request, Response, Router } from "express";

const router = Router();

const handleReq = asyncHandler(async (req: Request, res: Response) => {
  console.log("body", req.body);
  console.log("file", req.file);
  console.log("files", req.files);
  res.send("Try route working");
});

router.post("/", upload.single("file-name"), handleReq);

export default router;
