import prisma from '../utils/prisma.js';
import cache from '../utils/cache.js';
import { evaluateTrustScore } from './trustEngine.js';
import { broadcastNewReading, broadcastDashboardUpdate } from '../utils/websocket.js';

/**
 * Data Ingestion Module
 * Accepts sensor readings and stores them in the database
 */

// Ingest a new sensor reading
export async function ingestReading(data) {
    const {
        sensorId,
        moisture,
        temperature,
        ec,
        ph,               // ← new
        airTemp,          // ← new
        isRaining,        // ← new
        irrigationActive, // ← new
    } = data;

    try {
        // Find sensor by sensorId (not UUID)
        const sensor = await prisma.sensor.findUnique({
            where: { sensorId },
        });

        if (!sensor) {
            throw new Error(`Sensor ${sensorId} not found`);
        }

        // Create the reading
        const reading = await prisma.reading.create({
            data: {
                sensorId: sensor.id,
                moisture,
                temperature,
                ec,
                ph,               // ← new
                airTemp,          // ← new
                isRaining: isRaining ?? false, // ← new
                irrigationActive: irrigationActive ?? false, // ← new
            },
        });

        // Trigger trust score evaluation and return result alongside reading
        const trustScore = await evaluateTrustScore(sensor.id); // ← now captured

        // Invalidate dashboard caches when new data comes in
        cache.invalidatePattern('dashboard');

        // Broadcast new reading via WebSocket
        const result = { reading, trustScore };
        broadcastNewReading(result);
        broadcastDashboardUpdate({ type: 'reading', sensorId: sensor.sensorId });

        return result; // ← new: was just returning reading
    } catch (error) {
        throw new Error(`Failed to ingest reading: ${error.message}`);
    }
}

// Batch ingest multiple readings (optimized for parallel processing)
export async function ingestBatchReadings(readings) {
    // Process all readings in parallel instead of sequentially
    const results = await Promise.allSettled(
        readings.map(reading => ingestReading(reading))
    );

    // Map results to consistent format
    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return { success: true, data: result.value };
        } else {
            return { success: false, error: result.reason?.message || 'Unknown error' };
        }
    });
}

// Get recent readings for a sensor
export async function getRecentReadings(sensorId, limit = 100) {
    try {
        const readings = await prisma.reading.findMany({
            where: { sensorId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });

        return readings;
    } catch (error) {
        throw new Error(`Failed to fetch readings: ${error.message}`);
    }
}