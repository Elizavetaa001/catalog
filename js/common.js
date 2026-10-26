/**
 * common.js — Общие утилиты для всех страниц.
 */

/** Получить заказчика по id (из data.js) */
function getCustomerById(id) {
  return CATALOG_DATA.customers.find(c => c.id === id) || null;
}

/** Получить насос по id внутри заказчика */
function getPump(customer, pumpId) {
  if (!customer) return null;
  return customer.pumps.find(p => p.id === pumpId) || null;
}

/** Получить параметр из URL: ?id=... */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/** Экранирование HTML (защита от XSS при рендере) */
function esc(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Склонение: 1 насос, 2 насоса, 5 насосов */
function pluralPumps(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "насос";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "насоса";
  return "насосов";
}