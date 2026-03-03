require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");

const Service = require("./models/Service");
const Quotation = require("./models/Quotation");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve frontend as static files
app.use(express.static(path.join(__dirname, "frontend")));

/* ===============================
   ✅ MONGODB CONNECTION
================================= */
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quotationDB";
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error:", err));


/* ===============================
   ✅ HOMEPAGE
================================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


/* ===============================
   ✅ ADD DEFAULT SERVICES (Run Once)
================================= */
app.get("/add-services", async (req, res) => {
  try {
    const count = await Service.countDocuments();
    if (count > 0) return res.send("Services already exist ✅");

    await Service.insertMany([
      { name: "Basic Landing Page", description: "Single page responsive website", price: 8000, category: "Web", isActive: true },
      { name: "Multi-Page Website", description: "Full multi-page website with CMS", price: 12000, category: "Web", isActive: true },
      { name: "Multi-Dashboard Web Application", description: "Complex web app with dashboards", price: 20000, category: "Web", isActive: true },
      { name: "Android Application", description: "Native Android mobile app", price: 45000, category: "Mobile", isActive: true },
      { name: "Cross-Platform Application (Android + iOS)", description: "Flutter/React Native cross-platform app", price: 50000, category: "Mobile", isActive: true },
      { name: "SEO Optimization", description: "Improve search engine ranking", price: 5000, category: "Marketing", isActive: true },
      { name: "UI/UX Design", description: "Modern, user-friendly design system", price: 7000, category: "Design", isActive: true },
      { name: "Website Maintenance", description: "Monthly website maintenance & updates", price: 3000, category: "Support", isActive: true },
      { name: "E-Commerce Website", description: "Online store with payment integration", price: 25000, category: "Web", isActive: true },
      { name: "Domain & Hosting Setup", description: "Domain registration and hosting configuration", price: 2000, category: "Support", isActive: true },
    ]);

    res.send("Default Services Added ✅");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error adding services");
  }
});


/* ===============================
   ✅ GET ACTIVE SERVICES
================================= */
app.get("/services", async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching services" });
  }
});


/* ===============================
   ✅ ADD A SERVICE (Admin)
================================= */
app.post("/services", async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!name || !price) return res.status(400).json({ message: "Name and price are required" });
    const service = new Service({ name, description, price, category, isActive: true });
    await service.save();
    res.json({ message: "Service added ✅", service });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding service" });
  }
});


/* ===============================
   ✅ UPDATE A SERVICE (Admin)
================================= */
app.put("/services/:id", async (req, res) => {
  try {
    const { name, description, price, category, isActive } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, isActive },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service updated ✅", service });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating service" });
  }
});


/* ===============================
   ✅ DELETE A SERVICE (Admin)
================================= */
app.delete("/services/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted ✅" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting service" });
  }
});


/* ===============================
   ✅ CREATE QUOTATION
================================= */
app.post("/create-quotation", async (req, res) => {
  try {
    const { fullName, email, phone, companyName, services, applyGst } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: "Name, email, and phone are required" });
    }

    // Server-side price calculation (prevent manipulation)
    const serviceIds = services.map(s => s._id).filter(Boolean);
    const dbServices = await Service.find({ _id: { $in: serviceIds }, isActive: true });

    const quotationServices = services.map(s => {
      const dbService = dbServices.find(d => d._id.toString() === s._id);
      if (!dbService) return null;
      return {
        name: dbService.name,
        price: dbService.price,
        quantity: s.quantity || 1
      };
    }).filter(Boolean);

    const subtotal = quotationServices.reduce((sum, s) => sum + s.price * s.quantity, 0);
    const gst = applyGst ? Math.round(subtotal * 0.18) : 0;
    const totalAmount = subtotal + gst;

    const quotationId = "QT-" + Date.now();

    const newQuotation = new Quotation({
      quotationId,
      fullName,
      email,
      phone,
      companyName,
      services: quotationServices,
      subtotal,
      gst,
      totalAmount,
      applyGst: !!applyGst
    });

    await newQuotation.save();

    res.json({ message: "Quotation created successfully ✅", quotationId });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating quotation" });
  }
});


/* ===============================
   ✅ GET SINGLE QUOTATION (JSON)
================================= */
app.get("/quotation/:id", async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ quotationId: req.params.id });
    if (!quotation) return res.status(404).json({ message: "Quotation not found" });
    res.json(quotation);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching quotation" });
  }
});


/* ===============================
   ✅ GET ALL QUOTATIONS
================================= */
app.get("/quotations", async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching quotations" });
  }
});


/* ===============================
   ✅ ADMIN STATS
================================= */
app.get("/admin/stats", async (req, res) => {
  try {
    const totalQuotations = await Quotation.countDocuments();
    const allQuotations = await Quotation.find({}, "totalAmount createdAt");
    const totalValue = allQuotations.reduce((sum, q) => sum + q.totalAmount, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await Quotation.countDocuments({ createdAt: { $gte: todayStart } });

    const activeServices = await Service.countDocuments({ isActive: true });

    res.json({ totalQuotations, totalValue, todayCount, activeServices });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching stats" });
  }
});


/* ===============================
   ✅ GENERATE PDF
================================= */
app.get("/quotation/:id/pdf", async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ quotationId: req.params.id });
    if (!quotation) return res.status(404).json({ message: "Quotation not found" });

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const safeClientName = quotation.fullName.replace(/\s+/g, "_");
    const filename = `Quotation_${safeClientName}_${quotation.quotationId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    // --- HEADER BAR ---
    doc.rect(0, 0, 595, 90).fill("#1a1a2e");
    doc.fillColor("#ffffff").fontSize(26).font("Helvetica-Bold")
      .text("QUOTEFLOW", 50, 28, { align: "left" });
    doc.fillColor("#a78bfa").fontSize(10).font("Helvetica")
      .text("Professional Quotation Platform", 50, 58);
    doc.fillColor("#ffffff").fontSize(10)
      .text("www.quoteflow.in  |  hello@quoteflow.in", 50, 70);

    // --- QUOTATION TITLE ---
    doc.fillColor("#1a1a2e").fontSize(20).font("Helvetica-Bold")
      .text("QUOTATION", 50, 110);
    doc.fillColor("#6b7280").fontSize(10).font("Helvetica")
      .text(`ID: ${quotation.quotationId}`, 50, 135)
      .text(`Date: ${new Date(quotation.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 50, 150);

    // --- CLIENT INFO BOX ---
    doc.rect(50, 175, 495, 90).fill("#f9fafb").stroke("#e5e7eb");
    doc.fillColor("#374151").fontSize(11).font("Helvetica-Bold")
      .text("BILL TO", 65, 190);
    doc.font("Helvetica").fontSize(10).fillColor("#111827")
      .text(quotation.fullName, 65, 207)
      .text(quotation.email, 65, 221)
      .text(quotation.phone, 65, 235);
    if (quotation.companyName) {
      doc.text(quotation.companyName, 65, 249);
    }

    // --- SERVICES TABLE HEADER ---
    const tableTop = 285;
    doc.rect(50, tableTop, 495, 28).fill("#1a1a2e");
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold")
      .text("#", 60, tableTop + 9)
      .text("SERVICE NAME", 80, tableTop + 9)
      .text("QTY", 340, tableTop + 9)
      .text("UNIT PRICE", 380, tableTop + 9)
      .text("AMOUNT", 460, tableTop + 9);

    // --- SERVICE ROWS ---
    let y = tableTop + 28;
    quotation.services.forEach((service, index) => {
      const rowColor = index % 2 === 0 ? "#ffffff" : "#f3f4f6";
      doc.rect(50, y, 495, 26).fill(rowColor);
      doc.fillColor("#374151").fontSize(10).font("Helvetica")
        .text(`${index + 1}`, 60, y + 8)
        .text(service.name, 80, y + 8, { width: 250 })
        .text(`${service.quantity}`, 340, y + 8)
        .text(`₹${service.price.toLocaleString("en-IN")}`, 380, y + 8)
        .text(`₹${(service.price * service.quantity).toLocaleString("en-IN")}`, 460, y + 8);
      y += 26;
    });

    // --- TOTALS SECTION ---
    y += 15;
    doc.rect(350, y, 195, 1).fill("#e5e7eb"); // divider
    y += 10;

    doc.fillColor("#374151").fontSize(10).font("Helvetica")
      .text("Subtotal:", 360, y)
      .text(`₹${quotation.subtotal.toLocaleString("en-IN")}`, 460, y);
    y += 20;

    if (quotation.gst > 0) {
      doc.text("GST (18%):", 360, y)
        .text(`₹${quotation.gst.toLocaleString("en-IN")}`, 460, y);
      y += 20;
    }

    doc.rect(350, y, 195, 1).fill("#1a1a2e");
    y += 10;
    doc.fillColor("#1a1a2e").fontSize(13).font("Helvetica-Bold")
      .text("TOTAL AMOUNT:", 360, y)
      .text(`₹${quotation.totalAmount.toLocaleString("en-IN")}`, 455, y);

    // --- FOOTER ---
    doc.rect(0, 760, 595, 82).fill("#1a1a2e");
    doc.fillColor("#9ca3af").fontSize(9).font("Helvetica")
      .text("Thank you for your business! This is a computer-generated quotation.", 50, 775, { align: "center", width: 495 })
      .text("Valid for 30 days from the date of issue.  |  QuoteFlow © 2026", 50, 790, { align: "center", width: 495 });

    doc.end();

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});


/* ===============================
   ✅ START SERVER
================================= */
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000 🚀");
});
