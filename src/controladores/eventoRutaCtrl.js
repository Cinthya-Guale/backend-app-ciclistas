import express from 'express';
const { Request, Response } = express;

import { conmysql } from '../db.js'; // ✅ Corrección aquí

export async function registrarEventoRuta(req, res) {
    console.log('Datos recibidos:', req.body);

  try {
const { id_usuario, id_ruta, tipo_evento, descripcion, ip } = req.body;

if (!id_usuario || !id_ruta || !tipo_evento || !descripcion) {
  return res.status(400).json({ message: 'Faltan datos requeridos' });
}
 const fecha_evento = new Date();
await conmysql.query(
  `INSERT INTO evento_ruta (id_ruta, tipo_evento, descripcion, ip_dispositivo, fecha_evento, id_usuario)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [id_ruta, tipo_evento, descripcion, ip || null, fecha_evento, id_usuario]
);

    res.status(201).json({ message: 'Evento registrado exitosamente' });
  } catch (error) {
  console.error('Error al registrar evento:', error.message, error);
  res.status(500).json({ message: 'Error interno del servidor' });
}

}
export async function listarEventosRuta(req, res) {
  try {
    const [result] = await conmysql.query('SELECT * FROM evento_ruta ORDER BY fecha_evento DESC');
    res.json(result);
  } catch (error) {
    console.error('Error al listar eventos:', error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

