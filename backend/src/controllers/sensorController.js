import { registerSensor, getAllSensors, getSensorById } from '../modules/sensorRegistry.js';
import { getTrustHistory } from '../modules/trustEngine.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Register a new sensor
 */
export const createSensor = async (req, res) => {
    try {
        const sensor = await registerSensor(req.body);
        res.status(201).json({
            success: true,
            data: sensor,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Get all sensors
 */
export const getSensors = async (req, res) => {
    try {
        const sensors = await getAllSensors();
        res.json({
            success: true,
            data: sensors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Get sensor by ID
 */
export const getSensor = async (req, res) => {
    try {
        const sensor = await getSensorById(req.params.id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensor not found',
            });
        }
        res.json({
            success: true,
            data: sensor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Get trust score history for a sensor
 */
export const getSensorTrustHistory = async (req, res) => {
    try {
        // Try to find sensor by sensorId (e.g., "SENSOR-001") first
        let sensor = await prisma.sensor.findUnique({
            where: { sensorId: req.params.id },
        });

        // If not found, try by UUID
        if (!sensor) {
            sensor = await getSensorById(req.params.id);
        }

        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensor not found',
            });
        }

        const history = await getTrustHistory(sensor.id);
        res.json({
            success: true,
            data: history,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
