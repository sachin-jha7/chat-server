import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth-routes.js";
import indexRoute from "./routes/index-route.js";
import searchRoute from "./routes/search-route.js";
import messageRoute from "./routes/message-route.js";
import picUploadRoute from "./routes/pic-upload-route.js";

const app = express();
app.use(cors({
    origin: "https://chat-server-five-jet.vercel.app",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use("/", indexRoute);
app.use("/api/auth", authRoutes);
app.use("/api/chat/search", searchRoute);
app.use("/api/chat/message", messageRoute);
app.use("/api/chat/upload", picUploadRoute);


export default app;