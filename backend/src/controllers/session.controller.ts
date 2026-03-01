import type { Request, Response, NextFunction } from "express";
import { createSession, getSession, listSessions } from "../services/session.service.js";
import { generateMindMap, expandNode } from "../services/openai.service.js";
import { uploadFile } from "../services/upload.service.js";
import { ApiError } from "../utils/api-error.js";

function getParamId(req: Request): string {
  const id = req.params.id;
  if (Array.isArray(id)) throw new ApiError(400, "Invalid session ID");
  return id;
}

export async function handleListSessions(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessions = await listSessions();
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateSession(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await createSession();
    res.status(201).json({ sessionId: session.id, createdAt: session.createdAt });
  } catch (err) {
    next(err);
  }
}

export async function handleGetHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = getParamId(req);
    const session = await getSession(id);
    if (!session) {
      throw new ApiError(404, "Session not found");
    }
    res.json({
      sessionId: session.id,
      createdAt: session.createdAt,
      messages: session.messages,
      graphs: session.graphs,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      throw new ApiError(400, "Message content is required");
    }

    const id = getParamId(req);
    const session = await getSession(id);
    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    const graph = await generateMindMap(session.id, content);
    res.json(graph);
  } catch (err) {
    next(err);
  }
}

export async function handleExpandNode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { nodeId, nodeLabel } = req.body;
    if (!nodeId || !nodeLabel) {
      throw new ApiError(400, "nodeId and nodeLabel are required");
    }

    const id = getParamId(req);
    const session = await getSession(id);
    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    const graph = await expandNode(session.id, nodeId, nodeLabel);
    res.json(graph);
  } catch (err) {
    next(err);
  }
}

export async function handleUploadFile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file provided");
    }

    const id = getParamId(req);
    const session = await getSession(id);
    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    const result = await uploadFile(
      session.id,
      req.file.path,
      req.file.originalname,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
