// Обязательные регионы из твоего списка:
/*
const REGIONS = [
  { key: "KZ_ALMATY", label: "🇰🇿 Казахстан (Алматы)", tz: "Asia/Almaty" },
  { key: "RU_NOVOSIB", label: "🇷🇺 Новосибирск", tz: "Asia/Novosibirsk" },
  { key: "TR_IST", label: "🇹🇷 Турция (Стамбул)", tz: "Europe/Istanbul" },
  { key: "HK", label: "🇭🇰 Гонконг", tz: "Asia/Hong_Kong" },
  { key: "PL_WAR", label: "🇵🇱 Польша (Варшава)", tz: "Europe/Warsaw" },
];
*/

const REGIONS = [
  {
    key: "KZ_ALMATY",
    label: "🇰🇿 Казахстан (Алматы)",
    name: "KAZAKHSTAN",
    tz: "Asia/Almaty",
  },
  {
    key: "RU_NOVOSIB",
    label: "🇷🇺 Новосибирск",
    name: "NOVOSIBIRSK",
    tz: "Asia/Novosibirsk",
  },
  {
    key: "TR_IST",
    label: "🇹🇷 Турция (Стамбул)",
    name: "TURKEY",
    tz: "Europe/Istanbul",
  },
  { key: "HK", label: "🇭🇰 Гонконг", name: "HONG KONG", tz: "Asia/Hong_Kong" },
  {
    key: "PL_WAR",
    label: "🇵🇱 Польша (Варшава)",
    name: "POLAND",
    tz: "Europe/Warsaw",
  },
];

// Доп. варианты для удобства выбора пользователем (можешь удалить/добавить):
const USER_TZ_CHOICES = [
  ...REGIONS,
  { key: "KZ_ASTANA", label: "🇰🇿 Казахстан (Астана)", tz: "Asia/Almaty" }, // в Intl часто так
  { key: "RU_MSK", label: "🇷🇺 Москва", tz: "Europe/Moscow" },
  { key: "UA_KYIV", label: "🇺🇦 Киев", tz: "Europe/Kyiv" },
  { key: "DE_BER", label: "🇩🇪 Берлин", tz: "Europe/Berlin" },
  { key: "US_NY", label: "🇺🇸 Нью-Йорк", tz: "America/New_York" },
];

module.exports = { REGIONS, USER_TZ_CHOICES };
