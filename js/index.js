document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("customer-list");
  if (!container) return;

  container.innerHTML = CATALOG_DATA.customers.map(customer => {
    const pumpCount = customer.pumps.length;
    return `
      <a class="card" href="customer.html?id=${encodeURIComponent(customer.id)}">
        <h3>${esc(customer.name)}</h3>
        <span class="card-meta">
          ${pumpCount} ${pluralPumps(pumpCount)}
        </span>
      </a>
    `;
  }).join("");
});