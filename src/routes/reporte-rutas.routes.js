import { Router } from 'express';
import { getReporteRutas, guardarFotoRuta } from '../controladores/reporte-rutasCtrl.js';

const router = Router();

router.get('/:id', getReporteRutas); // ✅ Obtener reporte de rutas
router.post('/guardar-foto/:id', guardarFotoRuta); // 📸 Guardar foto de la ruta

export default router;
