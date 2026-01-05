import express from "express";
import {
    addBlog, getBlogs, deleteBlog, updateBlog, getSingleBlog, getBlogBySlug, generateSitemap,
    getRelatedBlogs
} from "../controller/blogController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/sitemap.xml", generateSitemap);
router.get("/", getBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id", getSingleBlog);
router.get("/related/:slug", getRelatedBlogs);

// Protected
router.post("/create-blog", verifyToken, addBlog);
router.put("/update-blog/:id", verifyToken, updateBlog);
router.delete("/delete-blog/:id", verifyToken, deleteBlog);

export default router;