/* ============================================
   get.js — QuoteFlow quotation form logic
   ============================================ */

const API = "";
let allServices = [];
let selectedServices = {}; // { serviceId: serviceObject }

/* ── Load services from backend ── */
async function loadServices() {
    try {
        const res = await fetch(`${API}/services`);
        allServices = await res.json();
        renderServices();
    } catch (err) {
        document.getElementById("services-container").innerHTML =
            `<div style="color:#dc2626;padding:20px;">⚠️ Failed to load services. Make sure the server is running.</div>`;
    }
}

/* ── Render service cards ── */
function renderServices() {
    const container = document.getElementById("services-container");
    if (!allServices.length) {
        container.innerHTML = `<div style="color:#6b7280;padding:20px;">No services available. <a href="${API}/add-services">Click here</a> to seed default services.</div>`;
        return;
    }

    const grid = document.createElement("div");
    grid.className = "services-grid";

    allServices.forEach(service => {
        const card = document.createElement("div");
        card.className = "service-card";
        card.dataset.id = service._id;
        card.innerHTML = `
      <input type="checkbox" id="chk-${service._id}" data-id="${service._id}">
      <span class="svc-cat">${service.category || "General"}</span>
      <div class="svc-name">${service.name}</div>
      <div class="svc-desc">${service.description || ""}</div>
      <div class="svc-price">₹${Number(service.price).toLocaleString("en-IN")}</div>
    `;
        card.addEventListener("click", () => toggleService(service, card));
        grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
}

/* ── Toggle service selection ── */
function toggleService(service, card) {
    const chk = card.querySelector("input[type=checkbox]");
    if (selectedServices[service._id]) {
        delete selectedServices[service._id];
        card.classList.remove("selected");
        chk.checked = false;
    } else {
        selectedServices[service._id] = { ...service, quantity: 1 };
        card.classList.add("selected");
        chk.checked = true;
    }
    updateTotals();
}

/* ── Update totals live ── */
function updateTotals() {
    const subtotal = Object.values(selectedServices)
        .reduce((sum, s) => sum + s.price * (s.quantity || 1), 0);
    const applyGst = document.getElementById("applyGst").checked;
    const gst = applyGst ? Math.round(subtotal * 0.18) : 0;
    const total = subtotal + gst;

    document.getElementById("subtotalDisplay").textContent = `₹${subtotal.toLocaleString("en-IN")}`;
    document.getElementById("gstDisplay").textContent = `₹${gst.toLocaleString("en-IN")}`;
    document.getElementById("totalDisplay").textContent = `₹${total.toLocaleString("en-IN")}`;
    document.getElementById("gstRow").style.display = applyGst ? "flex" : "none";
}

/* ── GST toggle listener ── */
document.getElementById("applyGst").addEventListener("change", updateTotals);

/* ── Form submission ── */
document.getElementById("quotationForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.style.display = "none";

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const companyName = document.getElementById("companyName").value.trim();
    const applyGst = document.getElementById("applyGst").checked;

    if (!fullName || !email || !phone) {
        errorMsg.textContent = "⚠️ Please fill in all required fields.";
        errorMsg.style.display = "block";
        return;
    }

    const services = Object.values(selectedServices);
    if (services.length === 0) {
        errorMsg.textContent = "⚠️ Please select at least one service.";
        errorMsg.style.display = "block";
        return;
    }

    btn.disabled = true;
    btn.textContent = "⏳ Generating...";

    try {
        const response = await fetch(`${API}/create-quotation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, phone, companyName, services, applyGst })
        });

        const result = await response.json();

        if (result.quotationId) {
            window.location.href = `preview.html?id=${result.quotationId}`;
        } else {
            errorMsg.textContent = result.message || "Something went wrong.";
            errorMsg.style.display = "block";
            btn.disabled = false;
            btn.textContent = "🚀 Generate Quotation";
        }
    } catch (err) {
        errorMsg.textContent = "⚠️ Could not connect to server. Is the backend running?";
        errorMsg.style.display = "block";
        btn.disabled = false;
        btn.textContent = "🚀 Generate Quotation";
    }
});

/* ── Init ── */
loadServices();
