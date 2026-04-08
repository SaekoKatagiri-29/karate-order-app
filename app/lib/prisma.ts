import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function createPrismaClient() {
  const url = process.env.DATABASE_URL!
  const isLocal = url.startsWith('file:')

  const adapter = new PrismaLibSql({
    url: isLocal ? url : url, // Turso: libsql://xxx, ローカル: file:./dev.db
    authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
