import { conmysql } from '../db.js';
import { sendEmergencySMS } from '../services/twilioService.js';
import { sendEmail } from '../services/emailService.js';

export const enviarCorreoContactosEmergencia = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { latitud, longitud, mensaje } = req.body;

    // 🔍 Consulta datos del usuario (nombre)
    const [usuarioDatos] = await conmysql.query(
      `SELECT p.nombres, p.apellidos
       FROM persona p
       INNER JOIN usuario u ON p.identificacion = u.identificacion
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );

    if (!usuarioDatos.length) {
      return res.status(404).json({ message: 'No se encontró el usuario en la base de datos.' });
    }

    const nombreCiclista = `${usuarioDatos[0].nombres} ${usuarioDatos[0].apellidos}`;

    // 🔍 Consulta contactos
    const [contactos] = await conmysql.query(
      `SELECT nombre_contacto, correo FROM contacto_emergencia WHERE id_usuario = ? AND correo IS NOT NULL`,
      [id_usuario]
    );

    if (!contactos.length) {
      return res.status(404).json({ message: 'No se encontraron contactos de emergencia con correo.' });
    }

    const linkMapa = `https://maps.google.com/?q=${latitud},${longitud}`;
    const cuerpoMensaje = mensaje || 
      `🚨 El ciclista <strong>${nombreCiclista}</strong> ha activado una alerta de emergencia.<br>
      📍 <strong>Ubicación:</strong> <a href="${linkMapa}" target="_blank">${linkMapa}</a>`;

    const subject = `🚨 Alerta de Emergencia de ${nombreCiclista} (Ciclista Seguro)`;
    const resultados = [];

    for (const contacto of contactos) {
      const { correo, nombre_contacto } = contacto;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #d32f2f;">🚨 Alerta de Emergencia</h2>
          <p>Hola <strong>${nombre_contacto}</strong>,</p>
          <p>Se ha activado una alerta de emergencia por parte del ciclista <strong style="color: #1976d2;">${nombreCiclista}</strong>.</p>
          <p><strong>Detalles:</strong></p>
          <ul>
            <li><strong>Mensaje:</strong> ${mensaje || 'Sin mensaje personalizado'}</li>
            <li><strong>Ubicación:</strong> <a href="${linkMapa}" target="_blank">${linkMapa}</a></li>
          </ul>
          <p style="margin-top: 20px;">Por favor, revisa de inmediato la situación.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #555;">Este correo ha sido enviado automáticamente desde la plataforma <strong>Ciclista Seguro</strong>.</p>
        </div>
      `;

      try {
        await sendEmail(
          correo,
          subject,
          htmlContent,
          []  // Adjuntos opcionales
        );
        resultados.push({ nombre_contacto, correo, status: 'ENVIADO' });
      } catch (err) {
        resultados.push({ nombre_contacto, correo, status: 'FALLÓ', error: err.message });
      }
    }

    res.json({
      message: 'Correos enviados (o intentados) a todos los contactos de emergencia.',
      total: contactos.length,
      resultados
    });

  } catch (error) {
    console.error('Error al enviar correos:', error);
    res.status(500).json({ message: 'Error al enviar correos a contactos de emergencia', error });
  }
};


const formatearNumeroEcuador = (numero) => {
  if (numero.startsWith('0') && numero.length === 10) {
    return '+593' + numero.slice(1);
  }
  return numero;
};

export const enviarSMSContactosEmergencia = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { latitud, longitud, mensaje } = req.body;

    const [contactos] = await conmysql.query(
      `SELECT nombre_contacto, telefono FROM contacto_emergencia WHERE id_usuario = ?`,
      [id_usuario]
    );

    if (!contactos.length) {
      return res.status(404).json({ message: 'No se encontraron contactos de emergencia.' });
    }

    const linkMapa = `https://maps.google.com/?q=${latitud},${longitud}`;
    const cuerpoMensaje = mensaje || `🚨 Alerta de emergencia: se detectó una situación en la ubicación: ${linkMapa}`;

    const resultados = [];

    for (const contacto of contactos) {
      const { telefono, nombre_contacto } = contacto;
      const numeroFormateado = formatearNumeroEcuador(telefono);

      try {
        const result = await sendEmergencySMS(numeroFormateado, cuerpoMensaje);
        resultados.push({ nombre_contacto, telefono: numeroFormateado, status: 'ENVIADO', sid: result.sid });
      } catch (err) {
        resultados.push({ nombre_contacto, telefono: numeroFormateado, status: 'FALLÓ', error: err.message });
      }
    }

    res.json({
      message: 'SMS enviados (o intentados) a todos los contactos de emergencia.',
      total: contactos.length,
      resultados
    });

  } catch (error) {
    console.error('Error al enviar SMS:', error);
    res.status(500).json({ message: 'Error al enviar SMS a contactos de emergencia', error });
  }
};

export const modificarContactoEmergencia = async (req, res) => {
  try {
    const { id_contacto, nombre_contacto, telefono, correo } = req.body;

    // Validar campos obligatorios
    if (!id_contacto || !nombre_contacto || !telefono) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios: id_contacto, nombre y teléfono',
        data: null,
      });
    }

    // 1. Verificar si existe el contacto
    const [contacto] = await conmysql.query(
      'SELECT * FROM contacto_emergencia WHERE id_contacto = ?',
      [id_contacto]
    );

    if (contacto.length === 0) {
      return res.status(404).json({
        mensaje: 'Contacto no encontrado',
        data: null
      });
    }

    // 2. Actualizar el registro
    const [resultado] = await conmysql.query(
      `UPDATE contacto_emergencia 
       SET nombre_contacto = ?, 
           telefono = ?, 
           correo = ?
       WHERE id_contacto = ?`,
      [nombre_contacto, telefono, correo || null, id_contacto]
    );

    // 3. Obtener el contacto actualizado
    const [contactoActualizado] = await conmysql.query(
      'SELECT * FROM contacto_emergencia WHERE id_contacto = ?',
      [id_contacto]
    );

    res.status(200).json({ mensaje: 'Contacto actualizado exitosamente', data: contactoActualizado[0] });

  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contacto', error });
  }
};

export const registrarContactosEmergencia = async (req, res) => {
  try {
    const { id_usuario, nombre_contacto, telefono, correo } = req.body;

    // Validar campos obligatorios
    if (!id_usuario || !nombre_contacto || !telefono) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios: id_usuario, nombre de contacto y teléfono.',
        data: null,
      });
    }

    // Insertar el contacto de emergencia en la tabla
    const [resultado] = await conmysql.query(
      `INSERT INTO contacto_emergencia (id_usuario, nombre_contacto, telefono, correo)
       VALUES (?, ?, ?, ?)`,
      [id_usuario, nombre_contacto, telefono, correo]
    );

    res.status(201).json({ message: 'Contacto de emergencia registrado exitosamente.', id: resultado.insertId });

  } catch (error) {
    res.status(500).json({ message: 'Error al registrar contacto de emergencia', error });
  }
};

export const getContactosEmergencia = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const [rows] = await conmysql.query(
      `SELECT id_contacto, id_usuario, nombre_contacto, telefono, correo
       FROM contacto_emergencia
       WHERE id_usuario = ?`,
      [id_usuario]
    );

    res.json({ message: "Contactos de emergencia listados correctamente.", total: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error al listar los contactos de emergencia', error });
  }
};

// ejemplo en contactoEmergencia.controller.ts


export const obtenerTodosLosContactos = async (req, res) => {
  try {
    const [rows] = await conmysql.query('SELECT * FROM contacto_emergencia');

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
