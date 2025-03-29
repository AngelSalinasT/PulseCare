const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  deviceId: { 
    type: String, 
    required: true 
  },
  // Campos específicos de tu sensor (ejemplo de tu documento)
  Signal: { 
    type: Number, 
    required: true 
  },
  BPW: { 
    type: Number, 
    default: 0  // Valor por defecto si el sensor no envía dato
  },
  BPW_Avg: { 
    type: Number, 
    default: 0 
  },
  // Metadata adicional
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Índices para optimizar búsquedas
sensorReadingSchema.index({ patient: 1, timestamp: -1 }); // Búsqueda por paciente y fecha
sensorReadingSchema.index({ Signal: 1 }); // Si necesitas filtrar por valor de señal

module.exports = mongoose.model('SensorReading', sensorReadingSchema);