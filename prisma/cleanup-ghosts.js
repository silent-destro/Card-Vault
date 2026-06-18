/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanup() {
  console.log("Cleaning up ghost accounts (users with no passwordHash and no Google avatarUrl)...");

  // Find all users that have no passwordHash AND no avatarUrl (not Google users)
  // These are accounts auto-created by the old broken signInAction
  const ghostUsers = await prisma.user.findMany({
    where: {
      passwordHash: null,
      avatarUrl: null,
      // Don't delete admin/demo accounts
      email: {
        notIn: ["demo@cardvault.in", "dhairya@cardvault.in", "admin@cardvault.in"]
      },
      // Don't delete admin domain accounts
      NOT: {
        email: { endsWith: "@cardvault.in" }
      }
    },
    include: { cards: true }
  });

  // Only delete users that have NO cards (never actually used the app)
  const emptyGhostUsers = ghostUsers.filter(u => u.cards.length === 0);

  console.log(`Found ${ghostUsers.length} ghost users, ${emptyGhostUsers.length} with no cards (safe to delete)`);

  if (emptyGhostUsers.length > 0) {
    const ids = emptyGhostUsers.map(u => u.id);
    const emails = emptyGhostUsers.map(u => u.email);
    console.log("Deleting ghost users:", emails);

    await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });

    console.log(`✓ Deleted ${emptyGhostUsers.length} ghost accounts.`);
  } else {
    console.log("No empty ghost accounts to delete.");
  }

  // Report users with cards but no password (need manual review)
  const ghostWithCards = ghostUsers.filter(u => u.cards.length > 0);
  if (ghostWithCards.length > 0) {
    console.log("\n⚠️ The following users have cards but no password (Google-only or legacy users):");
    ghostWithCards.forEach(u => {
      console.log(`  - ${u.email} (${u.cards.length} cards) | Avatar: ${u.avatarUrl ? "Yes" : "No"}`);
    });
  }

  console.log("\nCleanup complete!");
}

cleanup()
  .catch((e) => {
    console.error("Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
