require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [

  new SlashCommandBuilder()
    .setName("duty_start")
    .setDescription("Mulai duty"),

  new SlashCommandBuilder()
    .setName("duty_end")
    .setDescription("Selesai duty"),

  new SlashCommandBuilder()
    .setName("masak")
    .setDescription("Masak menu atau paket")
    .addStringOption(option =>
      option.setName("menu")
        .setDescription("Pilih menu atau paket")
        .setRequired(true)
        .addChoices(
          { name: "Paket A", value: "paket a" },
          { name: "Paket B", value: "paket b" },
          { name: "Paket C", value: "paket c" },
          { name: "Paket D", value: "paket d" },
          { name: "Paket Dessert A", value: "paket dessert a" },
          { name: "Paket Dessert B", value: "paket dessert b" }
        )
    )
    .addIntegerOption(option =>
      option.setName("jumlah")
        .setDescription("Jumlah paket")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("stock_view")
    .setDescription("Lihat stock bahan"),

  new SlashCommandBuilder()
    .setName("stock_update")
    .setDescription("Update stock bahan")
    .addStringOption(option =>
      option.setName("bahan")
        .setDescription("Nama bahan")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("action")
        .setDescription("add | remove | set")
        .setRequired(true)
        .addChoices(
          { name: "add", value: "add" },
          { name: "remove", value: "remove" },
          { name: "set", value: "set" }
        )
    )
    .addIntegerOption(option =>
      option.setName("jumlah")
        .setDescription("Jumlah")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("belanja")
    .setDescription("Beli bahan dan tambah stock")
    .addStringOption(option =>
      option.setName("bahan")
        .setDescription("Nama bahan")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("jumlah")
        .setDescription("Jumlah beli")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("deskripsi")
        .setDescription("Deskripsi pembelian (opsional)")
        .setRequired(false)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
  console.log("Slash commands registered.");
})();

const hargaBahan = {
  "tepung": 350,
  "beras": 300,
  "teh": 350,
  "gula": 300,
  "susu": 250,
  "garam": 300,
  "ayam kemasan": 250,
  "daging": 300,
  "coklat": 350,
  "strawberry": 350,
  "soda": 300,
  "air": 300,
  "es batu": 300,
  "cabai": 300
};

const paketMapping = {
  "paket a": ["Creamy Mushroom Pasta", "Sparkling Water"],
  "paket b": ["Butter Chicken Rice", "Jasmine Tea"],
  "paket c": ["Roasted Chicken Provencale", "Sparkling Water"],
  "paket d": ["Chicken Cordon Blue", "Iced Lemon Tea"],
  "paket dessert a": ["Tiramisu", "Iced Chocolate"],
  "paket dessert b": ["Cheese Quiche", "Strawberry Infused Water"]
};

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  try {

    if (interaction.commandName === "duty_start") {

      const active = await prisma.dutySession.findFirst({
        where: { userId, endTime: null }
      });

      if (active)
        return interaction.reply({ content: "Kamu masih duty!", ephemeral: true });

      await prisma.dutySession.create({
        data: { userId, startTime: new Date() }
      });

      return interaction.reply("Duty dimulai!");
    }

    if (interaction.commandName === "duty_end") {

      const active = await prisma.dutySession.findFirst({
        where: { userId, endTime: null }
      });

      if (!active)
        return interaction.reply({ content: "Kamu belum mulai duty.", ephemeral: true });

      const endTime = new Date();
      const duration = Math.floor((endTime - active.startTime) / 60000);

      await prisma.dutySession.update({
        where: { id: active.id },
        data: { endTime, duration }
      });

      return interaction.reply(`Duty selesai. Total: ${duration} menit.`);
    }

    if (interaction.commandName === "masak") {

      const menuName = interaction.options.getString("menu");
      const jumlahInput = interaction.options.getInteger("jumlah");

      const menuList = paketMapping[menuName];
      if (!menuList)
        return interaction.reply({ content: "Menu tidak valid.", ephemeral: true });

      const recipes = [];

      for (const menu of menuList) {
        const recipe = await prisma.recipe.findUnique({
          where: { name: menu },
          include: { ingredients: { include: { stock: true } } }
        });

        if (!recipe)
          return interaction.reply({ content: `Menu ${menu} tidak ditemukan.`, ephemeral: true });

        recipes.push(recipe);
      }

      for (const recipe of recipes) {
        for (const item of recipe.ingredients) {

          const needed = item.amount * jumlahInput;

          if (item.stock.quantity < needed)
            return interaction.reply({
              content: `Stock ${item.stock.name} tidak cukup.\nButuh ${needed}, tersedia ${item.stock.quantity}`,
              ephemeral: true
            });
        }
      }

      let stockUsage = {};

      await prisma.$transaction(async tx => {

        for (const recipe of recipes) {
          for (const item of recipe.ingredients) {

            const needed = item.amount * jumlahInput;

            await tx.stock.update({
              where: { id: item.stockId },
              data: { quantity: { decrement: needed } }
            });

            if (!stockUsage[item.stock.name]) {
              stockUsage[item.stock.name] = 0;
            }

            stockUsage[item.stock.name] += needed;
          }
        }

      });

      const usageText = Object.entries(stockUsage)
        .map(([name, qty]) => `• ${name} -${qty}`)
        .join("\n");

      return interaction.reply(
        `🔥 **BERHASIL MASAK** 🔥\n\n` +
        `📦 Paket : ${menuName}\n` +
        `🍽 Jumlah : ${jumlahInput}x\n\n` +
        `📉 **Stock Berkurang:**\n${usageText}`
      );
    }

    if (interaction.commandName === "stock_view") {

      const stocks = await prisma.stock.findMany({
        orderBy: { name: "asc" }
      });

      if (stocks.length === 0)
        return interaction.reply("Belum ada stock.");

      const longestName = Math.max(...stocks.map(s => s.name.length));

      let message = "STOCK BAHAN\n\n";

      stocks.forEach(s => {
        const status = s.quantity >= s.maxStock ? "🟥" : "🟩";
        const name = s.name.padEnd(longestName, " ");
        message += `${name} | ${s.quantity}/${s.maxStock} ${status}\n`;
      });

      return interaction.reply(`\`\`\`\n${message}\`\`\``);
    }

    if (interaction.commandName === "stock_update") {

      const bahan = interaction.options.getString("bahan");
      const action = interaction.options.getString("action");
      const jumlah = interaction.options.getInteger("jumlah");

      const stock = await prisma.stock.findFirst({
        where: { name: { equals: bahan, mode: "insensitive" } }
      });

      if (!stock)
        return interaction.reply({ content: "Bahan tidak ditemukan.", ephemeral: true });

      let newQuantity = stock.quantity;

      if (action === "add") newQuantity += jumlah;
      if (action === "remove") newQuantity = Math.max(0, newQuantity - jumlah);
      if (action === "set") newQuantity = Math.max(0, jumlah);

      await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity }
      });

      return interaction.reply(`Stock ${stock.name} sekarang ${newQuantity}.`);
    }

    if (interaction.commandName === "belanja") {

      const bahanInput = interaction.options.getString("bahan");
      const jumlah = interaction.options.getInteger("jumlah");
      const deskripsi = interaction.options.getString("deskripsi") || "-";

      const bahanKey = bahanInput.toLowerCase();

      if (!hargaBahan[bahanKey])
        return interaction.reply({ content: "Harga bahan tidak ditemukan.", ephemeral: true });

      const hargaPerPcs = hargaBahan[bahanKey];
      const totalHarga = hargaPerPcs * jumlah;

      const stock = await prisma.stock.findFirst({
        where: { name: { equals: bahanInput, mode: "insensitive" } }
      });

      if (!stock)
        return interaction.reply({ content: "Bahan tidak ditemukan di database.", ephemeral: true });

      const newQuantity = stock.quantity + jumlah;

      await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity }
      });

      return interaction.reply(
        `🛒 **BELANJA BERHASIL**\n\n` +
        `📦 Bahan      : ${stock.name}\n` +
        `📊 Jumlah     : +${jumlah}\n` +
        `💰 Harga/Pcs  : ${hargaPerPcs}\n` +
        `💵 Total      : ${totalHarga}\n` +
        `📝 Deskripsi  : ${deskripsi}\n\n` +
        `📈 Stock Sekarang : ${newQuantity}`
      );
    }

  } catch (err) {
    console.error(err);
    if (!interaction.replied)
      return interaction.reply({ content: "Terjadi error.", ephemeral: true });
  }

});

client.login(process.env.DISCORD_TOKEN);
