import fs from "fs";
import { openai } from "../lib/openai.js";
import { addFileIdToSession } from "./session.service.js";

export async function uploadFile(sessionId: string, filePath: string, originalName: string) {
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });

  await addFileIdToSession(sessionId, file.id);

  // Clean up temp file
  fs.unlinkSync(filePath);

  return { fileId: file.id, fileName: originalName };
}
