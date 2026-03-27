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
      { name: "Berry", quantity: 1000, maxStock: 2000 },
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
      { name: "Pepper Crusted Portobello Steak", category: "food" },
      { name: "Chicken Cordon Blue", category: "food" },
      { name: "Tiramisu", category: "food" },
      { name: "Cheese Quiche", category: "food" },

      { name: "Sparkling Water A", category: "drink" },
      { name: "Sparkling Water B", category: "drink" },
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
    { recipeId: recipeMap["Creamy Mushroom Pasta"], stockId: stockMap["Tepung"], amount: 5 },
    { recipeId: recipeMap["Creamy Mushroom Pasta"], stockId: stockMap["Susu"], amount: 5 },
    { recipeId: recipeMap["Creamy Mushroom Pasta"], stockId: stockMap["Garam"], amount: 5 },

    // Butter Chicken Rice
    { recipeId: recipeMap["Butter Chicken Rice"], stockId: stockMap["Ayam Kemasan"], amount: 3 },
    { recipeId: recipeMap["Butter Chicken Rice"], stockId: stockMap["Beras"], amount: 6 },
    { recipeId: recipeMap["Butter Chicken Rice"], stockId: stockMap["Garam"], amount: 5 },

    // Pepper Crusted Portobello Steak
    { recipeId: recipeMap["Pepper Crusted Portobello Steak"], stockId: stockMap["Daging"], amount: 4 },
    { recipeId: recipeMap["Pepper Crusted Portobello Steak"], stockId: stockMap["Cabai"], amount: 4 },
    { recipeId: recipeMap["Pepper Crusted Portobello Steak"], stockId: stockMap["Garam"], amount: 4 },

    // Chicken Cordon Blue
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Ayam Kemasan"], amount: 10 },
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Susu"], amount: 5 },
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Beras"], amount: 5 },
    { recipeId: recipeMap["Chicken Cordon Blue"], stockId: stockMap["Cabai"], amount: 5 },

    // Tiramisu
    { recipeId: recipeMap["Tiramisu"], stockId: stockMap["Coklat"], amount: 5 },
    { recipeId: recipeMap["Tiramisu"], stockId: stockMap["Susu"], amount: 3 },

    // Cheese Quiche
    { recipeId: recipeMap["Cheese Quiche"], stockId: stockMap["Susu"], amount: 3 },
    { recipeId: recipeMap["Cheese Quiche"], stockId: stockMap["Garam"], amount: 2 },
    { recipeId: recipeMap["Cheese Quiche"], stockId: stockMap["Daging"], amount: 2 },

    // ================= DRINK =================

    // Sparkling Water A
    { recipeId: recipeMap["Sparkling Water A"], stockId: stockMap["Soda"], amount: 5 },
    { recipeId: recipeMap["Sparkling Water A"], stockId: stockMap["Air"], amount: 4 },
    { recipeId: recipeMap["Sparkling Water A"], stockId: stockMap["Es Batu"], amount: 4 },

    // Sparkling Water B
    { recipeId: recipeMap["Sparkling Water B"], stockId: stockMap["Soda"], amount: 4 },
    { recipeId: recipeMap["Sparkling Water B"], stockId: stockMap["Air"], amount: 3 },
    { recipeId: recipeMap["Sparkling Water B"], stockId: stockMap["Es Batu"], amount: 3 },    

    // Jasmine Tea
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Teh"], amount: 5 },
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Air"], amount: 5 },
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Es Batu"], amount: 5 },
    { recipeId: recipeMap["Jasmine Tea"], stockId: stockMap["Gula"], amount: 5 },

    // Iced Lemon Tea
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Teh"], amount: 5 },
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Air"], amount: 4 },
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Es Batu"], amount: 4 },
    { recipeId: recipeMap["Iced Lemon Tea"], stockId: stockMap["Garam"], amount: 4 },

    // Iced Chocolate
    { recipeId: recipeMap["Iced Chocolate"], stockId: stockMap["Coklat"], amount: 3 },
    { recipeId: recipeMap["Iced Chocolate"], stockId: stockMap["Es Batu"], amount: 3 },
    { recipeId: recipeMap["Iced Chocolate"], stockId: stockMap["Air"], amount: 4 },

    // Triple Berry Soda
    { recipeId: recipeMap["Triple Berry Soda"], stockId: stockMap["Berry"], amount: 4 },
    { recipeId: recipeMap["Triple Berry Soda"], stockId: stockMap["Air"], amount: 2 },
    { recipeId: recipeMap["Triple Berry Soda"], stockId: stockMap["Es Batu"], amount: 2 }

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
