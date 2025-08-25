import { conmysql } from '../db.js';

// Listar clientes según el trabajador
export const getClientesByTrabajador = async (req, res) => {
    const { tra_cedula } = req.params;
    try {
        const [rows] = await conmysql.query(`
            SELECT c.cli_cedula, c.cli_nombres, c.cli_apellidos 
            FROM tb_cliente c
            JOIN tb_medidor m ON c.cli_cedula = m.cli_cedula
            JOIN tb_rutaasignada r ON m.med_id = r.med_id
            WHERE r.tra_cedula = ? AND c.cli_estado = 'A'
        `, [tra_cedula]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los clientes', error });
    }
};

// Registrar consumo para un cliente
export const registrarConsumo = async (req, res) => {
    const { cli_cedula } = req.params;
    const { med_id, mes, anio, consumo, longitudToma, latitudToma } = req.body;

    try {
        // Validar si el medidor pertenece al cliente
        const [validacion] = await conmysql.query(`
            SELECT med_id FROM tb_medidor WHERE cli_cedula = ? AND med_id = ? AND med_estado = 'A'
        `, [cli_cedula, med_id]);

        if (validacion.length === 0) {
            return res.status(400).json({ message: 'El medidor no pertenece al cliente o está inactivo' });
        }

        // Registrar el consumo
        const [result] = await conmysql.query(`
            INSERT INTO tb_consumo (med_id, mes, anio, consumo, longitudToma, latitudToma)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [med_id, mes, anio, consumo, longitudToma, latitudToma]);

        res.status(201).json({ message: 'Consumo registrado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el consumo', error });
    }
};

// Listar todos los clientes activos con su número de medidor
export const getClientes = async (req, res) => {
  try {
      const [rows] = await conmysql.query(`
          SELECT c.cli_cedula, c.cli_nombres, c.cli_apellidos, m.med_id 
          FROM tb_cliente c
          LEFT JOIN tb_medidor m ON c.cli_cedula = m.cli_cedula
          WHERE c.cli_estado = 'A' AND m.med_estado = 'A'
      `);
      res.json(rows);
  } catch (error) {
      res.status(500).json({ message: 'Error al listar los clientes', error });
  }
};
