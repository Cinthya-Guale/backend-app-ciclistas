import { Router } from 'express';
import { registrarContactosEmergencia, 
    modificarContactoEmergencia, getContactosEmergencia, enviarSMSContactosEmergencia, enviarCorreoContactosEmergencia
} from '../controladores/contactosEmergenciaCtrl.js'
import { obtenerTodosLosContactos } from '../controladores/contactosEmergenciaCtrl.js';

const router = Router();

router.post('/enviarCorreoContactosEmergencia/:id_usuario', enviarCorreoContactosEmergencia);
router.post('/sms-contactos-emergencia/:id_usuario', enviarSMSContactosEmergencia);
router.post('/modificarContactos', modificarContactoEmergencia);
router.post('/registrarContactos', registrarContactosEmergencia);
router.get('/contactosEmergencia/:id_usuario', getContactosEmergencia);
router.get('/todos', obtenerTodosLosContactos);




export default router;
