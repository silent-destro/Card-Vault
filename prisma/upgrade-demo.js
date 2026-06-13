/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma.user.update({
  where: { email: "demo@cardvault.in" },
  data: { plan: "business", expiresAt: null }
}).then(u => {
  console.log("✅ Upgraded:", u.email, "| Plan:", u.plan, "| ExpiresAt:", u.expiresAt);
}).catch(console.error).finally(() => prisma.$disconnect());
