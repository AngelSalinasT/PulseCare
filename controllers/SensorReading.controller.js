const SensorReading = require("../models/SensorReading");

// Crear una nueva lectura
exports.createReading = async (req, res) => {
  try {
    const { patientId, deviceId, Signal, BPW, BPW_Avg } = req.body;

    const reading = new SensorReading({
      patient: patientId,
      deviceId,
      Signal,
      BPW: BPW || 0, // Valor por defecto si no se envía
      BPW_Avg: BPW_Avg || 0,
      // timestamp se añade automáticamente
    });

    await reading.save();
    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({
      error: "Error al guardar la lectura",
      details: error.message,
    });
  }
};

// Obtener todas las lecturas de un paciente
exports.getReadingsByPatient = async (req, res) => {
  try {
    const readings = await SensorReading.find({
      patient: req.params.patientId,
    }).sort({ timestamp: -1 }); // Orden descendente por fecha

    res.json(readings);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener lecturas",
      details: error.message,
    });
  }
};

// Obtener lecturas filtradas por señal (ejemplo avanzado)
exports.getReadingsBySignalRange = async (req, res) => {
  try {
    const { min, max } = req.query;
    const readings = await SensorReading.find({
      patient: req.params.patientId,
      Signal: { $gte: parseInt(min), $lte: parseInt(max) },
    });

    res.json(readings);
  } catch (error) {
    res.status(500).json({
      error: "Error al filtrar lecturas",
      details: error.message,
    });
  }
};
