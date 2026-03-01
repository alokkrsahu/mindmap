import express from "express";
import cors from "cors";
import sessionRouter from "./routes/session.router.js";
import { handleListSessions } from "./controllers/session.controller.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/sessions", handleListSessions);
app.use("/api/session", sessionRouter);

app.use(errorHandler);

export default app;
