import "dotenv/config";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const connectionString = `${process.env.DATABASE_URL}`

// Configure pg.Pool directly to increase the connection timeout.
// This prevents Prisma from timing out when the Neon database is waking up from idle state.
const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 30000, // 30 seconds to allow Neon to wake up
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma