import express from "express";
import { createContactMessage } from "../controller/contactController.js";

const router = express.Router();

router.post("/", createContactMessage);

export default router;