require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { Parser } = require("json2csv");

// Importar rutas
const sensorDataRoutes = require("./routes/sensorData.routes");
const SensorData = require("./models/sensorData.model");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Rutas principales
app.use("/api/sensor-data", sensorDataRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Monitoreo de Salud - Hackathon");
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Configuración importante:
app.listen(PORT, "0.0.0.0", () => {
  // Escucha en todas las interfaces
  console.log(`Servidor accesible en:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Red local: http://${getLocalIpAddress()}:${PORT}`);
});

// Sirve para cerrar el servidor y evitar problemas al levantarlo nuevamente
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Servidor cerrado");
    process.exit(0);
  });
});

// Función para obtener tu IP local
function getLocalIpAddress() {
  const interfaces = require("os").networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Obtencion de los registros convertidos de json a csv
app.get("/api/export", async (req, res) => {
  try {
    const data = await SensorData.find({}).lean();

    const fields = [
      "ecg",
      "bpm",
      "device_id",
      {
        label: "Fecha",
        value: "createdAt",
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(`export_${new Date().toISOString()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
