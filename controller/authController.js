import {db} from "../firebase.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const usersCollection = db.collection("users");

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if email exists
        const snapshot = await usersCollection.where("email", "==", email).get();
        if (!snapshot.empty) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
        };

        const docRef = await usersCollection.add(newUser);

        res.status(201).json({ id: docRef.id, message: "User registered successfully" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// LOGIN
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user
        const snapshot = await usersCollection.where("email", "==", email).get();
        if (snapshot.empty) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = snapshot.docs[0].data();

        // Check password
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: snapshot.docs[0].id, email: userData.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
