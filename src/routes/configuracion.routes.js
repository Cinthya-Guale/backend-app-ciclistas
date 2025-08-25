import { Router } from 'express';
import {
  getConfiguracionesPorUsuario,
  actualizarConfiguracion,
  actualizarConfiguracionUsuario
} from '../controladores/configuracionCtrl.js';

const router = Router();

// GET: Todas las configuraciones de un usuario
router.get('/:id_usuario', getConfiguracionesPorUsuario);

// PUT: Actualizar UNA clave específica
router.put('/:id_usuario/:clave', actualizarConfiguracion);

// PUT: Actualizar TODAS las configuraciones de un usuario
router.put('/:id_usuario', actualizarConfiguracionUsuario);

export default router;
