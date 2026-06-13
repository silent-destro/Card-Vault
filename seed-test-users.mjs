// Script to seed test users with different plans
// Run with: node seed-test-users.mjs

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

// Simple password hasher (matching how the app hashes passwords)
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🔍 Checking for existing test users...\n");

  const testUsers = [
    {
      id: "test-user-free-001",
      email: "free@cardvault.test",
      name: "Free Test User",
      plan: "free",
      password: "Test@1234",
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      id: "test-user-pro-001",
      email: "pro@cardvault.test",
      name: "Pro Test User",
      plan: "pro",
      password: "Test@1234",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      id: "test-user-business-001",
      email: "business@cardvault.test",
      name: "Business Test User",
      plan: "business",
      password: "Test@1234",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  ];

  for (const user of testUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });

    if (existing) {
      console.log(`✅ Already exists: ${user.email}`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Plan: ${existing.plan}`);
      console.log(`   Password: Test@1234`);

      // Make sure plan is correct
      if (existing.plan !== user.plan) {
        await prisma.user.update({
          where: { email: user.email },
          data: { plan: user.plan, expiresAt: user.expiresAt || null },
        });
        console.log(`   ⚠️  Plan updated to: ${user.plan}`);
      }
    } else {
      const created = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          passwordHash: hashPassword(user.password),
          expiresAt: user.expiresAt || null,
        },
      });
      console.log(`🆕 Created: ${user.email}`);
      console.log(`   ID: ${created.id}`);
      console.log(`   Plan: ${created.plan}`);
      console.log(`   Password: Test@1234`);
    }
    console.log("");
  }

  console.log("✨ Done! Here are your test credentials:\n");
  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│              TEST ACCOUNT CREDENTIALS                │");
  console.log("├──────────┬──────────────────────────┬───────────────┤");
  console.log("│  Plan    │  Email                   │  Password     │");
  console.log("├──────────┼──────────────────────────┼───────────────┤");
  console.log("│  FREE    │  free@cardvault.test      │  Test@1234    │");
  console.log("│  PRO     │  pro@cardvault.test       │  Test@1234    │");
  console.log("│  BUSINESS│  business@cardvault.test  │  Test@1234    │");
  console.log("└──────────┴──────────────────────────┴───────────────┘");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
