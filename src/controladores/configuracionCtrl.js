// src/controladores/configuracionCtrl.js
import { conmysql } from '../db.js';

export const getConfiguracionesPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const [configuraciones] = await conmysql.query(
      'SELECT clave, valor FROM configuracion WHERE id_usuario = ?',
      [id_usuario]
    );

    // Convertir a objeto clave: valor
    const resultado = {};
    configuraciones.forEach(cfg => {
      resultado[cfg.clave] = cfg.valor;
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener configuraciones' });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  try {
    const { id_usuario, clave } = req.params;
    const { valor } = req.body;

    const [existe] = await conmysql.query(
      'SELECT * FROM configuracion WHERE id_usuario = ? AND clave = ?',
      [id_usuario, clave]
    );

    if (existe.length > 0) {
      // Actualizar
      await conmysql.query(
        'UPDATE configuracion SET valor = ? WHERE id_usuario = ? AND clave = ?',
        [valor, id_usuario, clave]
      );
    } else {
      // Insertar nueva
      await conmysql.query(
        'INSERT INTO configuracion (id_usuario, clave, valor) VALUES (?, ?, ?)',
        [id_usuario, clave, valor]
      );
    }

    res.json({ mensaje: 'Configuración actualizada' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ mensaje: 'Error al actualizar configuración' });
  }
};

// configuracionCtrl.js
export const actualizarConfiguracionUsuario = async (req, res) => {
  const { id_usuario } = req.params;
  const configuraciones = req.body;

  try {
    for (const clave in configuraciones) {
      const valor = configuraciones[clave];

      await conmysql.query(
        `INSERT INTO configuracion (id_usuario, clave, valor)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [id_usuario, clave, valor]
      );
    }

    res.json({ mensaje: 'Preferencias actualizadas correctamente' });
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    res.status(500).json({ mensaje: 'Error al actualizar configuraciones' });
  }
};
