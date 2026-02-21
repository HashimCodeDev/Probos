import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Prevents multiple instances and connection pool exhaustion
 */

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    // In development, use a global variable to preserve the instance
    // across hot reloads to prevent connection pool exhaustion
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            log: ['error', 'warn'],
        });
    }
    prisma = global.prisma;
}

export default prisma;
