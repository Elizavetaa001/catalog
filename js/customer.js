document.addEventListener("DOMContentLoaded", () => {
  const customerId = getQueryParam("id");
  const customer = getCustomerById(customerId);

  const titleEl   = document.getElementById("customer-title");
  const crumbEl   = document.getElementById("crumb-customer");
  const listEl    = document.getElementById("pump-list");

  if (!customer) {
    titleEl.textContent = "Заказчик не найден";
    listEl.innerHTML = `<div class="empty-results"><div class="empty-title">Заказчик не найден</div></div>`;
    return;
  }

  titleEl.textContent = customer.name;
  crumbEl.textContent = customer.name;
  document.title = `${customer.name} — Каталог насосов`;

  if (customer.pumps.length === 0) {
    listEl.innerHTML = `
      <div class="empty-results" style="grid-column: 1 / -1;">
        <div class="empty-title">Насосы не добавлены</div>
        <div class="empty-text">У этого заказчика пока нет насосов в каталоге.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = customer.pumps.map(pump => {
    // Безопасный подсчет количества позиций
    let totalPositions = 0;
    if (pump.rows) {
      totalPositions = pump.rows.length;
    } else if (pump.tables) {
      pump.tables.forEach(t => totalPositions += t.rows.length);
    }

    return `
      <a class="card" href="pump.html?customer=${encodeURIComponent(customer.id)}&pump=${encodeURIComponent(pump.id)}">
        <h3>${esc(pump.model)}</h3>
        <span class="card-meta">${esc(pump.subtitle || "")}</span>
        <span class="card-meta" style="margin-top: auto; font-size: 0.8rem; color: #9ca3af;">Позиций: ${totalPositions}</span>
      </a>
    `;
  }).join("");
});