const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {

  // =========================
  // STOCK
  // =========================
  const stocks = await prisma.stock.createMany({
    data: [
      { name: "Tepung", quantity: 1000, maxStock: 2000 },
      { name: "Beras", quantity: 2000, maxStock: 3000 },
      { name: "Teh", quantity: 1000, maxStock: 2000 },
      { name: "Gula", quantity: 1000, maxStock: 2000 },
      { name: "Susu", quantity: 1000, maxStock: 2000 },
      { name: "Garam", quantity: 1000, maxStock: 2000 },
      { name: "Ayam Kemasan", quantity: 1000, maxStock: 2000 },
      { name: "Daging", quantity: 1000, maxStock: 2000 },
      { name: "Coklat", quantity: 1000, maxStock: 2000 },
      { name: "Strawberry", quantity: 1000, maxStock: 2000 },
      { name: "Soda", quantity: 1000, maxStock: 2000 },
      { name: "Air", quantity: 2000, maxStock: 3000 },
      { name: "Es Batu", quantity: 2000, maxStock: 3000 },
      { name: "Cabai", quantity: 1000, maxStock: 2000 }
    ],
    skipDuplicates: true
  });

  // =========================
  // RECIPE
  // =========================
  await prisma.recipe.createMany({
    data: [
      { name: "Creamy Mushroom Pasta", category: "food" },
      { name: "Butter Chicken Rice", category: "food" },
      { name: "Roasted Chicken Provencale", category: "food" },
      { name: "Chicken Cordon Blue", category: "food" },
      { name: "Tiramisu", category: "food" },
      { name: "Cheese Quiche", category: "food" },

      { name: "Sparkling Water", category: "drink" },
      { name: "Jasmine Tea", category: "drink" },
      { name: "Iced Lemon Tea", category: "drink" },
      { name: "Iced Chocolate", category: "drink" },
      { name: "Strawberry Infused Water", category: "drink" }
    ],
    skipDuplicates: true
  });

  // =========================
  // AMBIL DATA UNTUK RELASI
  // =========================
  const allStocks = await prisma.stock.findMany();
  const allRecipes = await prisma.recipe.findMany();

  const stockMap = {};
  allStocks.forEach(s => stockMap[s.name] = s.id);

  const recipeMap = {};
  allRecipes.forEach(r => recipeMap[r.name] = r.id);

  // =========================
  // RECIPE INGREDIENT
  // =========================
await prisma.recipeIngredient.createMany({
  data: [

    // ================= FOOD =================

    // Creamy Mushroom Pasta
    { recipeId: recipeMap["Creamy Mushroom Pasta"], stockId: stockMap["Tepung"], amount: 10 },
    { recipeId: recipeMap["Creamy Mushroom Pasta"], stockId: stockMap["Susu"], amount: 10 },
    { recipeId: recipeMap["Creamy Mushroom Pasta"], stockId: stockMap["Garam"], amount: 10 },

    // Butter Chicken Rice
    { recipeId: recipeMap["Butter Chicken Rice"], stockId: stockMap["Ayam Kemasan"], amount: 10 },
    { recipeId: recipeMap["Butter Chicken Rice"], stockId: stockMap["Beras"], amount: 10 },
    { recipeId: recipeMap["Butter Chicken Rice"], stockId: stockMap["Garam"], amount: 10 },

    // Roasted Chicken Provencale
    { recipeId: recipeMap["Roasted Chicken Provencale"], stockId: stockMap["Ayam Kemasan"], amount: 10 },
    { recipeId: recipeMap["Roasted Chicken Provencale"], stockId: stockMap["Cabai"], amount: 10 },
    { recipeId: recipeMap["Roasted Chicken Provencale"], stockId: stockMap["Beras"], amount: 10 },

    // Chicken Cordon Blue
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Ayam Kemasan"], amount: 10 },
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Susu"], amount: 5 },
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Beras"], amount: 5 },
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Cabai"], amount: 5 },

    // Tiramisu
    { recipeId: recipeMap["Tiramisu"], stockId: stockMap["Coklat"], amount: 5 },
    { recipeId: recipeMap["Tiramisu"], stockId: stockMap["Susu"], amount: 5 },

    // Cheese Quiche
    { recipeId: recipeMap["Cheese Quiche"], stockId: stockMap["Susu"], amount: 5 },
    { recipeId: recipeMap["Cheese Quiche"], stockId: stockMap["Garam"], amount: 2 },
    { recipeId: recipeMap["Cheese Quiche"], stockId: stockMap["Daging"], amount: 5 },

    // ================= DRINK =================

    // Sparkling Water
    { recipeId: recipeMap["Sparkling Water"], stockId: stockMap["Soda"], amount: 5 },
    { recipeId: recipeMap["Sparkling Water"], stockId: stockMap["Air"], amount: 5 },
    { recipeId: recipeMap["Sparkling Water"], stockId: stockMap["Es Batu"], amount: 10 },

    // Jasmine Tea
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Teh"], amount: 5 },
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Air"], amount: 5 },
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Es Batu"], amount: 5 },
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Gula"], amount: 5 },

    // Iced Lemon Tea
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Teh"], amount: 10 },
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Air"], amount: 5 },
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Es Batu"], amount: 5 },
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Garam"], amount: 5 },

    // Iced Chocolate
    { recipeId: recipeMap["Iced Chocolate"], stockId: stockMap["Coklat"], amount: 5 },
    { recipeId: recipeMap["Iced Chocolate"], stockId: stockMap["Es Batu"], amount: 5 },
    { recipeId: recipeMap["Iced Chocolate"], stockId: stockMap["Air"], amount: 5 },

    // Strawberry Infused Water
    { recipeId: recipeMap["Strawberry Infused Water"], stockId: stockMap["Strawberry"], amount: 5 },
    { recipeId: recipeMap["Strawberry Infused Water"], stockId: stockMap["Air"], amount: 2 },
    { recipeId: recipeMap["Strawberry Infused Water"], stockId: stockMap["Es Batu"], amount: 5 }

  ],
  skipDuplicates: true
});

  console.log("🔥 SEEDING SELESAI 🔥");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
