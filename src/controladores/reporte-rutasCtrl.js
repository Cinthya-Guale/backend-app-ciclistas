import { conmysql } from '../db.js';

// 🔹 Función para obtener el reporte de rutas
export const getReporteRutas = async (req, res) => {
  try {
    const { id } = req.params;

    const [rutas] = await conmysql.query(
      `SELECT 
         id_ruta,
         tipo_ruta,
         DATE_FORMAT(fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fecha_inicio,
         DATE_FORMAT(fecha_fin, '%Y-%m-%d %H:%i:%s') AS fecha_fin,
         confirmada,
         distancia_total_km,
         velocidad_promedio_kmh,
         clima,
         foto
       FROM ruta
       WHERE id_usuario = ?
       ORDER BY fecha_inicio DESC`,
      [id]
    );

    const rutasConDuracion = rutas.map(ruta => {
      let duracion_minutos = null;

      if (ruta.fecha_inicio && ruta.fecha_fin) {
        const inicio = new Date(ruta.fecha_inicio);
        const fin = new Date(ruta.fecha_fin);
        duracion_minutos = Math.round((fin - inicio) / 60000);
      }

      return {
        ...ruta,
        duracion_minutos
      };
    });

    res.json({ rutas: rutasConDuracion });

  } catch (error) {
    console.error("❌ Error al obtener reporte de rutas:", error);
    res.status(500).json({ mensaje: "Error al generar el reporte", error: error.message });
  }
};

// 🔹 Función para guardar foto de la ruta
export const guardarFotoRuta = async (req, res) => {
  const { id } = req.params;
  const { foto } = req.body;

  try {
    // ⚡ Guardar la foto en la columna "foto"
    await pool.query('UPDATE rutas SET foto = ? WHERE id_ruta = ?', [foto, id]);

    res.json({ mensaje: '✅ Foto guardada correctamente', id_ruta: id });
  } catch (error) {
    console.error('❌ Error al guardar foto:', error);
    res.status(500).json({ error: 'Error al guardar la foto' });
  }
};
