import { Router } from "express";
import { verificarEstado, listarUsuarios } from "../controllers/statusController.js";

const router = Router();

// Endpoint para verificar el estado del sistema
router.get("/status", verificarEstado);

// Endpoint para listar usuarios
router.get("/usuarios", listarUsuarios);

export default router;
