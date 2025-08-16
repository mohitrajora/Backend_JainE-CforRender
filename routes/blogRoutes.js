import express from "express";
import { addBlog, getBlogs, deleteBlog, updateBlog } from "../controller/blogController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/", getBlogs);

// Protected
router.post("/create-blog", verifyToken, addBlog);
router.put("/update-blog/:id", verifyToken, updateBlog);
router.delete("/delete-blog/:id", verifyToken, deleteBlog);

export default router;
