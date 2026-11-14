import { initAuthListener } from "./auth.js";
import {
    subscribeMovements,
    subscribeProjects,
    addMovement,
    updateMovement,
    removeMovement,
    addProject,
    removeProject
} from "./db.js";

let projects = [];
let movements = [];
let unsubMovs = null;
let unsubProjs = null;

// Formato de moneda MXN
const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(amount);
};

// Navegación entre pestañas
document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));

        btn.classList.add("active");
        const targetView = btn.getAttribute("data-view");
        document.getElementById(`view-${targetView}`).classList.add("active");
    });
});

// Poblar selectores de proyectos
function populateProjectSelects() {
    const selects = [
        document.getElementById("dashProjectFilter"),
        document.getElementById("movProject"),
        document.getElementById("filterProject")
    ];

    selects.forEach((select, idx) => {
        const currentVal = select.value;
        select.innerHTML = idx !== 1 ? '<option value="ALL">Todos los proyectos</option>' : "";

        if (projects.length === 0 && idx === 1) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "-- Crea primero un proyecto --";
            select.appendChild(opt);
        }

        projects.forEach((proj) => {
            const opt = document.createElement("option");
            opt.value = proj.name;
            opt.textContent = proj.name;
            select.appendChild(opt);
        });

        if (projects.some((p) => p.name === currentVal) || currentVal === "ALL") {
            select.value = currentVal;
        }
    });
}

// Calcular totales contables
function calculateTotals(filteredMovements) {
    let recibido = 0;
    let comprasBrutas = 0;
    let devoluciones = 0;

    filteredMovements.forEach((m) => {
        const val = parseFloat(m.amount) || 0;
        if (m.type === "ingreso") recibido += val;
        if (m.type === "gasto") comprasBrutas += val;
        if (m.type === "devolucion") devoluciones += val;
    });

    const gastoNeto = comprasBrutas - devoluciones;
    const saldo = recibido - gastoNeto;

    return { recibido, gastoNeto, saldo };
}

// Renderizar Dashboard
function renderDashboard() {
    const selectedProj = document.getElementById("dashProjectFilter").value;
    const filtered =
        selectedProj === "ALL"
            ? movements
            : movements.filter((m) => m.project === selectedProj);

    const { recibido, gastoNeto, saldo } = calculateTotals(filtered);

    document.getElementById("kpi-recibido").textContent = formatMoney(recibido);
    document.getElementById("kpi-gasto").textContent = formatMoney(gastoNeto);

    const saldoEl = document.getElementById("kpi-saldo");
    const notaEl = document.getElementById("kpi-saldo-nota");
    saldoEl.textContent = formatMoney(saldo);

    if (saldo < 0) {
        saldoEl.className = "kpi-value text-red";
        notaEl.textContent = "Saldo en contra (se puso dinero extra)";
    } else {
        saldoEl.className = "kpi-value text-green";
        notaEl.textContent = "Efectivo / cuenta por comprobar";
    }

    // Tarjetas por cada proyecto
    const grid = document.getElementById("projectsSummaryGrid");
    grid.innerHTML = "";

    if (projects.length === 0) {
        grid.innerHTML = '<p class="muted">Ve a la pestaña "Proyectos" para agregar tu primer proyecto.</p>';
        return;
    }

    projects.forEach((proj) => {
        const projMovs = movements.filter((m) => m.project === proj.name);
        const stats = calculateTotals(projMovs);

        const card = document.createElement("div");
        card.className = "proj-stat-card";
        card.innerHTML = `
      <h4>${proj.name}</h4>
      <div class="stat-row"><span>Recibido:</span> <strong>${formatMoney(stats.recibido)}</strong></div>
      <div class="stat-row"><span>Gasto neto:</span> <strong>${formatMoney(stats.gastoNeto)}</strong></div>
      <div class="stat-row"><span>Saldo disponible:</span> <strong class="${stats.saldo < 0 ? "text-red" : "text-green"
            }">${formatMoney(stats.saldo)}</strong></div>
    `;
        grid.appendChild(card);
    });
}

// Renderizar Tabla de Historial
function renderHistory() {
    const projFilter = document.getElementById("filterProject").value;
    const typeFilter = document.getElementById("filterType").value;
    const searchFilter = document.getElementById("filterSearch").value.toLowerCase();

    const filtered = movements
        .filter((m) => projFilter === "ALL" || m.project === projFilter)
        .filter((m) => typeFilter === "ALL" || m.type === typeFilter)
        .filter(
            (m) =>
                m.concept.toLowerCase().includes(searchFilter) ||
                (m.person && m.person.toLowerCase().includes(searchFilter))
        );

    const tbody = document.getElementById("movementsTableBody");
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="9" class="text-center muted">No hay movimientos registrados con estos filtros.</td></tr>';
        return;
    }

    const typeLabels = {
        ingreso: { text: "Fondo (+)", cls: "pill-ingreso", sign: "+" },
        gasto: { text: "Compra (-)", cls: "pill-gasto", sign: "-" },
        devolucion: { text: "Devolución (+)", cls: "pill-devolucion", sign: "+" }
    };

    filtered.forEach((m) => {
        const meta = typeLabels[m.type];
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${m.date}</td>
      <td><strong>${m.project}</strong></td>
      <td><span class="pill ${meta.cls}">${meta.text}</span></td>
      <td>${m.concept}</td>
      <td>${m.person || "-"}</td>
      <td>${m.method}</td>
      <td class="text-right"><strong>${meta.sign}${formatMoney(m.amount)}</strong></td>
      <td class="text-center">
        ${m.driveUrl
                ? `<a href="${m.driveUrl}" target="_blank" rel="noopener" class="drive-link">Ver Ticket ↗</a>`
                : '<span class="muted">Sin archivo</span>'
            }
      </td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline btn-edit" data-id="${m.id}">Editar</button>
        <button class="btn btn-sm btn-danger btn-del" data-id="${m.id}">X</button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // Eventos de botones Editar y Eliminar
    tbody.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", () => startEditMovement(btn.dataset.id));
    });

    tbody.querySelectorAll(".btn-del").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (confirm("¿Seguro que quieres eliminar este registro?")) {
                await removeMovement(btn.dataset.id);
            }
        });
    });
}

// Renderizar Lista de Proyectos
function renderProjectsList() {
    const list = document.getElementById("projectList");
    list.innerHTML = "";

    projects.forEach((proj) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <span><strong>${proj.name}</strong></span>
      <button class="btn btn-sm btn-danger" data-id="${proj.id}" data-name="${proj.name}">Eliminar</button>
    `;
        li.querySelector("button").addEventListener("click", async () => {
            const hasMovs = movements.some((m) => m.project === proj.name);
            if (hasMovs) {
                alert("No puedes eliminar un proyecto que ya tiene movimientos registrados.");
                return;
            }
            if (confirm(`¿Eliminar el proyecto "${proj.name}"?`)) {
                await removeProject(proj.id);
            }
        });
        list.appendChild(li);
    });
}

// Guardar o Actualizar Movimiento
document.getElementById("movementForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const projectVal = document.getElementById("movProject").value;
    if (!projectVal) {
        alert("Primero crea un proyecto en la pestaña 'Proyectos'.");
        return;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";

    const editId = document.getElementById("editId").value;
    const movementObj = {
        project: projectVal,
        type: document.getElementById("movType").value,
        date: document.getElementById("movDate").value,
        amount: parseFloat(document.getElementById("movAmount").value),
        method: document.getElementById("movMethod").value,
        person: document.getElementById("movPerson").value.trim(),
        concept: document.getElementById("movConcept").value.trim(),
        driveUrl: document.getElementById("movDriveUrl").value.trim()
    };

    try {
        if (editId) {
            await updateMovement(editId, movementObj);
        } else {
            await addMovement(movementObj);
        }
        resetForm();
        document.querySelector('[data-view="historial"]').click();
    } catch (err) {
        alert("Error al guardar en la base de datos: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar Movimiento";
    }
});

function startEditMovement(id) {
    const m = movements.find((item) => item.id === id);
    if (!m) return;

    document.getElementById("editId").value = m.id;
    document.getElementById("movProject").value = m.project;
    document.getElementById("movType").value = m.type;
    document.getElementById("movDate").value = m.date;
    document.getElementById("movAmount").value = m.amount;
    document.getElementById("movMethod").value = m.method;
    document.getElementById("movPerson").value = m.person || "";
    document.getElementById("movConcept").value = m.concept;
    document.getElementById("movDriveUrl").value = m.driveUrl || "";

    document.getElementById("formTitle").textContent = "Editar Movimiento";
    document.getElementById("submitBtn").textContent = "Actualizar Movimiento";
    document.getElementById("cancelEditBtn").classList.remove("hidden");

    document.querySelector('[data-view="registrar"]').click();
}

function resetForm() {
    document.getElementById("movementForm").reset();
    document.getElementById("editId").value = "";
    document.getElementById("movDate").valueAsDate = new Date();
    document.getElementById("formTitle").textContent = "Registrar Nuevo Movimiento";
    document.getElementById("submitBtn").textContent = "Guardar Movimiento";
    document.getElementById("cancelEditBtn").classList.add("hidden");
}

document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

// Agregar Proyecto
// Agregar Proyecto
document.getElementById("projectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("newProjectName");
    const name = input.value.trim();
    if (!name) return;

    if (projects.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        alert("Ese proyecto ya existe.");
        return;
    }

    try {
        await addProject(name);
        input.value = "";
    } catch (err) {
        alert("Error al guardar proyecto en Firebase: " + err.message);
    }
});

// Exportar a Excel (CSV)
document.getElementById("exportCsvBtn").addEventListener("click", () => {
    if (movements.length === 0) {
        alert("No hay movimientos para exportar.");
        return;
    }
    const headers = ["Fecha", "Proyecto", "Tipo", "Concepto", "Responsable", "Metodo", "Monto", "Link_Drive"];
    const rows = movements.map((m) => [
        m.date,
        `"${m.project}"`,
        m.type,
        `"${m.concept.replace(/"/g, '""')}"`,
        `"${(m.person || "").replace(/"/g, '""')}"`,
        m.method,
        m.type === "gasto" ? -m.amount : m.amount,
        `"${m.driveUrl || ""}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `control_gastos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
});

// Listeners de filtros
document.getElementById("dashProjectFilter").addEventListener("change", renderDashboard);
document.getElementById("filterProject").addEventListener("change", renderHistory);
document.getElementById("filterType").addEventListener("change", renderHistory);
document.getElementById("filterSearch").addEventListener("input", renderHistory);

function renderAll() {
    populateProjectSelects();
    renderDashboard();
    renderHistory();
    renderProjectsList();
}

// Arrancar la aplicación solo cuando el usuario inicie sesión
initAuthListener((user) => {
    document.getElementById("movDate").valueAsDate = new Date();

    if (unsubProjs) unsubProjs();
    if (unsubMovs) unsubMovs();

    unsubProjs = subscribeProjects((data) => {
        projects = data;
        renderAll();
    });

    unsubMovs = subscribeMovements((data) => {
        movements = data;
        renderAll();
    });
});