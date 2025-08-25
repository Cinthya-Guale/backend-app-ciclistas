import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas
import clientesRoutes from './routes/clientes.routes.js';
import trabajadorRoutes from './routes/trabajador.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import contactosEmergenciaRoutes from './routes/contactosEmergencia.routes.js';
import reporteRutasRoutes from './routes/reporte-rutas.routes.js';
import alertaRoutes from './routes/alerta.routes.js';
import eventoRutaRoutes from './routes/eventoRuta.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';




// Definir módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/clientes', clientesRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/auth', usuariosRoutes);
app.use('/api/cyclist', contactosEmergenciaRoutes);
app.use('/api/cyclist/reporte-rutas', reporteRutasRoutes);
app.use('/api/alerta-panico', alertaRoutes); 
app.use('/api/evento-ruta', eventoRutaRoutes);
app.use('/api/contactos-emergencia', contactosEmergenciaRoutes); 
app.use('/api/notificaciones', notificationsRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Fallback si no coincide ninguna ruta
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

export default app;
