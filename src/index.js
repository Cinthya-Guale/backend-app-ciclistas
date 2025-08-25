import dotenv from "dotenv";
import app from "./app.js";
import { conmysql } from "./db.js";


dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (() => { 
    throw new Error("La variable de entorno PORT no está definida."); 
})();

app.listen(PORT, async () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);

    try {
        const connection = await conmysql.getConnection();
        console.log("Conectado exitosamente a la base de datos.");
        connection.release();
    } catch (error) {
        console.error("No se pudo conectar a la base de datos:", error.message);
    }
});
