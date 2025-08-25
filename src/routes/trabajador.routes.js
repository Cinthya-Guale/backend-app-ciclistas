import { Router } from 'express';
import { getTrabajadores } from '../controladores/trabajadorCtrl.js';

const router = Router();

// Listar todos los trabajadores
router.get('/trabajadores', getTrabajadores);

export default router;

