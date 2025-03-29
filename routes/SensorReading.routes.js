const express = require("express");
const router = express.Router();
const sensorReadingController = require("../controllers/sensorReadingController");
const { body } = require("express-validator");

// Middleware de validación
const validateReading = [
  body("patientId").notEmpty().isString(),
  body("deviceId").notEmpty().isString(),
  body("Signal").notEmpty().isNumeric(),
  body("BPW").optional().isNumeric(),
  body("BPW_Avg").optional().isNumeric(),
];

// Rutas
router.post("/", validateReading, sensorReadingController.createReading);
router.get("/patient/:patientId", sensorReadingController.getReadingsByPatient);
router.get(
  "/patient/:patientId/filter",
  sensorReadingController.getReadingsBySignalRange
);

module.exports = router;
