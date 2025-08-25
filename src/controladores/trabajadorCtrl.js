import { conmysql } from '../db.js';

// Listar todos los trabajadores activos
export const getTrabajadores = async (req, res) => {
    try {
        const [rows] = await conmysql.query(`
            SELECT tra_cedula, tra_nombres, tra_apellidos, tra_estado 
            FROM tb_trabajador 
            WHERE tra_estado = 'A'
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los trabajadores', error });
    }
};
