import { Router } from 'express';
import {
  crearAlertaPanico,
  obtenerAlertaPanicoPorId,
  listarAlertasPanico,
  listarAlertasPorUsuario,
  atenderAlertaPanico,
  eliminarAlertaPanico,
  resumenAlertasPorTipo,   // ✅ Importado correctamente
  resumenAlertasPorMes,
  obtenerTodasAlertas, // ✅ Importado correctamente
} from '../controladores/alertaCtrl.js';

const router = Router();

// 📌 Rutas específicas primero
router.post('/panico', crearAlertaPanico);
router.get('/panico', listarAlertasPanico);
router.get('/usuario/:id_usuario', listarAlertasPorUsuario);

// 📊 Rutas para resumen
router.get('/resumen/tipo', resumenAlertasPorTipo);
router.get('/resumen/mes', resumenAlertasPorMes);

// 🧾 Rutas generales
router.get('/', listarAlertasPanico);
router.get('/:id_alerta', obtenerAlertaPanicoPorId);
router.put('/atender/:id_alerta', atenderAlertaPanico);
router.delete('/:id_alerta', eliminarAlertaPanico);

router.get('/todas', obtenerTodasAlertas);


export default router;
