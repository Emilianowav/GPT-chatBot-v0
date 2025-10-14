import { Router } from "express";
import { verificarEstado, listarUsuarios } from "../controllers/statusController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Endpoint para verificar el estado del sistema (público)
router.get("/status", verificarEstado);

// Endpoint para listar usuarios (protegido - requiere autenticación)
router.get("/usuarios", authenticate, listarUsuarios);

export default router;
