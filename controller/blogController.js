// controllers/blogController.js

import { db } from "../firebase.js";
import sanitizeHtml from "sanitize-html";

const blogCollection = db.collection("blogs");

// ADD BLOG
 
export const addBlog = async (req, res) => {
    try {
        const { title, category, content, metaTitle, metaDescription } = req.body;

        if (!title || !category || !content) {
            return res.status(400).json({ error: "All fields are required" });
        }

        //   CLEAN HTML BUT KEEP FORMATTING
        const cleanHTML = sanitizeHtml(content, {

            allowedTags: [
                "h1", "h2", "h3", "h4", "h5", "h6",
                "p", "br",
                "strong", "b", "em", "i", "u",
                "ul", "ol", "li",
                "a"
            ],

            allowedAttributes: {
                a: ["href", "target", "rel"]
            },

            allowedSchemes: ["http", "https"]

        });

        //    SLUG GENERATOR (SEO SAFE)
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");

        //    CLEAN TEXT FOR META DESCRIPTION
        const plainText = sanitizeHtml(cleanHTML, {
            allowedTags: [],
            allowedAttributes: {}
        });

        const newBlog = {
            title,
            category,
            content: cleanHTML, // STORE RAW HTML
            slug,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || plainText.slice(0, 160),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await blogCollection.add(newBlog);

        res.status(201).json({
            id: docRef.id,
            ...newBlog
        });

    } catch (error) {
        console.error("Error adding blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// GET SINGLE BLOG (NO ESCAPING)

export const getSingleBlog = async (req, res) => {
    try {
        const blogId = req.params.id;

        const blogRef = blogCollection.doc(blogId);
        const blogSnapshot = await blogRef.get();

        if (!blogSnapshot.exists) {
            return res.status(404).json({ error: "Blog not found" });
        }

        res.status(200).json({
            id: blogSnapshot.id,
            ...blogSnapshot.data()
        });

    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// GET ALL BLOGS

export const getBlogs = async (req, res) => {
    try {
        const snapshot = await blogCollection
            .orderBy("createdAt", "desc")
            .get();

        const blogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(blogs);

    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// GET BLOG BY SLUG (NO ESCAPING)

export const getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const snapshot = await blogCollection
            .where("slug", "==", slug)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const blogDoc = snapshot.docs[0];

        res.status(200).json({
            id: blogDoc.id,
            ...blogDoc.data()
        });

    } catch (error) {
        console.error("Error fetching blog by slug:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// DELETE BLOG

export const deleteBlog = async (req, res) => {
    try {
        const blogId = req.params.id;

        await blogCollection.doc(blogId).delete();

        res.status(200).json({ message: "Blog deleted successfully" });

    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// UPDATE BLOG

export const updateBlog = async (req, res) => {
    try {
        const blogId = req.params.id;
        const { title, category, content, metaTitle, metaDescription } = req.body;

        const blogRef = blogCollection.doc(blogId);
        const blogSnapshot = await blogRef.get();

        if (!blogSnapshot.exists) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (title) updateData.title = title;
        if (category) updateData.category = category;

        if (content) {

            const cleanHTML = sanitizeHtml(content, {

                allowedTags: [
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "p", "br",
                    "strong", "b", "em", "i", "u",
                    "ul", "ol", "li",
                    "a"
                ],

                allowedAttributes: {
                    a: ["href", "target", "rel"]
                },

                allowedSchemes: ["http", "https"]
            });

            updateData.content = cleanHTML;
        }

        if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
        if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

        await blogRef.update(updateData);

        res.status(200).json({ message: "Blog updated successfully" });

    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// RELATED BLOGS

export const getRelatedBlogs = async (req, res) => {
    try {
        const { slug } = req.params;

        const currentSnapshot = await blogCollection
            .where("slug", "==", slug)
            .limit(1)
            .get();

        if (currentSnapshot.empty) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const currentDoc = currentSnapshot.docs[0];
        const currentBlog = { id: currentDoc.id, ...currentDoc.data() };

        const categorySnapshot = await blogCollection
            .where("category", "==", currentBlog.category)
            .get();

        let relatedBlogs = categorySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(blog => blog.slug !== slug);

        if (relatedBlogs.length < 3) {

            const latestSnapshot = await blogCollection
                .orderBy("createdAt", "desc")
                .limit(5)
                .get();

            const latestBlogs = latestSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(blog => blog.slug !== slug);

            const merged = [...relatedBlogs, ...latestBlogs];

            relatedBlogs = Array.from(
                new Map(merged.map(blog => [blog.slug, blog])).values()
            );
        }

        res.status(200).json(relatedBlogs.slice(0, 3));

    } catch (error) {
        console.error("Related blogs error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
