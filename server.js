require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const Service = require("./models/Service");
const Quotation = require("./models/Quotation");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/* ===============================
   ✅ MONGODB CONNECTION
================================= */
mongoose.connect("mongodb://127.0.0.1:27017/quotationDB")
.then(() => console.log("MongoDB Connected ✅"))
.catch((err) => console.log("MongoDB Error:", err));


/* ===============================
   ✅ TEST ROUTE
================================= */
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});


/* ===============================
   ✅ ADD DEFAULT SERVICES (Run Once)
================================= */
app.get("/add-services", async (req, res) => {
  try {
    await Service.insertMany([
      {
        name: "Website Development",
        description: "Full website creation",
        price: 10000,
        category: "Development",
        isActive: true
      },
      {
        name: "SEO Optimization",
        description: "Improve search ranking",
        price: 5000,
        category: "Marketing",
        isActive: true
      },
      {
        name: "UI/UX Design",
        description: "Modern UI design",
        price: 7000,
        category: "Design",
        isActive: true
      },
      {
        name: "Maintenance",
        description: "Monthly maintenance",
        price: 3000,
        category: "Support",
        isActive: true
      }
    ]);

    res.send("Services Added ✅");
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
   ✅ CREATE QUOTATION
================================= */
app.post("/create-quotation", async (req, res) => {
  try {
    const { fullName, email, phone, companyName, services, subtotal, gst, totalAmount } = req.body;

    const quotationId = "QT-" + Date.now();

    const newQuotation = new Quotation({
      quotationId,
      fullName,
      email,
      phone,
      companyName,
      services,
      subtotal,
      gst,
      totalAmount
    });

    await newQuotation.save();

    res.json({
      message: "Quotation created successfully ✅",
      quotationId: quotationId
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating quotation" });
  }
});


/* ===============================
   ✅ GET ALL QUOTATIONS
================================= */
app.get("/quotations", async (req, res) => {
  try {
    const quotations = await Quotation.find();
    res.json(quotations);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching quotations" });
  }
});


/* ===============================
   ✅ GENERATE PDF
================================= */
app.get("/quotation/:id/pdf", async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      quotationId: req.params.id
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${quotation.quotationId}.pdf`
    );

    doc.pipe(res);

    // HEADER
    doc.fontSize(22).text("QUOTATION INVOICE", { align: "center" });
    doc.moveDown();

    // CUSTOMER DETAILS
    doc.fontSize(12);
    doc.text(`Quotation ID: ${quotation.quotationId}`);
    doc.text(`Name: ${quotation.fullName}`);
    doc.text(`Email: ${quotation.email}`);
    doc.text(`Phone: ${quotation.phone}`);
    doc.text(`Company: ${quotation.companyName}`);
    doc.moveDown();

    // SERVICES SECTION
    doc.fontSize(14).text("Services", { underline: true });
    doc.moveDown();

    quotation.services.forEach((service, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${service.name} - ₹${service.price} x ${service.quantity}`
      );
    });

    doc.moveDown();

    // TOTALS
    doc.fontSize(12).text(`Subtotal: ₹${quotation.subtotal}`);
    doc.text(`GST (18%): ₹${quotation.gst}`);
    doc.fontSize(14).text(`Total Amount: ₹${quotation.totalAmount}`);

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
  console.log("Server running on port 5000 🚀");
});

