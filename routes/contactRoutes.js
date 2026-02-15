import express from "express";
import {
    createContactMessage,
    getAllContactMessages,
} from "../controller/contactController.js";

import jwt from "jsonwebtoken";

const router = express.Router();

// JWT middleware (same logic as server.js)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token not valid" });
        req.user = user;
        next();
    });
};

// Public
router.post("/", createContactMessage);

// Admin (protected)
router.get("/admin", verifyToken, getAllContactMessages);

export default router;
