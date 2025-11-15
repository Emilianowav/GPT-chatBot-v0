// 🤖 Rutas de Chatbots
import { Router } from 'express';
import {
  getChatbots,
  getChatbotById,
  createChatbot,
  updateChatbot,
  deleteChatbot,
  updateEstadisticas
} from '../controllers/chatbotController.js';

const router = Router();

// Obtener todos los chatbots (con filtros)
router.get('/', getChatbots);

// Obtener un chatbot por ID
router.get('/:id', getChatbotById);

// Crear un nuevo chatbot
router.post('/', createChatbot);

// Actualizar un chatbot
router.put('/:id', updateChatbot);

// Eliminar un chatbot
router.delete('/:id', deleteChatbot);

// Actualizar estadísticas
router.patch('/:id/estadisticas', updateEstadisticas);

export default router;
