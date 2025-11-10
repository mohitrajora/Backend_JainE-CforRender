// controllers/blogController.js
import { db } from "../firebase.js";

const blogCollection = db.collection("blogs");

// Add a new blog
export const addBlog = async (req, res) => {
    try {
        const { title, category, content } = req.body;

        if (!title || !category || !content) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Create slug from title
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "") // remove special characters
            .replace(/\s+/g, "-") // spaces to hyphens
            .replace(/-+/g, "-"); // remove duplicate hyphens

        const newBlog = {
            title,
            category,
            content,
            slug,
            createdAt: new Date().toISOString(),
        };

        const docRef = await blogCollection.add(newBlog);
        res.status(201).json({ id: docRef.id, ...newBlog });

    } catch (error) {
        console.error("Error adding blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get a single blog
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
            ...blogSnapshot.data(),
        });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
// Get all blogs
export const getBlogs = async (req, res) => {
    try {
        const snapshot = await blogCollection.get();
        const blogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(blogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get blog by slug
export const getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const snapshot = await blogCollection.where("slug", "==", slug).get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const blogDoc = snapshot.docs[0];
        res.status(200).json({ id: blogDoc.id, ...blogDoc.data() });
    } catch (error) {
        console.error("Error fetching blog by slug:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete a blog
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

// Update a blog
export const updateBlog = async (req, res) => {
    try {
        const blogId = req.params.id;
        const { title, category, content } = req.body;

        const blogRef = blogCollection.doc(blogId);
        const blogSnapshot = await blogRef.get();

        if (!blogSnapshot.exists) {
            return res.status(404).json({ error: "Blog not found" });
        }

        await blogRef.update({
            title,
            category,
            content,
            updatedAt: new Date().toISOString(),
        });

        res.status(200).json({ message: "Blog updated successfully" });
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
