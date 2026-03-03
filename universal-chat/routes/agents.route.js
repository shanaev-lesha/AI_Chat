import express from "express";
import { agentsController } from "../controllers/agents.controller.js";

const router = express.Router();

router.post("/", agentsController);

export default router;