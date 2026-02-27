require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("time")
    .setDescription("Показать время по регионам + твоё время (если настроено)"),

  new SlashCommandBuilder()
    .setName("settz")
    .setDescription("Установить твой часовой пояс (для /time)"),

  new SlashCommandBuilder()
    .setName("timepanel")
    .setDescription("Панель времени (обновляется каждую минуту)")
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Создать панель (только для администраторов)"),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Удалить панель по ID сообщения")
        .addStringOption((o) =>
          o
            .setName("message_id")
            .setDescription("ID сообщения панели")
            .setRequired(true),
        ),
    ),
].map((c) => c.toJSON());

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const scope = (process.env.COMMAND_SCOPE || "guild").toLowerCase();
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    console.error("Нужны DISCORD_TOKEN и CLIENT_ID в .env");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(token);

  if (scope === "global") {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅ Команды зарегистрированы GLOBAL.");
  } else {
    if (!guildId) {
      console.error("Для COMMAND_SCOPE=guild нужен GUILD_ID");
      process.exit(1);
    }
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log("✅ Команды зарегистрированы GUILD.");
  }
}

main().catch(console.error);
