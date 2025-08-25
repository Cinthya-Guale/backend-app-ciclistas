import { conmysql } from '../db.js';

/**
 * Crear alerta de pánico desde la app del ciclista
 */
export const crearAlertaPanico = async (req, res) => {
  try {
    const {
      id_usuario,
      id_ruta,
      tipo,
      severidad,
      mensaje,
      fuente,
      direccion,
      latitud,
      longitud
    } = req.body;

    if (!id_usuario || !tipo || latitud == null || longitud == null) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    await conmysql.query(
      `INSERT INTO alerta_panico (
        id_usuario, id_ruta, tipo, severidad, mensaje,
        fuente, direccion, latitud, longitud, fecha_alerta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id_usuario,
        id_ruta || null,
        tipo,
        severidad || null,
        mensaje || null,
        fuente || null,
        direccion || null,
        latitud,
        longitud
      ]
    );

    res.status(201).json({ mensaje: "Alerta de pánico registrada correctamente" });
  } catch (error) {
    console.error("❌ Error al registrar alerta de pánico:", error);
    res.status(500).json({ mensaje: "Error al registrar alerta de pánico" });
  }
};

export const listarAlertasPanico = async (req, res) => {
  try {
    const { id_usuario } = req.query;

    const query = id_usuario
      ? 'SELECT * FROM alerta_panico WHERE id_usuario = ? ORDER BY fecha_alerta DESC'
      : 'SELECT * FROM alerta_panico ORDER BY fecha_alerta DESC';

    const valores = id_usuario ? [id_usuario] : [];

    const [alertas] = await conmysql.query(query, valores);
    res.json(alertas);
  } catch (error) {
    console.error("❌ Error al obtener alertas de pánico:", error);
    res.status(500).json({ mensaje: "Error al obtener alertas de pánico" });
  }
};

export const atenderAlertaPanico = async (req, res) => {
  try {
    const { id_alerta } = req.params;
    const { id_admin } = req.body;

    if (!id_alerta || !id_admin) {
      return res.status(400).json({ mensaje: "Faltan datos para atender la alerta" });
    }

    await conmysql.query(
      `UPDATE alerta
       SET atendida = 1, atendida_por = ?, fecha_atendida = NOW()
       WHERE id_alerta = ?`,
      [id_admin, id_alerta]
    );

    res.json({ mensaje: "Alerta atendida correctamente" });
  } catch (error) {
    console.error("❌ Error al atender alerta:", error);
    res.status(500).json({ mensaje: "Error al marcar alerta como atendida" });
  }
};

export const eliminarAlertaPanico = async (req, res) => {
  try {
    const { id_alerta } = req.params;

    const [resultado] = await conmysql.query(
      `DELETE FROM alerta_panico WHERE id_alerta = ?`,
      [id_alerta]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Alerta de pánico no encontrada o ya eliminada' });
    }

    res.json({ mensaje: "Alerta de pánico eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar alerta de pánico:", error);
    res.status(500).json({ mensaje: "Error al eliminar alerta de pánico" });
  }
};

export const obtenerAlertaPanicoPorId = async (req, res) => {
  try {
    const { id_alerta } = req.params;

    const [resultado] = await conmysql.query(
      `SELECT * FROM alerta_panico WHERE id_alerta = ?`,
      [id_alerta]
    );

    if (resultado.length === 0) {
      return res.status(404).json({ mensaje: 'Alerta de pánico no encontrada' });
    }

    res.json(resultado[0]);
  } catch (error) {
    console.error("❌ Error al obtener alerta de pánico:", error);
    res.status(500).json({ mensaje: "Error al obtener alerta de pánico" });
  }
};

export const listarAlertasPorUsuario = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const [resultado] = await conmysql.query(
      'SELECT * FROM alerta_panico WHERE id_usuario = ? ORDER BY fecha_alerta DESC',
      [id_usuario]
    );
    res.json(resultado);
  } catch (error) {
    console.error('Error al listar alertas por usuario:', error);
    res.status(500).json({ message: 'Error al obtener alertas del usuario' });
  }
};

// ✅ Agrupar alertas por tipo
export const resumenAlertasPorTipo = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT tipo, COUNT(*) AS total FROM alerta_panico GROUP BY tipo`
    );
    res.json(result);
  } catch (error) {
    console.error("Error en resumen por tipo:", error);
    res.status(500).json({ mensaje: 'Error al obtener resumen por tipo' });
  }
};

// ✅ Agrupar alertas por mes
export const resumenAlertasPorMes = async (req, res) => {
  try {
    const [result] = await conmysql.query(
      `SELECT 
        MONTHNAME(fecha_alerta) AS mes,
        YEAR(fecha_alerta) AS anio,
        COUNT(*) AS total 
      FROM alerta_panico 
      GROUP BY anio, mes
      ORDER BY anio DESC, MONTH(fecha_alerta) DESC`
    );
    res.json(result);
  } catch (error) {
    console.error("Error en resumen por mes:", error);
    res.status(500).json({ mensaje: 'Error al obtener resumen por mes' });
  }
};

export const obtenerTodasAlertas = async (req, res) => {
  try {
    const [resultado] = await conmysql.query(
      'SELECT * FROM alerta_panico ORDER BY fecha_alerta DESC'
    );
    res.json(resultado);
  } catch (error) {
    console.error("❌ Error al obtener todas las alertas:", error);
    res.status(500).json({ mensaje: 'Error al obtener alertas' });
  }
};