import { Router } from "express";
import { generarRespuesta } from "../controllers/openaiController.js";

const router = Router();

router.post("/chat", generarRespuesta);

export default router;
