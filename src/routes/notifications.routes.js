import { Router } from 'express';
import { createNotificacion, getNotificaciones, markAsRead, deleteNotificacion } from '../controladores/notificationsCtrl.js';

const router = Router();

router.put('/read/:id', markAsRead);

// Ruta para crear una nueva notificación
router.post('/', createNotificacion);

// Ruta para obtener todas las notificaciones de un usuario
router.get('/:userId', getNotificaciones);

// Ruta para eliminar una notificación por ID
router.delete('/:id', deleteNotificacion);

export default router;
