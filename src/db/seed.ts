import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool } from "./index";
import { businesses, users, categories, inventoryItems, tills } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const platformEmail = "admin@nineeightpulse.com";

  const [existing] = await db.select().from(users).where(eq(users.email, platformEmail));
  if (!existing) {
    const passwordHash = await bcrypt.hash("Admin@12345", 10);
    await db.insert(users).values({
      businessId: null,
      name: "Nine Eight Koncepts Admin",
      email: platformEmail,
      passwordHash,
      role: "platform_admin",
      status: "active",
    });
    console.log("Created platform admin:", platformEmail, "password: Admin@12345");
  } else {
    console.log("Platform admin already exists");
  }

  const demoSlug = "demo-bistro";
  const [existingBiz] = await db.select().from(businesses).where(eq(businesses.slug, demoSlug));
  let businessId: number;
  if (!existingBiz) {
    const [biz] = await db
      .insert(businesses)
      .values({
        name: "Demo Bistro & Bar",
        slug: demoSlug,
        businessType: "restaurant",
        email: "owner@demobistro.com",
        phone: "+1 555 010 2030",
        address: "123 Flavor Street, Food City",
        currency: "USD",
        taxRate: "8.5",
        status: "active",
        plan: "growth",
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      })
      .returning();
    businessId = biz.id;
    console.log("Created demo business:", biz.name);

    const ownerHash = await bcrypt.hash("Owner@12345", 10);
    const managerHash = await bcrypt.hash("Manager@12345", 10);
    const cashierHash = await bcrypt.hash("Cashier@12345", 10);

    await db.insert(users).values([
      {
        businessId,
        name: "Olivia Owner",
        email: "owner@demobistro.com",
        passwordHash: ownerHash,
        role: "owner",
        status: "active",
      },
      {
        businessId,
        name: "Marcus Manager",
        email: "manager@demobistro.com",
        passwordHash: managerHash,
        role: "manager",
        status: "active",
      },
      {
        businessId,
        name: "Casey Cashier",
        email: "cashier@demobistro.com",
        passwordHash: cashierHash,
        role: "cashier",
        status: "active",
      },
    ]);

    const [foodCat] = await db
      .insert(categories)
      .values({ businessId, name: "Food" })
      .returning();
    const [drinksCat] = await db
      .insert(categories)
      .values({ businessId, name: "Drinks" })
      .returning();
    const [barCat] = await db
      .insert(categories)
      .values({ businessId, name: "Bar" })
      .returning();

    await db.insert(inventoryItems).values([
      {
        businessId,
        categoryId: foodCat.id,
        name: "Classic Cheeseburger",
        sku: "FOOD-001",
        price: "12.50",
        cost: "5.00",
        quantity: "40",
        lowStockThreshold: "10",
      },
      {
        businessId,
        categoryId: foodCat.id,
        name: "Margherita Pizza",
        sku: "FOOD-002",
        price: "14.00",
        cost: "5.50",
        quantity: "25",
        lowStockThreshold: "8",
      },
      {
        businessId,
        categoryId: foodCat.id,
        name: "Caesar Salad",
        sku: "FOOD-003",
        price: "9.50",
        cost: "3.20",
        quantity: "30",
        lowStockThreshold: "8",
      },
      {
        businessId,
        categoryId: drinksCat.id,
        name: "Fresh Lemonade",
        sku: "DRK-001",
        price: "4.50",
        cost: "1.20",
        quantity: "60",
        lowStockThreshold: "15",
      },
      {
        businessId,
        categoryId: drinksCat.id,
        name: "Iced Coffee",
        sku: "DRK-002",
        price: "5.00",
        cost: "1.50",
        quantity: "50",
        lowStockThreshold: "15",
      },
      {
        businessId,
        categoryId: barCat.id,
        name: "Draft Beer (Pint)",
        sku: "BAR-001",
        price: "6.50",
        cost: "2.00",
        quantity: "80",
        lowStockThreshold: "20",
      },
      {
        businessId,
        categoryId: barCat.id,
        name: "House Red Wine (Glass)",
        sku: "BAR-002",
        price: "8.00",
        cost: "3.00",
        quantity: "45",
        lowStockThreshold: "10",
      },
      {
        businessId,
        categoryId: barCat.id,
        name: "Signature Mojito",
        sku: "BAR-003",
        price: "9.50",
        cost: "2.80",
        quantity: "35",
        lowStockThreshold: "10",
      },
    ]);

    await db.insert(tills).values([
      { businessId, name: "Front Counter", status: "closed" },
      { businessId, name: "Bar Till", status: "closed" },
    ]);

    console.log("Seeded demo staff, inventory and tills");
  } else {
    console.log("Demo business already exists");
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
