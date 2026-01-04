// controllers/blogController.js
import { db } from "../firebase.js";

const blogCollection = db.collection("blogs");

// Add a new blog
export const addBlog = async (req, res) => {
    try {
        const { title, category, content, metaTitle, metaDescription } = req.body;

        if (!title || !category || !content) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // create slug safely (trim leading/trailing hyphens)
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");

        const newBlog = {
            title,
            category,
            content,
            slug,
            metaTitle: metaTitle || title, // default to title if not provided
            metaDescription: metaDescription || (content ? content.slice(0, 150) : ""),
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

// Update Blog
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
            title,
            category,
            content,
            updatedAt: new Date().toISOString(),
        };

        if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
        if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

        // If title changed, optionally update slug (you may want to avoid auto-changing slug for published posts)
        // updateData.slug = title ? createSlug(title) : currentSlug;

        await blogRef.update(updateData);
        res.status(200).json({ message: "Blog updated successfully" });
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.generateSitemap = async (req, res) => {
    try {
        // Get all blog slugs
        const blogs = await Blog.find({}, "slug updatedAt");

        // Convert blogs to XML
        const blogUrls = blogs.map(blog => `
      <url>
        <loc>https://jain-events-and-caterers.netlify.app/blog/${blog.slug}</loc>
        <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>
        <priority>0.85</priority>
      </url>
    `).join("");

        // Full sitemap
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>https://jain-events-and-caterers.netlify.app/</loc>
    <priority>1.00</priority>
  </url>

  <url>
    <loc>https://jain-events-and-caterers.netlify.app/about</loc>
    <priority>0.80</priority>
  </url>

  <url>
    <loc>https://jain-events-and-caterers.netlify.app/services</loc>
    <priority>0.90</priority>
  </url>

  <url>
    <loc>https://jain-events-and-caterers.netlify.app/blog</loc>
    <priority>0.85</priority>
  </url>

  ${blogUrls}

</urlset>`;

        // Send XML
        res.set("Content-Type", "application/xml");
        res.status(200).send(sitemap);

    } catch (error) {
        console.error("Sitemap Error:", error);
        res.status(500).send("Error generating sitemap");
    }
};