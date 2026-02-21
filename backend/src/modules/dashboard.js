import { PrismaClient } from '@prisma/client';
import { getTrustScoreDistribution } from './trustEngine.js';
import { getTicketStats } from './maintenance.js';

const prisma = new PrismaClient();

/**
 * Dashboard Summary Module
 * Provides aggregated data for dashboard visualization
 */

// Get comprehensive dashboard summary
export async function getDashboardSummary() {
    try {
        const [
            totalSensors,
            trustDistribution,
            ticketStats,
        ] = await Promise.all([
            prisma.sensor.count(),
            getTrustScoreDistribution(),
            getTicketStats(),
        ]);

        return {
            sensors: {
                total:     totalSensors,
                healthy:   trustDistribution.healthy,
                warning:   trustDistribution.warning,
                anomalous: trustDistribution.anomalous,
                offline:   trustDistribution.offline,        // ← new
                bySeverity: trustDistribution.bySeverity,   // ← new: { Critical, High, Medium, Low, None }
            },
            tickets: ticketStats,
        };
    } catch (error) {
        throw new Error(`Failed to get dashboard summary: ${error.message}`);
    }
}

// Get zone-wise statistics
export async function getZoneStatistics() {
    try {
        const sensors = await prisma.sensor.findMany({
            include: {
                trustScores: {
                    orderBy: { lastEvaluated: 'desc' },
                    take: 1,
                    select: {
                        status:      true,
                        severity:    true,   // ← new
                        rootCauses:  true,   // ← new
                        healthTrend: true,   // ← new
                        score:       true,   // ← new
                    },
                },
            },
        });

        // Group by zone
        const zoneMap = new Map();

        sensors.forEach(sensor => {
            if (!zoneMap.has(sensor.zone)) {
                zoneMap.set(sensor.zone, {
                    zone:      sensor.zone,
                    total:     0,
                    healthy:   0,
                    warning:   0,
                    anomalous: 0,
                    offline:   0,           // ← new
                    avgScore:  0,           // ← new
                    degrading: 0,           // ← new: sensors with degrading trend
                    _scoreSum: 0,           // internal, removed before return
                });
            }

            const zoneData = zoneMap.get(sensor.zone);
            zoneData.total++;

            if (sensor.trustScores.length > 0) {
                const ts = sensor.trustScores[0];

                if      (ts.status === 'Healthy')   zoneData.healthy++;
                else if (ts.status === 'Warning')   zoneData.warning++;
                else if (ts.status === 'Anomalous') zoneData.anomalous++;

                // ← new
                if (ts.rootCauses?.includes('SENSOR_OFFLINE')) zoneData.offline++;
                if (ts.healthTrend === 'degrading')            zoneData.degrading++;
                if (ts.score != null)                          zoneData._scoreSum += ts.score;
            }
        });

        // ← new: compute avgScore, remove internal _scoreSum
        return Array.from(zoneMap.values()).map(z => {
            const avgScore = z.total > 0 ? parseFloat((z._scoreSum / z.total).toFixed(3)) : 0;
            const { _scoreSum, ...rest } = z;
            return { ...rest, avgScore };
        });
    } catch (error) {
        throw new Error(`Failed to get zone statistics: ${error.message}`);
    }
}

// Get recent activity feed — unchanged
export async function getRecentActivity(limit = 10) {
    try {
        const [recentReadings, recentTickets] = await Promise.all([
            prisma.reading.findMany({
                take:    limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    sensor: {
                        select: { sensorId: true, zone: true },
                    },
                },
            }),
            prisma.ticket.findMany({
                take:    limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sensor: {
                        select: { sensorId: true, zone: true },
                    },
                },
            }),
        ]);

        return { recentReadings, recentTickets };
    } catch (error) {
        throw new Error(`Failed to get recent activity: ${error.message}`);
    }
}

// Get sensor health timeline — unchanged
export async function getHealthTimeline(sensorId, days = 7) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const trustScores = await prisma.trustScore.findMany({
            where: {
                sensorId,
                lastEvaluated: { gte: cutoffDate },
            },
            orderBy: { lastEvaluated: 'asc' },
        });

        return trustScores;
    } catch (error) {
        throw new Error(`Failed to get health timeline: ${error.message}`);
    }
}