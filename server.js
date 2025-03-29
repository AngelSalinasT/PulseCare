require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Transform } = require('stream');
const { Parser } = require('json2csv');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de conexión a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'iot_data',
      maxPoolSize: 10 // Conexiones máximas
    });
    console.log('✅ Conectado a MongoDB | Base de datos: iot_data');
    return conn.connection;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
};

// Middleware
app.use(express.json());
app.timeout = 600000; // 10 minutos timeout

// Variable de conexión
let dbConnection;

// Ruta de exportación ajustada a tu formato exacto
app.get('/export-pulso-csv', async (req, res) => {
  console.log('⚡ Iniciando exportación de datos de pulso...');
  
  try {
    // Verificar/conectar a MongoDB
    if (!dbConnection || dbConnection.readyState !== 1) {
      dbConnection = await connectDB();
    }

    const db = dbConnection.db;
    const collection = db.collection('pulso');

    // Verificar si la colección tiene documentos
    const documentCount = await collection.countDocuments();
    if (documentCount === 0) {
      console.log('⚠️ Colección "pulso" está vacía');
      return res.status(404).json({
        success: false,
        message: 'La colección pulso no contiene documentos'
      });
    }
    console.log(`📊 Documentos a exportar: ${documentCount}`);

    // Configuración CSV EXACTA para tu formato
    const fields = [
      {
        label: 'ID',
        value: '_id'
      },
      {
        label: 'signal',
        value: 'signal'
      },
      {
        label: 'bpm',
        value: 'bpm'
      },
      {
        label: 'avg_bpm',
        value: 'avg_bpm'
      },
      {
        label: 'avg_edge',
        value: 'avg_edge'
      },
      {
        label: 'timestamp',
        value: row => new Date(row.timestamp).toISOString()
      }
    ];

    // Parser con formato exacto
    const parser = new Parser({ 
      fields,
      header: true,
      delimiter: ',',
      quote: '"',
      withBOM: true // Para Excel compatibilidad
    });

    // Stream de transformación optimizado
    const transformStream = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          // Formateo especial para el timestamp si es necesario
          if (chunk.timestamp && typeof chunk.timestamp === 'string') {
            chunk.timestamp = chunk.timestamp.replace(',', '.');
          }
          this.push(parser.parse([chunk]));
          callback();
        } catch (error) {
          console.error('Error transformando documento:', chunk._id, error);
          callback(null); // Saltar documento problemático
        }
      }
    });

    // Configurar respuesta
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`pulso_export_${new Date().toISOString().split('T')[0]}.csv`);

    // Stream para conteo y progreso
    let processed = 0;
    const progressStream = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        processed++;
        if (processed % 1000 === 0 || processed === documentCount) {
          console.log(`🔄 ${processed}/${documentCount} (${Math.round((processed/documentCount)*100)}%)`);
        }
        this.push(chunk);
        callback();
      }
    });

    // Crear cursor optimizado
    const cursor = collection.find({})
      .sort({ timestamp: -1 })
      .batchSize(1000)
      .maxTimeMS(300000); // 5 minutos timeout para la consulta

    // Pipeline completo
    cursor.stream()
      .pipe(progressStream)
      .pipe(transformStream)
      .pipe(res)
      .on('error', (error) => {
        console.error('💥 Error durante exportación:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error durante la generación del CSV',
            error: error.message
          });
        }
      })
      .on('finish', () => {
        console.log(`🎉 Exportación completada! Total: ${processed} documentos`);
      });

  } catch (error) {
    console.error('🔥 Error crítico:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error al iniciar la exportación',
        error: error.message
      });
    }
  }
});

// Ruta de verificación mejorada
app.get('/check-db', async (req, res) => {
  try {
    if (!dbConnection || dbConnection.readyState !== 1) {
      dbConnection = await connectDB();
    }
    
    const db = dbConnection.db;
    const stats = await db.collection('pulso').stats();
    
    res.json({
      status: 'OK',
      database: db.databaseName,
      collection: 'pulso',
      documents: stats.count,
      size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
      storage: (stats.storageSize / (1024 * 1024)).toFixed(2) + ' MB',
      indexes: stats.nindexes
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Iniciar servidor
(async () => {
  try {
    dbConnection = await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
      console.log(`📊 Exportar datos: http://localhost:${PORT}/export-pulso-csv`);
      console.log(`🔍 Verificar BD: http://localhost:${PORT}/check-db`);
    });
  } catch (error) {
    console.error('❌ Falla al iniciar servidor:', error);
    process.exit(1);
  }
})();