import { conmysql } from '../db.js';

// Crear una nueva notificación
export const createNotificacion = async (req, res) => {
  const { id_alerta, tipo_notificacion, detalle, fecha_envio, user_id } = req.body;

  if (!id_alerta || !tipo_notificacion || !detalle || !fecha_envio || !user_id) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const [result] = await conmysql.execute(
      'INSERT INTO notificacion (id_alerta, tipo_notificacion, detalle, fecha_envio, id_usuario) VALUES (?, ?, ?, ?, ?)',
      [id_alerta, tipo_notificacion, detalle, fecha_envio, user_id]
    );

    return res.status(201).json({ message: 'Notificación creada correctamente', id: result.insertId });
  } catch (error) {
    console.error('❌ Error al crear la notificación:', error);
    return res.status(500).json({ message: 'Error al crear la notificación', error });
  }
};

// Obtener todas las notificaciones de un usuario
export const getNotificaciones = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await conmysql.execute(
      `SELECT id_notificacion, id_alerta, tipo_notificacion, detalle, fecha_envio, id_usuario, leida
       FROM notificacion
       WHERE id_usuario = ?
       ORDER BY fecha_envio DESC`,
      [userId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error al obtener las notificaciones:', error);
    return res.status(500).json({ message: 'Error al obtener las notificaciones', error });
  }
};

// Marcar una notificación como leída
export const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await conmysql.execute(
      'SELECT * FROM notificacion WHERE id_notificacion = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await conmysql.execute(
      'UPDATE notificacion SET leida = TRUE WHERE id_notificacion = ?',
      [id]
    );

    return res.status(200).json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('❌ Error al marcar la notificación como leída:', error);
    return res.status(500).json({ message: 'Error al marcar la notificación como leída', error });
  }
};

// Eliminar una notificación por su ID
export const deleteNotificacion = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await conmysql.execute(
      'DELETE FROM notificacion WHERE id_notificacion = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    return res.status(200).json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar la notificación:', error);
    return res.status(500).json({ message: 'Error al eliminar la notificación', error });
  }
};
