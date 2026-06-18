/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  // 1. Upsert default user
  const user = await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {
      passwordHash: hashPassword("demo1234"),
      plan: "business",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    create: {
      id: "demo-user",
      email: "demo@cardvault.in",
      name: "Demo User",
      plan: "business",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      passwordHash: hashPassword("demo1234")
    },
  });

  // 2. Default hours configuration
  const hoursConfig = {
    mon: { open: "10:00", close: "21:00", closed: false },
    tue: { open: "10:00", close: "21:00", closed: false },
    wed: { open: "10:00", close: "21:00", closed: false },
    thu: { open: "10:00", close: "21:00", closed: false },
    fri: { open: "10:00", close: "21:00", closed: false },
    sat: { open: "10:00", close: "21:00", closed: false },
    sun: { open: "11:00", close: "19:00", closed: false },
  };

  // 3. Upsert default card
  const card = await prisma.card.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      userId: "demo-user",
      slug: "demo",
      businessName: "Patel Electronics",
      category: "Electronics Store",
      tagline: "Rajkot's finest electronics store since 1995. Quality products, honest prices.",
      logoUrl: "",
      theme: "dark-luxury",
      phone: "+91 98765 43210",
      whatsapp: "+919876543210",
      email: "patel.electronics@gmail.com",
      website: "https://patelelectronics.in",
      address: "Shop 12, Main Market, Rajkot, Gujarat 360001",
      city: "Rajkot",
      googleMapsUrl: "https://maps.google.com/?q=Rajkot+Gujarat",
      instagramUrl: "https://instagram.com/patelelectronics",
      facebookUrl: "https://facebook.com/patelelectronics",
      upiId: "patel@gpay",
      hours: JSON.stringify(hoursConfig),
      serviceTags: "Great Selection,Friendly Staff,Good Prices,Fast Service,Honest Advice",
      photos: "",
      showReviewButton: true,
      showCatalog: true,
      showBooking: true,
      isVerified: true,
    },
  });

  // 4. Seed some sample reviews
  const reviewCount = await prisma.review.count({ where: { cardId: card.id } });
  if (reviewCount === 0) {
    await prisma.review.createMany({
      data: [
        {
          cardId: card.id,
          starRating: 5,
          language: "en",
          tone: "friendly",
          selectedTags: "Great Selection,Friendly Staff",
          reviewText: "Excellent experience at Patel Electronics! Great selection stood out. Highly recommend.",
          variantIndex: 1,
          postedTo: "google",
        },
        {
          cardId: card.id,
          starRating: 5,
          language: "hi",
          tone: "friendly",
          selectedTags: "Friendly Staff,Good Prices",
          reviewText: "Patel Electronics से बहुत अच्छा अनुभव रहा! Friendly Staff देखकर बहुत खुशी हुई। जरूर दोबारा आएंगे।",
          variantIndex: 1,
          postedTo: "google",
        }
      ]
    });
  }

  // 5. Seed some sample catalog items
  const catalogCount = await prisma.catalogItem.count({ where: { cardId: card.id } });
  if (catalogCount === 0) {
    await prisma.catalogItem.createMany({
      data: [
        {
          cardId: card.id,
          name: "iPhone 15 Pro",
          description: "Titanium design, A17 Pro chip, customizable Action button, and a powerful camera system.",
          price: 134900.0,
          imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=300&auto=format&fit=crop",
          category: "Products",
          sortOrder: 0,
          isVisible: true
        },
        {
          cardId: card.id,
          name: "Sony WH-1000XM4 Headphones",
          description: "Industry-leading noise canceling wireless headphones with Alexa built-in and mic for phone calls.",
          price: 22990.0,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop",
          category: "Accessories",
          sortOrder: 1,
          isVisible: true
        },
        {
          cardId: card.id,
          name: "Installation & Setup Service",
          description: "Professional wall-mounting, audio tuning, and smart home setup for all electronics purchased.",
          price: 1499.0,
          imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=300&auto=format&fit=crop",
          category: "Services",
          sortOrder: 2,
          isVisible: true
        }
      ]
    });
  }

  console.log("Seeding complete! Loaded user, card, reviews, and catalog items successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
