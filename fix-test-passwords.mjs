// Fix test user passwords using correct PBKDF2 hashing (matching app's hashPassword function)
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// Use DIRECT_URL to bypass pgbouncer connection issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qmysosaeajcfqohimjtx:Dhairya%401414@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    }
  }
});

// This EXACTLY matches the hashPassword function in app/card/actions.ts
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const password = "Test@1234";
  const testUsers = [
    { email: "free@cardvault.test",     plan: "free" },
    { email: "pro@cardvault.test",      plan: "pro" },
    { email: "business@cardvault.test", plan: "business" },
  ];

  console.log("🔧 Fixing password hashes for test users...\n");

  for (const u of testUsers) {
    const newHash = hashPassword(password);
    const updated = await prisma.user.update({
      where: { email: u.email },
      data: { passwordHash: newHash },
    });
    console.log(`✅ Fixed: ${u.email}  (plan: ${updated.plan})`);
  }

  console.log("\n✨ All passwords reset! Use these credentials:\n");
  console.log("┌──────────┬──────────────────────────────┬────────────┐");
  console.log("│  Plan    │  Email                       │  Password  │");
  console.log("├──────────┼──────────────────────────────┼────────────┤");
  console.log("│  FREE    │  free@cardvault.test          │  Test@1234 │");
  console.log("│  PRO     │  pro@cardvault.test           │  Test@1234 │");
  console.log("│  BUSINESS│  business@cardvault.test      │  Test@1234 │");
  console.log("└──────────┴──────────────────────────────┴────────────┘");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
