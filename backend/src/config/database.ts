import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// creat a single instance (like @Bean in spring)
const prisma = new PrismaClient({
  adapter,
});
export default prisma;
