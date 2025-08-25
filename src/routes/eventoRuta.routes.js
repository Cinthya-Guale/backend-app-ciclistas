import { Router } from 'express';
import { registrarEventoRuta, listarEventosRuta  } from '../controladores/eventoRutaCtrl.js';


const router = Router();

// Registrar evento de sincronización
router.post('/', registrarEventoRuta);
router.get('/', listarEventosRuta);


export default router;
