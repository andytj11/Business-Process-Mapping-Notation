import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });

// Function to handle retry logic for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check if it's a connection error that can be retried
    const isRetryableError = 
      error.code === 'P1017' || // Server has closed the connection
      error.message?.includes('ConnectionReset') ||
      error.message?.includes('connection was forcibly closed');
    
    if (isRetryableError && retries > 0) {
      console.log(`Database connection error, retrying... (${retries} attempts left)`);
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Reconnect prisma client
      await reconnectPrisma();
      
      // Retry the operation with one less retry attempt
      return withRetry(operation, retries - 1, delay * 1.5);
    }
    
    // If not retryable or no more retries left, rethrow the error
    throw error;
  }
}

// Function to reconnect the Prisma client
async function reconnectPrisma() {
  try {
    // Disconnect if connected
    await prisma.$disconnect();
    
    // Reconnect
    await prisma.$connect();
    console.log('Prisma client reconnected successfully');
  } catch (error) {
    console.error('Failed to reconnect Prisma client:', error);
  }
}

// Only do this in development and not in production
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
