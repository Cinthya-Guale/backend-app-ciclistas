import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const conmysql=createPool({
    host: process.env.BD_HOST,
    database: process.env.BD_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

export { conmysql };