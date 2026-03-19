const { PrismaClient } = require('@prisma/client');

// Singleton pattern to avoid multiple Prisma Client instances
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'], // Optional: log errors and warnings only
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };