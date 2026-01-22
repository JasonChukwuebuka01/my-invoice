import express from 'express';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkSchema, matchedData, validationResult } from 'express-validator';
import { invoiceSchema } from './validationSchema/userInvoiceSchema.mjs';
import signupRouter from './routes/signupRoute.mjs';
import signInRouter from './routes/signInRoute.mjs';
import signInWithGoogleRouter from './routes/signInWithGoogle.mjs';
import puppeteer from 'puppeteer';
import { generateHTML } from './utils/pdfTemplate.mjs';
import mongoose from 'mongoose';
import { Invoice } from './mongoose/schemas/invoice.mjs';
import { generateInvoiceNumber } from './utils/helper.mjs';
import { verifyToken } from './middleware/auth.mjs';


// Initialize environment variables
dotenv.config();



const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(signupRouter);
app.use(signInRouter);
app.use(signInWithGoogleRouter);

//app.use(passport.initialize());
//app.use(passport.session());





mongoose.connect("mongodb://localhost/invoicegeneratorapi")
    .then(() => console.log('✅ Connected to MongoDB....'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));




app.get('/', verifyToken, (req, res) => {
    res.send('Invoice Generator API is running');
});




app.post('/api/generate-invoice',
    checkSchema(invoiceSchema),
    verifyToken,
    async (req, res) => {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }


        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const invoiceData = matchedData(req);
            const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
            const tax = subtotal * 0.1;
            const total = subtotal + tax;

            // Save to Database
            const newInvoice = new Invoice({
                ...invoiceData,
                subtotal,
                tax,
                total,
                invoiceNumber: generateInvoiceNumber()
            });

            console.log('Saving to DB:', newInvoice);
            const savedInvoice = await newInvoice.save();

            console.log('Saved Invoice:', savedInvoice);

            // 3. Generate PDF (Reuse your existing Puppeteer logic)
            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();
            const htmlContent = generateHTML({ ...invoiceData, subtotal, tax, total });

            await page.setContent(htmlContent);
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
            await browser.close();


            // 4. Send PDF
            res.contentType("application/pdf");
            res.send(pdfBuffer);

        } catch (error) {
            res.status(500).json({ message: "Error generating invoice", error: error.message });
        }
    });




// GET: Fetch all invoices
app.get('/api/invoices', async (req, res) => {

    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});







// GET: Fetch a single invoice by ID
app.get('/api/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Invalid ID or Server Error' });
    }
});




// GET: Re-generate PDF for an existing invoice
app.get('/api/invoices/:id/download', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        // We pass the invoice data from MongoDB into our HTML template
        const htmlContent = generateHTML(invoice);

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.contentType("application/pdf");
        // This header forces the browser to download the file with a specific name
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        res.status(500).json({ error: 'Error generating PDF' });
    }
});




app.get("/api/login", (req, res) => {
    res.json({ message: "Login endpoint - to be implemented" });
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
