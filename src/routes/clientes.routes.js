import { Router } from 'express';
import {getClientesByTrabajador, registrarConsumo, getClientes} from '../controladores/clientesCtrl.js'

const router = Router();

// Listar clientes según trabajador
router.get('/trabajadores/:tra_cedula/clientes', getClientesByTrabajador);

// Registrar consumo de un cliente
router.post('/clientes/:cli_cedula/consumo', registrarConsumo);

router.get('/clientes', getClientes);

export default router;
