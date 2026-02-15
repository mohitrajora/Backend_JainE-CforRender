import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// Import routes
import blogRoutes from "./routes/blogRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Needed to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use("/blogs", blogRoutes);
app.use("/admin", authRoutes);
app.use("/api/contact", contactRoutes);

//  Middleware: verify any valid JWT (no role check)
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token not valid" });

        req.user = user; // store decoded user info
        next();
    });
}

//  Protect dashboard.html (only logged-in users can access)
app.get("/admin/dashboard", verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/admin/dashboard.html"));
});

//  Serve all other frontend files normally
app.use(express.static(path.join(__dirname, "frontend")));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
