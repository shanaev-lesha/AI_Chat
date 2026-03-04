import express from "express";
import { voiceController } from "../controllers/voice.controller.js";

const router = express.Router();

router.post("/", voiceController);

export default router;