import { Router } from 'express';
import { login, registrarUsuario, activarCuenta, solicitarRecuperacion, restablecerClave } from '../controladores/usuariosCtrl.js';

const router = Router();

router.post('/login', login);
router.post('/registrar', registrarUsuario);
router.get('/activar-cuenta/:token', activarCuenta);
router.post('/solicitar-recuperacion', solicitarRecuperacion);
router.post('/restablecer-clave/:token', restablecerClave);

export default router;

