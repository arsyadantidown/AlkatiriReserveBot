require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

async function sendLog(message) {
  try {
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;
    await logChannel.send({ embeds: [message] });
  } catch (err) {
    console.error("Log error:", err);
  }
}

async function generateStockMessage() {
  const stocks = await prisma.stock.findMany({
    orderBy: { name: "asc" }
  });

  if (stocks.length === 0) return "Stock kosong.";

let message = "```\n";
message += "STOCK BAHAN SAAT INI\n\n";
message += "Nama           | Qty        | Harga     | Status\n";
message += "------------------------------------------------\n";

stocks.forEach(s => {

  const percent = s.maxStock > 0 
    ? s.quantity / s.maxStock 
    : 0;

  let indicator;
  if (s.quantity === 0) indicator = "🟢";
  else if (percent < 0.5) indicator = "🟡";
  else indicator = "🔴";

  const nameFormatted =
    s.name.charAt(0).toUpperCase() +
    s.name.slice(1);

  const nameCol = nameFormatted.padEnd(15, " ");
  const qtyCol = `${s.quantity}/${s.maxStock}`.padEnd(10, " ");
  const priceCol = (s.price ? `Rp${s.price}` : "-").padEnd(10, " ");

  message += `${nameCol} | ${qtyCol} | ${priceCol} | ${indicator}\n`;
});

message += "```";

  return message;
}

const commands = [

  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Daftarkan nama in-game")
    .addStringOption(option =>
      option.setName("nama")
        .setDescription("Nama in-game")
        .setRequired(true)
    ),

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
          { name: "Dinein A", value: "dinein a" },
          { name: "Dinein B", value: "dinein b" },
          { name: "Takeaway A", value: "takeaway a" },
          { name: "Takeaway B", value: "takeaway b" },
          { name: "Dessert A", value: "dessert a" },
          { name: "Dessert B", value: "dessert b" }
        )
    )
    .addIntegerOption(option =>
      option.setName("jumlah")
        .setDescription("Jumlah paket")
        .setRequired(true)
    ),

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
    .setDescription("Beli bahan (multi: ayam=10, nasi=5)")
    .addStringOption(option =>
      option.setName("bahan")
        .setDescription("Format: ayam=10, nasi=5")
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

const paketMapping = {
  "dinein a": ["Creamy Mushroom Pasta", "Sparkling Water A"],
  "dinein b": ["Pepper Crusted Portobello Steak", "Sparkling Water B"],
  "takeaway a": ["Butter Chicken Rice", "Jasmine Tea"],
  "takeaway b": ["Chicken Cordon Blue", "Iced Lemon Tea"],
  "dessert a": ["Tiramisu", "Iced Chocolate"],
  "dessert b": ["Cheese Quiche", "Triple Berry Soda"]
};

async function sendStockToChannel() {
  const channel = await client.channels.fetch(process.env.STOCK_CHANNEL_ID);
  const stockMessage = await generateStockMessage();

  await channel.send(stockMessage);
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  const player = await prisma.player.findUnique({
    where: { userId }
  });

  const username = player
    ? player.ingameName
    : interaction.user.tag;

  try {

    if (interaction.commandName === "register") {

      const nama = interaction.options.getString("nama");

      await prisma.player.upsert({
        where: { userId },
        update: { ingameName: nama },
        create: { userId, ingameName: nama }
      });

      return interaction.reply({
        content: `✅ Nama in-game diset ke ${nama}`,
        ephemeral: true
      });
    }
  
    if (interaction.commandName === "duty_start") {

      if (!player)
        return interaction.reply({ content: "Register dulu pakai /register", ephemeral: true });

      const active = await prisma.dutySession.findFirst({
        where: { userId, endTime: null }
      });

      if (active)
        return interaction.reply({ content: "Kamu masih duty!", ephemeral: true });

      await prisma.dutySession.create({
        data: { userId, startTime: new Date() }
      });

      await interaction.reply("Duty dimulai!");

      const embed = new EmbedBuilder()
        .setTitle("🟢 DUTY START")
        .addFields({ name: "User", value: username })
        .setTimestamp()
        .setColor("Green");

      await sendLog(embed);
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

      await interaction.reply(`Duty selesai. Total: ${duration} menit.`);

      const embed = new EmbedBuilder()
        .setTitle("🔴 DUTY END")
        .addFields(
          { name: "User", value: username },
          { name: "Durasi", value: `${duration} menit` }
        )
        .setTimestamp()
        .setColor("Red");

      await sendLog(embed);
    }

    if (interaction.commandName === "masak") {

      const menuName = interaction.options.getString("menu");
      const jumlahInput = interaction.options.getInteger("jumlah");

      const menuList = paketMapping[menuName];
      if (!menuList)
        return interaction.reply({ content: "Menu tidak valid.", ephemeral: true });

      const recipes = [];

      for (const menu of menuList) {
      const recipe = await prisma.recipe.findFirst({
        where: {
          name: {
            equals: menu,
            mode: "insensitive"
          }
        },
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

      let foodUsage = {};
      let drinkUsage = {};

      await prisma.$transaction(async tx => {

        for (const recipe of recipes) {
          for (const item of recipe.ingredients) {

            const needed = item.amount * jumlahInput;

            await tx.stock.update({
              where: { id: item.stockId },
              data: { quantity: { decrement: needed } }
            });

            if (recipe.category === "food") {
              if (!foodUsage[item.stock.name]) foodUsage[item.stock.name] = 0;
              foodUsage[item.stock.name] += needed;
            }

            if (recipe.category === "drink") {
              if (!drinkUsage[item.stock.name]) drinkUsage[item.stock.name] = 0;
              drinkUsage[item.stock.name] += needed;
            }
          }
        }

      });

      const isiPaket = menuList.map(menu => `• ${menu}`).join("\n");

    let foodText = "";
    let drinkText = "";

    for (const [name, qty] of Object.entries(foodUsage)) {
      foodText += `• ${name} : ${qty}\n`;
    }

    for (const [name, qty] of Object.entries(drinkUsage)) {
      drinkText += `• ${name} : ${qty}\n`;
    }

    if (!foodText) foodText = "-";
    if (!drinkText) drinkText = "-";

    await interaction.reply(
      `🔥 **BERHASIL MASAK** 🔥\n\n` +
      `📦 Paket : ${menuName}\n` +
      `📋 **Isi Paket:**\n${isiPaket}\n\n` +
      `🍽 Jumlah : ${jumlahInput}x\n\n` +
      `🍗 **Bahan Makanan Terpakai:**\n${foodText}\n` +
      `🥤 **Bahan Minuman Terpakai:**\n${drinkText}`
    );

      const embed = new EmbedBuilder()
        .setTitle("🍳 MASAK")
        .addFields(
          { name: "User", value: username },
          { name: "Paket", value: menuName },
          { name: "Jumlah", value: `${jumlahInput}x` }
        )
        .setTimestamp()
        .setColor("Blue");

      await sendLog(embed);
      await sendStockToChannel();
    }

if (interaction.commandName === "stock_update") {

  const bahanInput = interaction.options.getString("bahan");
  const action = interaction.options.getString("action");
  const jumlah = interaction.options.getInteger("jumlah");

  if (!bahanInput || !action || jumlah === null) {
    return interaction.reply({
      content: "Parameter tidak lengkap.",
      ephemeral: true
    });
  }

  const stock = await prisma.stock.findFirst({
    where: {
      name: {
        equals: bahanInput,
        mode: "insensitive"
      }
    }
  });

  if (!stock) {
    return interaction.reply({
      content: "Bahan tidak ditemukan.",
      ephemeral: true
    });
  }

  let newQty = stock.quantity;

  if (action === "add") newQty += jumlah;
  if (action === "remove") newQty -= jumlah;
  if (action === "set") newQty = jumlah;

  if (newQty < 0) {
    return interaction.reply({
      content: "Stock tidak boleh minus.",
      ephemeral: true
    });
  }

  await prisma.stock.update({
    where: { id: stock.id },
    data: { quantity: newQty }
  });

  await interaction.reply(
    `📦 Stock **${stock.name}** sekarang: ${newQty}`
  );

  const username = interaction.user.username;

  const embed = new EmbedBuilder()
    .setTitle("📦 STOCK UPDATE")
    .addFields(
      { name: "User", value: username },
      { name: "Bahan", value: stock.name },
      { name: "Action", value: action },
      { name: "Jumlah", value: `${jumlah}` },
      { name: "Stock Sekarang", value: `${newQty}` }
    )
    .setTimestamp()
    .setColor("Orange");

  await sendLog(embed);
  await sendStockToChannel();
}

if (interaction.commandName === "belanja") {

  const bahanInput = interaction.options.getString("bahan");
  const deskripsi = interaction.options.getString("deskripsi") || "-";

  const items = bahanInput.split(",").map(i => i.trim());

  let resultText = "";
  let totalHargaSemua = 0;

  for (const item of items) {
    const [nama, qtyStr] = item.split("=");

    const jumlah = parseInt(qtyStr);
    if (!nama || isNaN(jumlah)) {
      return interaction.reply({
        content: `Format salah di: ${item}`,
        ephemeral: true
      });
    }

    const stock = await prisma.stock.findFirst({
      where: {
        name: {
          equals: nama,
          mode: "insensitive"
        }
      }
    });

    if (!stock) {
      return interaction.reply({
        content: `Bahan ${nama} tidak ditemukan.`,
        ephemeral: true
      });
    }

    const hargaPerPcs = stock.price;
    const totalHarga = hargaPerPcs * jumlah;
    const newQuantity = stock.quantity + jumlah;

    await prisma.stock.update({
      where: { id: stock.id },
      data: { quantity: newQuantity }
    });

    totalHargaSemua += totalHarga;

    resultText +=
      `📦 ${stock.name} (+${jumlah})\n` +
      `💰 ${hargaPerPcs} x ${jumlah} = ${totalHarga}\n\n`;
  }

  await interaction.reply(
    `🛒 **BELANJA BERHASIL**\n\n` +
    resultText +
    `💵 TOTAL SEMUA: ${totalHargaSemua}\n\n` +
    `📝 Deskripsi: ${deskripsi}`
  );

  const embed = new EmbedBuilder()
    .setTitle("🛒 BELANJA")
    .addFields(
      { name: "User", value: username },
      { name: "Total", value: `${totalHargaSemua}` }
    )
    .setTimestamp()
    .setColor("Purple");

  await sendLog(embed);
  await sendStockToChannel();
}

} catch (err) {
  console.error(err);
  if (!interaction.replied)
    return interaction.reply({ content: "Terjadi error.", ephemeral: true });
}
});
client.login(process.env.DISCORD_TOKEN);
