import { Router } from "express";
import {
  handleCreateSession,
  handleGetHistory,
  handleSendMessage,
  handleExpandNode,
  handleUploadFile,
} from "../controllers/session.controller.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/", handleCreateSession);
router.get("/:id/history", handleGetHistory);
router.post("/:id/message", handleSendMessage);
router.post("/:id/expand", handleExpandNode);
router.post("/:id/upload", upload.single("file"), handleUploadFile);

export default router;
