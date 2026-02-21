import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sensor Registry Module
 * Handles sensor registration and metadata storage
 */

// Register a new sensor
export async function registerSensor(data) {
    const { sensorId, zone, type, latitude, longitude } = data;

    try {
        const sensor = await prisma.sensor.create({
            data: {
                sensorId,
                zone,
                type,
                latitude,
                longitude,
            },
        });

        // Initialize trust score for the new sensor
        await prisma.trustScore.create({
            data: {
                sensorId:    sensor.id,
                score:       1.0,               // ← changed: was 100.0, now 0–1 scale
                status:      'Healthy',
                label:       'Highly Reliable', // ← new
                severity:    'None',            // ← new
                diagnostic:  'Sensor newly registered — awaiting first evaluation.', // ← new
                healthTrend: 'stable',          // ← new
            },
        });

        return sensor;
    } catch (error) {
        throw new Error(`Failed to register sensor: ${error.message}`);
    }
}

// Get all sensors with their latest trust scores
export async function getAllSensors() {
    try {
        const sensors = await prisma.sensor.findMany({
            include: {
                trustScores: {
                    orderBy: { lastEvaluated: 'desc' },
                    take: 1,
                    select: {
                        id:               true,
                        score:            true,
                        status:           true,
                        label:            true,        // ← new
                        severity:         true,        // ← new
                        diagnostic:       true,        // ← new
                        rootCauses:       true,        // ← new
                        paramMoisture:    true,        // ← new
                        paramTemperature: true,        // ← new
                        paramEc:          true,        // ← new
                        paramPh:          true,        // ← new
                        lowVariance:      true,
                        spikeDetected:    true,
                        zoneAnomaly:      true,
                        healthTrend:      true,        // ← new
                        anomalyRate:      true,        // ← new
                        lastEvaluated:    true,
                    },
                },
                readings: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
        });

        return sensors;
    } catch (error) {
        throw new Error(`Failed to fetch sensors: ${error.message}`);
    }
}

// Get sensor by ID
export async function getSensorById(id) {
    try {
        const sensor = await prisma.sensor.findUnique({
            where: { id },
            include: {
                trustScores: {
                    orderBy: { lastEvaluated: 'desc' },
                    take: 1,
                    select: {
                        id:               true,
                        score:            true,
                        status:           true,
                        label:            true,        // ← new
                        severity:         true,        // ← new
                        diagnostic:       true,        // ← new
                        rootCauses:       true,        // ← new
                        paramMoisture:    true,        // ← new
                        paramTemperature: true,        // ← new
                        paramEc:          true,        // ← new
                        paramPh:          true,        // ← new
                        lowVariance:      true,
                        spikeDetected:    true,
                        zoneAnomaly:      true,
                        flags:            true,        // ← new
                        healthTrend:      true,        // ← new
                        healthSlope:      true,        // ← new
                        anomalyRate:      true,        // ← new
                        lastEvaluated:    true,
                    },
                },
                readings: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
        });

        return sensor;
    } catch (error) {
        throw new Error(`Failed to fetch sensor: ${error.message}`);
    }
}