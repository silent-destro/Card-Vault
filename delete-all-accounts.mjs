import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB CLEANUP: STARTING DELETION OF ALL ACCOUNTS ===");
  
  // Deleting all users will automatically cascade and delete cards,
  // catalog items, reviews, bookings, and analytics events due to onDelete: Cascade.
  const deleteResult = await prisma.user.deleteMany({});
  
  console.log(`=== DB CLEANUP: SUCCESS ===`);
  console.log(`Deleted ${deleteResult.count} user accounts and all cascading relational records.`);
}

main()
  .catch((e) => {
    console.error("=== DB CLEANUP: FAILED ===");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
