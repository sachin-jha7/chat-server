import "./env.js";
import http from "http";
import app from "./src/app.js";
import { connectToDB } from "./src/db/db.js";
import { initializeSocket } from "./src/socket/socket-init.js";

const server = http.createServer(app);

await connectToDB();

initializeSocket(server);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log("App is live at port:", PORT);
});
