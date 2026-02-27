require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");

const db = require("./db");
const { REGIONS, USER_TZ_CHOICES } = require("./config");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function formatTime(tz) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return fmt.format(now);
}

function buildRegionsEmbed() {
  const legend = buildLegend(REGIONS);
  const board = buildAirportBoard(REGIONS, "Asia/Almaty");

  return new EmbedBuilder()
    .setTitle("🛫 Табло времени")
    .setColor(0x206cd9)
    .setDescription(
      `${legend}\n\n` +
        "```text\n" +
        board +
        "\n```" +
        "\nНажми **«Показать моё время»** — пришлю персонально.",
    )
    .setFooter({ text: "Обновляется каждую минуту" })
    .setTimestamp(new Date());
}

async function buildPersonalEmbed(userId) {
  const userTz = await db.getUserTz(userId);

  const lines = REGIONS.map((r) => `**${r.label}** — \`${formatTime(r.tz)}\``);

  if (userTz) {
    lines.unshift(
      `**🙋 Твоё время** — \`${formatTime(userTz)}\` *(tz: ${userTz})*`,
    );
  } else {
    lines.unshift("**🙋 Твоё время** — *(не настроено)* → используй `/settz`");
  }

  return new EmbedBuilder()
    .setTitle("⏱️ Твоё время + регионы")
    .setColor(0x206cd9)
    .setDescription(lines.join("\n"))
    .setTimestamp(new Date());
}

function panelComponents() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("panel_mytime")
      .setLabel("Показать моё время")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("panel_refresh")
      .setLabel("Обновить сейчас")
      .setStyle(ButtonStyle.Secondary),
  );
  return [row];
}

async function refreshPanels() {
  const panels = await db.listPanels();
  for (const p of panels) {
    try {
      const channel = await client.channels.fetch(p.channel_id);
      if (!channel?.isTextBased?.()) continue;

      const msg = await channel.messages.fetch(p.message_id);
      await msg.edit({
        embeds: [buildRegionsEmbed()],
        components: panelComponents(),
      });
    } catch {
      // если сообщение удалили/нет доступа — убираем
      await db.removePanel(p.message_id);
    }
  }
}

// new time like in airport

function padRight(str, len) {
  str = String(str);
  return str.length >= len
    ? str.slice(0, len)
    : str + " ".repeat(len - str.length);
}

function padLeft(str, len) {
  str = String(str);
  return str.length >= len
    ? str.slice(0, len)
    : " ".repeat(len - str.length) + str;
}

function getParts(tz) {
  const now = new Date();
  // Делаем отдельно дату и отдельно время (без секунд)
  const date = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return { date, time };
}

function buildLegend(regions) {
  // Легенда может быть в одну/две строки — тут компактно
  return regions.map((r) => r.label).join("  •  ");
}

function dayShiftBadge(tz, baseTz = "Asia/Almaty") {
  // Показываем (+1д) если дата отличается от базовой (КЗ), чтобы было как “табло”
  const a = new Intl.DateTimeFormat("ru-RU", {
    timeZone: baseTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const b = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (a === b) return "";
  // грубо: если отличается — просто отметим, не вычисляя точное +/- (для табло достаточно)
  return " (+1д)";
}

function buildAirportBoard(regions, baseTzForShift = "Asia/Almaty") {
  // ширины колонок (подгони если нужно)
  const W_REGION = 14;
  const W_DATE = 13;
  const W_TIME = 13;

  const top = `┌${"─".repeat(W_REGION + 2)}┬${"─".repeat(W_DATE + 2)}┬${"─".repeat(W_TIME + 2)}┐`;
  const mid = `├${"─".repeat(W_REGION + 2)}┼${"─".repeat(W_DATE + 2)}┼${"─".repeat(W_TIME + 2)}┤`;
  const bot = `└${"─".repeat(W_REGION + 2)}┴${"─".repeat(W_DATE + 2)}┴${"─".repeat(W_TIME + 2)}┘`;

  const header = `│ ${padRight("Регион", W_REGION)} │ ${padRight("Дата", W_DATE)} │ ${padRight("Время", W_TIME)} │`;

  const rows = regions.map((r) => {
    const { date, time } = getParts(r.tz);
    const shift = dayShiftBadge(r.tz, baseTzForShift);
    const timeCell = padRight(time + shift, W_TIME);

    // Если эмодзи ломают выравнивание — сделай r.label без флага
    const regionCell = padRight(r.name, W_REGION);
    const dateCell = padRight(date.replaceAll(",", ""), W_DATE);

    return `│ ${regionCell} │ ${dateCell} │ ${timeCell} │`;
  });

  return [top, header, mid, ...rows, bot].join("\n");
}

//end

client.once("ready", async () => {
  console.log(`✅ Запущен как ${client.user.tag}`);
  await db.init();

  await refreshPanels();
  setInterval(refreshPanels, 60_000);
});

client.on("interactionCreate", async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "time") {
        const embed = await buildPersonalEmbed(interaction.user.id);
        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (interaction.commandName === "settz") {
        const menu = new StringSelectMenuBuilder()
          .setCustomId("settz_menu")
          .setPlaceholder("Выбери свой часовой пояс")
          .addOptions(
            USER_TZ_CHOICES.slice(0, 25).map((t) => ({
              label: t.label,
              value: t.key, // ✅ уникально
              description: t.tz,
            })),
          );

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
          content:
            "Выбери часовой пояс. После выбора /time будет показывать твоё время.",
          components: [row],
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === "timepanel") {
        const sub = interaction.options.getSubcommand();

        if (sub === "create") {
          // ✅ Ограничение: только администраторы
          const member = interaction.member;
          const isAdmin = member?.permissions?.has(
            PermissionsBitField.Flags.Administrator,
          );

          if (!isAdmin) {
            await interaction.reply({
              content:
                "⛔ Команду `/timepanel create` могут использовать только администраторы.",
              ephemeral: true,
            });
            return;
          }

          const msg = await interaction.channel.send({
            embeds: [buildRegionsEmbed()],
            components: panelComponents(),
          });

          await db.addPanel({
            messageId: msg.id,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            createdBy: interaction.user.id,
          });

          await interaction.reply({
            content: `✅ Панель создана и будет обновляться каждую минуту.\nID сообщения: \`${msg.id}\``,
            ephemeral: true,
          });
          return;
        }

        if (sub === "remove") {
          const messageId = interaction.options.getString("message_id", true);
          await db.removePanel(messageId);
          await interaction.reply({
            content: `🗑️ Удалил панель из списка автообновления: \`${messageId}\``,
            ephemeral: true,
          });
          return;
        }
      }
    }

    // Select menu for settz
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "settz_menu"
    ) {
      const key = interaction.values[0];

      const found = USER_TZ_CHOICES.find((x) => x.key === key);
      if (!found) {
        await interaction.update({
          content: "⚠️ Не нашёл выбранный часовой пояс.",
          components: [],
        });
        return;
      }

      await db.setUserTz(interaction.user.id, found.tz);

      await interaction.update({
        content: `✅ Твой часовой пояс сохранён: \`${found.tz}\`\nТеперь используй \`/time\` или кнопку на панели.`,
        components: [],
      });
      return;
    }

    // Panel buttons
    if (
      interaction.isButton() &&
      (interaction.customId === "panel_mytime" ||
        interaction.customId === "panel_refresh")
    ) {
      if (interaction.customId === "panel_refresh") {
        // обновить публичную панель “прямо сейчас”
        await interaction.update({
          embeds: [buildRegionsEmbed()],
          components: panelComponents(),
        });
        return;
      }

      if (interaction.customId === "panel_mytime") {
        const embed = await buildPersonalEmbed(interaction.user.id);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
    }
  } catch (e) {
    console.error(e);
    if (interaction.isRepliable()) {
      const msg = "⚠️ Произошла ошибка. Проверь логи и права бота.";
      if (interaction.deferred || interaction.replied)
        await interaction.followUp({ content: msg, ephemeral: true });
      else await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
