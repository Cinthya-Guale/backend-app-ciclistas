import { conmysql } from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sendEmail } from "../services/emailService.js";

export const login = async (req, res) => {
  try {
    const { correo, clave } = req.body;

    if (!correo || !clave) {
      return res.status(400).json({
        mensaje: 'Correo y clave son obligatorios.',
        data: null,
      });
    }

    // 1) Buscar usuario por correo
    const [usuarios] = await conmysql.query(
      `SELECT 
          u.id_usuario, u.clave, u.estado_usuario, 
          u.identificacion, u.id_perfil,
          p.nombres, p.apellidos, p.correo,
          pr.nombre_perfil
       FROM usuario u
       INNER JOIN persona p ON u.identificacion = p.identificacion
       INNER JOIN perfil pr ON u.id_perfil = pr.id_perfil
       WHERE p.correo = ?`,
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(200).json({
        mensaje: 'Usuario no encontrado.',
        data: null,
      });
    }

    const usuario = usuarios[0];
    if (usuario.estado_usuario !== 'A') {
      return res.status(403).json({
        mensaje: 'La cuenta no está activa.',
        data: null,
      });
    }

    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) {
      return res.status(200).json({
        mensaje: 'Clave incorrecta.',
        data: null,
      });
    }

    // 2) Cargar menús planos (sin parent_id)
    const [menus] = await conmysql.query(
      `SELECT 
         m.id_menu, m.descripcion_menu, m.url_menu, m.icono
       FROM acceso a
       INNER JOIN menu m ON a.id_menu = m.id_menu
       WHERE a.id_perfil = ? 
         AND a.estado_acceso = 'A' 
         AND m.estado_menu = 'A'
       ORDER BY m.id_menu`,
      [usuario.id_perfil]
    );

    // 3) Generar listado directo de accesos
    const accesos = menus.map(m => ({
      id_menu: m.id_menu,
      descripcion_menu: m.descripcion_menu,
      url_menu: m.url_menu,
      icono: m.icono,
    }));

    // 4) Respuesta
    const respuesta = {
      id_usuario: usuario.id_usuario,
      identificacion: usuario.identificacion,
      correo: usuario.correo,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      perfil: usuario.nombre_perfil,
      accesos,
    };

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      data: respuesta,
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      mensaje: 'Error al iniciar sesión.',
      data: null,
    });
  }
};

export const validarCorreo = async (correo) => {
  const [usuarios] = await conmysql.query(
    `SELECT u.id_usuario, p.nombres 
     FROM usuario u
     INNER JOIN persona p ON u.identificacion = p.identificacion
     WHERE p.correo = ?`,
    [correo]
  );
  if (usuarios.length === 0) {
    throw { status: 200, mensaje: 'Correo no registrado' };
  }
  return usuarios[0];
};

export const enviarLinkRecuperacion = async (usuario, correo) => {
  // Generar token
  const token = crypto.randomBytes(32).toString('hex');
  const fechaCreacion = new Date();
  const fechaExpiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  // Insertar el token en la base de datos
  await conmysql.query(
    `INSERT INTO token_usuario (id_usuario, token, tipo, fecha_creacion, fecha_expiracion) 
     VALUES (?, ?, 'RECUPERACION', ?, ?)`,
    [usuario.id_usuario, token, fechaCreacion, fechaExpiracion]
  );

  // Generar el link para restablecer la contraseña
  const link = `http://localhost:8100/change-password?token=${token}`;
  const html = `<p>Hola ${usuario.nombres}, haz clic para cambiar tu contraseña:</p>
                <a href="${link}">${link}</a>`;

  // Enviar correo utilizando el servicio configurado en emailService.js
  await sendEmail(correo, 'Restablecer tu contraseña', html);
};

export const solicitarRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;
    
    const usuario = await validarCorreo(correo); // Valida que el correo exista
    await enviarLinkRecuperacion(usuario, correo);  // Envía el enlace
    
    res.status(200).json({ mensaje: 'Correo de recuperación enviado.' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.mensaje });
    }
    console.error('Error al enviar token de recuperación:', error);
    res.status(500).json({ mensaje: 'Error interno', error });
  }
};

export const registrarUsuario = async (req, res) => {
  try {
    // Desestructurar los datos recibidos. Se omite id_perfil ya que se determinará con un SELECT.
    const { identificacion, nombres, apellidos, genero, direccion, telefono, correo, clave } = req.body;

    // Validar campos obligatorios.
    if (!identificacion || !nombres || !apellidos || !correo || !clave || !genero) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
    }

    // Encriptar la clave.
    const claveEncriptada = await bcrypt.hash(clave, 10);

    // 1. Insertar en la tabla 'persona'.
    await conmysql.query(
      `INSERT INTO persona (identificacion, nombres, apellidos, genero, direccion, telefono, correo) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [identificacion, nombres, apellidos, genero, direccion, telefono, correo]
    );

    // 2. Obtener el ID del perfil "Ciclista" mediante un SELECT.
    const [perfilRows] = await conmysql.query(
      "SELECT id_perfil FROM perfil WHERE nombre_perfil = ?",
      ["Ciclista"]
    );
    if (perfilRows.length === 0) {
      return res.status(404).json({ mensaje: 'Perfil Ciclista no encontrado.' });
    }
    const ciclistaPerfilId = perfilRows[0].id_perfil;

    // 3. Insertar en la tabla 'usuario' usando el perfil obtenido.
    const [usuarioInsert] = await conmysql.query(
      `INSERT INTO usuario (identificacion, id_perfil, clave, fecha_creacion, estado_usuario) 
       VALUES (?, ?, ?, NOW(), 'I')`,
      [identificacion, ciclistaPerfilId, claveEncriptada]
    );
    const id_usuario = usuarioInsert.insertId;

    // 4. Generar token de activación.
    const token = crypto.randomBytes(32).toString('hex');
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora de vigencia

    await conmysql.query(
      `INSERT INTO token_usuario (id_usuario, token, tipo, fecha_creacion, fecha_expiracion) 
       VALUES (?, ?, 'ACTIVACION', ?, ?)`,
      [id_usuario, token, fechaCreacion, fechaExpiracion]
    );

    // 5. Generar el link para la activación de la cuenta.
    const link = `http://localhost:8100/activate-account?token=${token}`;
    const html = `<p>Hola ${nombres}, haz clic para activar tu cuenta:</p><a href="${link}">${link}</a>`;

    // 6. Enviar correo de activación utilizando el servicio sendEmail.
    await sendEmail(correo, 'Activa tu cuenta', html);

    res.status(201).json({ mensaje: 'Usuario registrado. Revisa tu correo para activar la cuenta.' });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno', error });
  }
};

export const registrarUsuario1 = async (req, res) => {
  try {
    // Desestructuramos los datos enviados; se omite id_perfil ya que se determinará mediante el SELECT
    const { identificacion, nombres, apellidos, genero, direccion, telefono, correo, clave } = req.body;

    // Validar campos obligatorios
    if (!identificacion || !nombres || !apellidos || !correo || !clave || !genero) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
    }

    // Encriptar la clave
    const claveEncriptada = await bcrypt.hash(clave, 10);

    // 1. Insertar en la tabla 'persona'
    await conmysql.query(
      `INSERT INTO persona (identificacion, nombres, apellidos, genero, direccion, telefono, correo) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [identificacion, nombres, apellidos, genero, direccion, telefono, correo]
    );

    // 2. Obtener el ID del perfil "Ciclista" realizando un SELECT
    const [perfilRows] = await conmysql.query(
      "SELECT id_perfil FROM perfil WHERE nombre_perfil = ?",
      ["Ciclista"]
    );
    if (perfilRows.length === 0) {
      return res.status(404).json({ mensaje: 'Perfil Ciclista no encontrado.' });
    }
    
    const ciclistaPerfilId = perfilRows[0].id_perfil;

    // 3. Insertar en la tabla 'usuario' usando el perfil obtenido
    const [usuarioInsert] = await conmysql.query(
      `INSERT INTO usuario (identificacion, id_perfil, clave, fecha_creacion, estado_usuario) 
       VALUES (?, ?, ?, NOW(), 'I')`,
      [identificacion, ciclistaPerfilId, claveEncriptada]
    );

    const id_usuario = usuarioInsert.insertId;

    // 4. Generar token de activación
    const token = crypto.randomBytes(32).toString('hex');
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora de vigencia

    await conmysql.query(
      `INSERT INTO token_usuario (id_usuario, token, tipo, fecha_creacion, fecha_expiracion) 
       VALUES (?, ?, 'ACTIVACION', ?, ?)`,
      [id_usuario, token, fechaCreacion, fechaExpiracion]
    );

    // 5. Enviar correo de activación utilizando nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'eliang475@gmail.com',
        pass: 'ivcs ulyv fjhv jhzl',
      },
    });

    const link = `http://localhost:8100/activate-account?token=${token}`;

    await transporter.sendMail({
      from: '"Ciclistas App" <eliang475@gmail.com>',
      to: correo,
      subject: 'Activa tu cuenta',
      html: `<p>Hola ${nombres}, haz clic para activar tu cuenta:</p><a href="${link}">${link}</a>`,
    });

    res.status(201).json({ mensaje: 'Usuario registrado. Revisa tu correo para activar la cuenta.' });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno', error });
  }
};

export const activarCuenta = async (req, res) => {
  try {
    const { token } = req.params;

    // Verificar si el token es válido, no usado y de tipo 'ACTIVACION'
    const [result] = await conmysql.query(
      `SELECT * FROM token_usuario 
       WHERE token = ? AND tipo = 'ACTIVACION' AND usado = 0 AND fecha_expiracion > NOW()`,
      [token]
    );

    if (result.length === 0) {
      return res.status(400).json({
        mensaje: 'Token inválido, expirado o ya usado.',
        data: null
      });
    }

    const tokenData = result[0];

    // Activar la cuenta
    await conmysql.query(
      `UPDATE usuario SET estado_usuario = 'A' WHERE id_usuario = ?`,
      [tokenData.id_usuario]
    );

    // Marcar el token como usado
    await conmysql.query(
      `UPDATE token_usuario SET usado = 1 WHERE id_token = ?`,
      [tokenData.id_token]
    );

    res.status(200).json({
      mensaje: 'Cuenta activada correctamente.',
      data: null
    });

  } catch (error) {
    console.error('Error al activar cuenta:', error);
    res.status(500).json({
      mensaje: 'Error al activar cuenta.',
      data: null
    });
  }
};

export const restablecerClave = async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaClave } = req.body;

    if (!nuevaClave) {
      return res.status(400).json({ mensaje: 'La nueva clave es obligatoria.' });
    }

    // Verificar token válido
    const [tokens] = await conmysql.query(
      `SELECT * FROM token_usuario 
       WHERE token = ? AND tipo = 'RECUPERACION' AND usado = 0 AND fecha_expiracion > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado.' });
    }

    const tokenData = tokens[0];

    // Encriptar nueva clave
    const nuevaClaveHash = await bcrypt.hash(nuevaClave, 10);

    // Actualizar clave
    await conmysql.query(
      `UPDATE usuario SET clave = ? WHERE id_usuario = ?`,
      [nuevaClaveHash, tokenData.id_usuario]
    );

    // Marcar token como usado
    await conmysql.query(
      `UPDATE token_usuario SET usado = 1 WHERE id_token = ?`,
      [tokenData.id_token]
    );

    res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno', error });
  }
};

/* export const enviarLinkRecuperacion = async (usuario, correo) => {
  // Generar token
  const token = crypto.randomBytes(32).toString('hex');
  const fechaCreacion = new Date();
  const fechaExpiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  await conmysql.query(
    `INSERT INTO token_usuario (id_usuario, token, tipo, fecha_creacion, fecha_expiracion) 
     VALUES (?, ?, 'RECUPERACION', ?, ?)`,
    [usuario.id_usuario, token, fechaCreacion, fechaExpiracion]
  );

  // Enviar correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'eliang475@gmail.com',
      pass: 'ivcs ulyv fjhv jhzl',
    },
  });

  const link = `http://localhost:8100/change-password?token=${token}`;

  await transporter.sendMail({
    from: '"Ciclistas App" <eliang475@gmail.com>',
    to: correo,
    subject: 'Restablecer tu contraseña',
    html: `<p>Hola ${usuario.nombres}, haz clic para cambiar tu contraseña:</p>
           <a href="${link}">${link}</a>`,
  });
}; */


/* export const solicitarRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;

    // Validar correo
    const [usuarios] = await conmysql.query(
      `SELECT u.id_usuario, p.nombres FROM usuario u
       INNER JOIN persona p ON u.identificacion = p.identificacion
       WHERE p.correo = ?`,
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ mensaje: 'Correo no registrado' });
    }

    const usuario = usuarios[0];

    // Generar token
    const token = crypto.randomBytes(32).toString('hex');
    const fechaCreacion = new Date();
    const fechaExpiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await conmysql.query(
      `INSERT INTO token_usuario (id_usuario, token, tipo, fecha_creacion, fecha_expiracion) 
       VALUES (?, ?, 'RECUPERACION', ?, ?)`,
      [usuario.id_usuario, token, fechaCreacion, fechaExpiracion]
    );

    // Enviar correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tu_correo@gmail.com',
        pass: 'tu_contraseña_app',
      },
    });

    const link = `http://localhost:8100/change-password?token=${token}`;
    //const link = `http://localhost:3000/api/usuarios/restablecer-clave/${token}`;

    await transporter.sendMail({
      from: '"Ciclistas App" <tu_correo@gmail.com>',
      to: correo,
      subject: 'Restablecer tu contraseña',
      html: `<p>Hola ${usuario.nombres}, haz clic para cambiar tu contraseña:</p>
             <a href="${link}">${link}</a>`,
    });

    res.status(200).json({ mensaje: 'Correo de recuperación enviado.' });

  } catch (error) {
    console.error('Error al enviar token de recuperación:', error);
    res.status(500).json({ mensaje: 'Error interno', error });
  }
}; */

/* export const login = async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
      return res.status(400).json({
        mensaje: 'Cédula y clave son obligatorias.',
        data: null,
      });
    }

    // Buscar usuario
    const [usuarios] = await conmysql.query(
      `SELECT 
          u.id_usuario, u.clave, u.estado_usuario, 
          u.identificacion, u.id_perfil,
          p.nombres, p.apellidos,
          pr.nombre_perfil
       FROM usuario u
       INNER JOIN persona p ON u.identificacion = p.identificacion
       INNER JOIN perfil pr ON u.id_perfil = pr.id_perfil
       WHERE u.identificacion = ?`,
      [usuario]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado.',
        data: null,
      });
    }

    const usuarioEncontrado = usuarios[0];

    if (usuarioEncontrado.estado_usuario !== 'A') {
      return res.status(403).json({
        mensaje: 'La cuenta no está activa.',
        data: null,
      });
    }

    const claveValida = await bcrypt.compare(clave, usuarioEncontrado.clave);
    if (!claveValida) {
      return res.status(401).json({
        mensaje: 'Clave incorrecta.',
        data: null,
      });
    }

    // Cargar menús del perfil
    const [menus] = await conmysql.query(
      `SELECT 
         m.id_menu, m.descripcion_menu, m.url_menu, m.parent_id, m.icono
       FROM acceso a
       INNER JOIN menu m ON a.id_menu = m.id_menu
       WHERE a.id_perfil = ? AND a.estado_acceso = 'A' AND m.estado_menu = 'A'
       ORDER BY m.parent_id, m.id_menu`,
      [usuarioEncontrado.id_perfil]
    );

    // Agrupar menús
    const accesos = [];
    menus.forEach((menu) => {
      if (menu.parent_id === null) {
        accesos.push({
          id_menu: menu.id_menu,
          descripcion_menu: menu.descripcion_menu,
          url_menu: menu.url_menu,
          icono: menu.icono,
          submenus: menus.filter((sub) => sub.parent_id === menu.id_menu),
        });
      }
    });

    // Respuesta final
    const respuesta = {
      id_usuario: usuarioEncontrado.id_usuario,
      identificacion: usuarioEncontrado.identificacion,
      nombres: usuarioEncontrado.nombres,
      apellidos: usuarioEncontrado.apellidos,
      perfil: usuarioEncontrado.nombre_perfil,
      accesos,
    };

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso.',
      data: respuesta,
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      mensaje: 'Error al iniciar sesión.',
      data: null,
    });
  }
};
 */