document.addEventListener("DOMContentLoaded", () => {
  const customerId = getQueryParam("customer");
  const pumpId     = getQueryParam("pump");

  const customer = getCustomerById(customerId);
  const pump     = getPump(customer, pumpId);

  const tableContainer = document.querySelector(".table-container");
  const searchEl = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");
  const noResultsEl = document.getElementById("no-results");
  const resultsCountEl = document.getElementById("results-count");
  const totalCountEl = document.getElementById("total-count");
  const footerTotalEl = document.getElementById("footer-total");

  if (!customer || !pump) {
    document.querySelector("main").innerHTML = `<div class="empty-results"><div class="empty-title">Насос не найден</div></div>`;
    return;
  }

  // --- ЗАПОЛНЕНИЕ ДАННЫХ И ХЛЕБНЫХ КРОШЕК ---
  document.getElementById("pump-title").textContent = `Насос ${pump.model}`;
  
  const tableModelNameEl = document.getElementById("table-model-name");
  if (tableModelNameEl) tableModelNameEl.textContent = pump.model;
  
  const crumbCustomer = document.getElementById("crumb-customer");
  if (crumbCustomer) {
    crumbCustomer.textContent = customer.name;
    crumbCustomer.href = `customer.html?id=${encodeURIComponent(customer.id)}`;
  }
  
  const crumbPump = document.getElementById("crumb-pump");
  if (crumbPump) crumbPump.textContent = pump.model;

  const docNameEl = document.getElementById("doc-name");
  if (docNameEl) docNameEl.textContent = pump.model;
  
  const docSourceEl = document.getElementById("doc-source");
  if (docSourceEl) docSourceEl.textContent = pump.model;
  const footerSourceEl = document.getElementById("footer-source");
  if (footerSourceEl) footerSourceEl.textContent = pump.model;

  let totalRows = 0;

  // --- ЛОГИКА РЕНДЕРА (Поддержка 1 или нескольких таблиц) ---
  if (pump.tables) {
    tableContainer.innerHTML = ""; 
    pump.tables.forEach((tableData, idx) => {
      totalRows += tableData.rows.length;
      
      const block = document.createElement("div");
      block.className = "sub-table-block";
      
      const title = document.createElement("h3");
      title.className = "sub-table-title";
      title.textContent = tableData.title;
      block.appendChild(title);

      const scrollDiv = document.createElement("div");
      scrollDiv.className = "table-scroll";
      scrollDiv.id = `table-scroll-${idx}`;
      
      const table = document.createElement("table");
      table.className = "parts-table searchable-table";
      table.innerHTML = `<thead></thead><tbody></tbody>`;
      
      scrollDiv.appendChild(table);
      block.appendChild(scrollDiv);
      
      const footer = tableContainer.querySelector(".table-footer");
      if (footer) {
        tableContainer.insertBefore(block, footer);
      } else {
        tableContainer.appendChild(block);
      }
      
      renderSingleTable(tableData, table);
    });
  } else {
    totalRows = pump.rows.length;
    const tableEl = document.getElementById("parts-table");
    renderSingleTable(pump, tableEl);
  }

  resultsCountEl.textContent = totalRows;
  if (totalCountEl) totalCountEl.textContent = totalRows;
  if (footerTotalEl) footerTotalEl.textContent = totalRows;

  initSearch();
  initImageLightbox();
  initTooltips();

  // --- ФУНКЦИЯ РЕНДЕРА ОДНОЙ ТАБЛИЦЫ ---
  function renderSingleTable(tableData, tableEl) {
    const thead = tableEl.querySelector("thead");
    const tbody = tableEl.querySelector("tbody");

    let h1 = ""; 
    let h2 = ""; 
    let processedParents = new Set();

    tableData.columns.forEach((col) => {
      const tipText = col.tooltip || col.parentTooltip;
      const tooltipAttr = tipText ? ` data-tip="${esc(tipText)}"` : "";

      if (col.parent) {
        if (!processedParents.has(col.parent)) {
          processedParents.add(col.parent);
          let span = tableData.columns.filter(c => c.parent === col.parent).length;
          let groupCls = col.groupCls ? ` ${col.groupCls}` : "";
          let groupTooltipAttr = col.parentTooltip ? ` data-tip="${esc(col.parentTooltip)}"` : "";
          h1 += `<th colspan="${span}" class="group-header${groupCls}"${groupTooltipAttr}>${esc(col.parent)}</th>`;
        }
        h2 += `<th class="${col.cls || ''}"${tooltipAttr}>${esc(col.title)}</th>`;
      } else {
        h1 += `<th rowspan="2" class="rowspan-2 ${col.cls || ''}"${tooltipAttr}>${esc(col.title)}</th>`;
      }
    });

    const sections = tableData.sections || [];
    if (sections.length > 0) {
        h1 += `<th rowspan="2" class="gallery-header">СХЕМА</th>`;
    }

    let theadHTML = `<tr>${h1}</tr>`;
    if (h2) theadHTML += `<tr>${h2}</tr>`;
    thead.innerHTML = theadHTML;

    let tbodyHTML = "";

    tableData.rows.forEach((row, idx) => {
      const activeSection = sections.find(s => idx >= s.rowIndex && idx < s.rowIndex + s.rowspan);
      let galleryCell = "";
      let rowCls = "";

      if (activeSection) {
        if (activeSection.rowIndex === idx) {
          rowCls = "section-start";
          
          const imgsHTML = activeSection.images.map(src => 
            `<div class="sticky-img-wrapper" data-section-start="${activeSection.rowIndex}">
               <img src="${esc(src)}" alt="Схема" class="zoomable-img" style="cursor: zoom-in;" onerror="this.parentElement.innerHTML='<div style=\\'padding:20px;text-align:center;color:#9ca3af;\\'>Нет файла<br><small>${esc(src.split('/').pop())}</small></div>';">
             </div>`
          ).join("");
          
          let wrapperClass = "single-image";
          if (activeSection.images.length > 1) {
            wrapperClass = activeSection.vertical ? "multi-image-vertical" : "multi-image-horizontal";
          }

          galleryCell = `
            <td rowspan="${activeSection.rowspan}" class="table-gallery-cell" 
                data-sec-start="${activeSection.rowIndex}" 
                data-sec-end="${activeSection.rowIndex + activeSection.rowspan - 1}">
              <div class="gallery-content ${wrapperClass}">
                ${imgsHTML}
              </div>
            </td>
          `;
        }
      }

      const dataCells = tableData.columns.map(col => {
        const val = row[col.key];
        const cls = col.cls ? ` class="${col.cls}"` : (val === undefined || val === "" ? ' class="empty"' : "");
        return `<td${cls}>${esc(val ?? "")}</td>`;
      }).join("");

      tbodyHTML += `<tr class="${rowCls}" data-row-index="${idx}">${dataCells}${galleryCell}</tr>`;
    });

    // УБИРАЕМ пустые строки
    // Вместо этого добавляем невидимый отступ снизу для картинки
    if (sections.length > 0) {
        tableEl.style.paddingBottom = "300px"; // Отступ, чтобы картинка могла проехать
    }
    
    tbody.innerHTML = tbodyHTML;
    
    const scrollContainer = tableEl.closest('.table-scroll');
    if (scrollContainer) initScrollHighlight(scrollContainer);
  }

  // --- КАСТОМНЫЕ ТУЛТИПЫ ---
  function initTooltips() {
    let tooltipEl = document.getElementById("global-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "global-tooltip";
      tooltipEl.className = "global-tooltip";
      document.body.appendChild(tooltipEl);
    }

    const tips = document.querySelectorAll("th[data-tip]");
    tips.forEach(th => {
      th.addEventListener("mouseenter", () => {
        tooltipEl.textContent = th.getAttribute("data-tip");
        tooltipEl.style.opacity = "1";
        tooltipEl.style.visibility = "visible";
      });
      th.addEventListener("mousemove", (e) => {
        tooltipEl.style.left = (e.pageX + 15) + "px";
        tooltipEl.style.top = (e.pageY + 15) + "px";
      });
      th.addEventListener("mouseleave", () => {
        tooltipEl.style.opacity = "0";
        tooltipEl.style.visibility = "hidden";
      });
    });
  }

  // --- МОДАЛЬНОЕ ОКНО (LIGHTBOX) ---
  function initImageLightbox() {
    const lightbox = document.getElementById("lightbox-modal");
    if (!lightbox) return;
    const lightboxImg = lightbox.querySelector("img");

    document.querySelectorAll(".zoomable-img").forEach(img => {
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        lightboxImg.src = img.src;
        lightbox.classList.add("active");
      });
    });

    lightbox.addEventListener("click", () => {
      lightbox.classList.remove("active");
      setTimeout(() => { lightboxImg.src = ""; }, 200); 
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("active")) {
        lightbox.classList.remove("active");
        setTimeout(() => { lightboxImg.src = ""; }, 200);
      }
    });
  }

  // --- ЗАТЕМНЕНИЕ КАРТИНОК ПРИ СКРОЛЛЕ ---
  function initScrollHighlight(scrollEl) {
    if (!scrollEl) return;
    scrollEl.addEventListener("scroll", () => {
      const wrappers = scrollEl.querySelectorAll(".sticky-img-wrapper");
      const scrollTop = scrollEl.scrollTop;
      const containerCenter = scrollTop + (scrollEl.clientHeight / 2);
      
      let activeSectionStart = -1;
      wrappers.forEach(w => {
        const start = parseInt(w.dataset.sectionStart, 10);
        const cell = w.closest('td');
        if (!cell || cell.style.display === 'none') return;
        
        const cellTop = cell.offsetTop;
        const cellBottom = cellTop + cell.offsetHeight;
        
        if (containerCenter >= cellTop && containerCenter <= cellBottom) {
          activeSectionStart = start;
        }
      });

      wrappers.forEach(w => {
        const start = parseInt(w.dataset.sectionStart, 10);
        if (start === activeSectionStart) {
          w.classList.remove("dimmed");
        } else {
          w.classList.add("dimmed");
        }
      });
    });
    setTimeout(() => scrollEl.dispatchEvent(new Event('scroll')), 100);
  }

  // --- ПОИСК ---
  function initSearch() {
    if (!searchEl) return;

    const performSearch = () => {
      const q = searchEl.value.trim().toLowerCase();
      clearBtn.style.display = q.length > 0 ? "flex" : "none";
      
      let visibleCount = 0;
      
      const tables = document.querySelectorAll(".parts-table");
      
      tables.forEach(table => {
        const galleryCells = table.querySelectorAll(".table-gallery-cell");
        galleryCells.forEach(cell => {
          const startIdx = cell.getAttribute("data-sec-start");
          const tr = table.querySelector(`tr[data-row-index="${startIdx}"]`);
          if (tr && !tr.contains(cell)) {
            tr.appendChild(cell); 
            cell.style.display = ""; 
          }
        });

        const rows = table.querySelectorAll("tbody tr:not(.spacer-row)");
        
        rows.forEach(tr => {
          const text = tr.textContent.toLowerCase();
          if (text.includes(q)) {
            tr.style.display = "";
            visibleCount++;
          } else {
            tr.style.display = "none";
          }
        });

        if (q.length > 0) {
          table.querySelectorAll(".table-gallery-cell").forEach(cell => {
            const secStart = parseInt(cell.getAttribute("data-sec-start"), 10);
            const secEnd = parseInt(cell.getAttribute("data-sec-end"), 10);
            
            const startRow = table.querySelector(`tr[data-row-index="${secStart}"]`);
            
            if (startRow && startRow.style.display === "none") {
              let targetRow = null;
              for (let i = secStart; i <= secEnd; i++) {
                const row = table.querySelector(`tr[data-row-index="${i}"]`);
                if (row && row.style.display !== "none") {
                  targetRow = row;
                  break;
                }
              }
              
              if (targetRow) {
                targetRow.appendChild(cell);
                cell.style.display = "";
              } else {
                cell.style.display = "none";
              }
            }
          });
        }
      });

      resultsCountEl.textContent = q ? visibleCount : totalRows;

      if (q.length > 0 && visibleCount === 0) {
        noResultsEl.style.display = "block";
        document.querySelectorAll(".table-scroll").forEach(el => el.style.display = "none");
      } else {
        noResultsEl.style.display = "none";
        document.querySelectorAll(".table-scroll").forEach(el => el.style.display = "block");
      }

      document.querySelectorAll(".table-scroll").forEach(el => el.dispatchEvent(new Event('scroll')));
    };

    searchEl.addEventListener("input", performSearch);

    const clearSearch = () => {
      searchEl.value = "";
      clearBtn.style.display = "none";
      noResultsEl.style.display = "none";
      document.querySelectorAll(".table-scroll").forEach(el => el.style.display = "block");
      resultsCountEl.textContent = totalRows;
      
      document.querySelectorAll(".parts-table tbody tr").forEach(tr => {
        tr.style.display = "";
      });

      document.querySelectorAll(".parts-table").forEach(table => {
        table.querySelectorAll(".table-gallery-cell").forEach(cell => {
          const startIdx = cell.getAttribute("data-sec-start");
          const tr = table.querySelector(`tr[data-row-index="${startIdx}"]`);
          if (tr && !tr.contains(cell)) {
            tr.appendChild(cell);
          }
          cell.style.display = "";
        });
      });
      
      document.querySelectorAll(".table-scroll").forEach(el => el.dispatchEvent(new Event('scroll')));
    };

    clearBtn.addEventListener("click", clearSearch);
    const btnReset = document.getElementById("btn-reset-search");
    if (btnReset) btnReset.addEventListener("click", clearSearch);
  }
});