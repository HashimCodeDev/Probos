import prisma from '../utils/prisma.js';
import cache from '../utils/cache.js';
import { getTrustScoreDistribution } from './trustEngine.js';
import { getTicketStats } from './maintenance.js';

/**
 * Dashboard Summary Module
 * Provides aggregated data for dashboard visualization
 */

// Get comprehensive dashboard summary (with caching)
export async function getDashboardSummary() {
    const cacheKey = 'dashboard:summary';

    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) return cached;

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

        const result = {
            sensors: {
                total: totalSensors,
                healthy: trustDistribution.healthy,
                warning: trustDistribution.warning,
                anomalous: trustDistribution.anomalous,
                offline: trustDistribution.offline,        // ← new
                bySeverity: trustDistribution.bySeverity,   // ← new: { Critical, High, Medium, Low, None }
            },
            tickets: ticketStats,
        };

        // Cache for 30 seconds
        cache.set(cacheKey, result, 30);

        return result;
    } catch (error) {
        throw new Error(`Failed to get dashboard summary: ${error.message}`);
    }
}

// Get zone-wise statistics (with caching and optimized aggregations)
export async function getZoneStatistics() {
    const cacheKey = 'dashboard:zones';

    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Use raw SQL for efficient aggregation instead of N+1 queries
        const zoneStats = await prisma.$queryRaw`
            SELECT 
                s.zone,
                COUNT(s.id)::int as total,
                COUNT(CASE WHEN ts.status = 'Healthy' THEN 1 END)::int as healthy,
                COUNT(CASE WHEN ts.status = 'Warning' THEN 1 END)::int as warning,
                COUNT(CASE WHEN ts.status = 'Anomalous' THEN 1 END)::int as anomalous,
                COUNT(CASE WHEN 'SENSOR_OFFLINE' = ANY(ts."rootCauses") THEN 1 END)::int as offline,
                COUNT(CASE WHEN ts."healthTrend" = 'degrading' THEN 1 END)::int as degrading,
                COALESCE(AVG(ts.score), 0)::float as "avgScore"
            FROM "Sensor" s
            LEFT JOIN LATERAL (
                SELECT status, "rootCauses", "healthTrend", score
                FROM "TrustScore" t
                WHERE t."sensorId" = s.id
                ORDER BY t."lastEvaluated" DESC
                LIMIT 1
            ) ts ON true
            GROUP BY s.zone
            ORDER BY s.zone
        `;

        // Format avgScore to 3 decimal places
        const result = zoneStats.map(z => ({
            ...z,
            avgScore: parseFloat(z.avgScore.toFixed(3))
        }));

        // Cache for 30 seconds
        cache.set(cacheKey, result, 30);

        return result;
    } catch (error) {
        throw new Error(`Failed to get zone statistics: ${error.message}`);
    }
}

// Get recent activity feed — unchanged
export async function getRecentActivity(limit = 10) {
    try {
        const [recentReadings, recentTickets] = await Promise.all([
            prisma.reading.findMany({
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    sensor: {
                        select: { sensorId: true, zone: true },
                    },
                },
            }),
            prisma.ticket.findMany({
                take: limit,
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