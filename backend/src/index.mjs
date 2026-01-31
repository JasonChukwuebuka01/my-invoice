import express from 'express';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkSchema, matchedData, validationResult } from 'express-validator';
import { invoiceSchema } from './validationSchema/userInvoiceSchema.mjs';
import signupRouter from './routes/signupRoute.mjs';
import signInRouter from './routes/signInRoute.mjs';
import signInWithGoogleRouter from './routes/signInWithGoogle.mjs';
import userOnboarding from './routes/userOnboarding.mjs';
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


// Enable CORS so your Next.js frontend can talk to this API
// 1. PLACE CORS FIRST
app.use(cors({
    origin: 'http://localhost:3001',  // Or '*' for any origin (less secure)
    allowedHeaders: ['Content-Type', 'Authorization']  // Add 'Authorization' here
}));


app.use(express.json());
app.use(signupRouter);
app.use(signInRouter);
app.use(signInWithGoogleRouter);
app.use(userOnboarding);

app.use(passport.initialize());
//app.use(passport.session());




mongoose.connect("mongodb://localhost/invoicegeneratorapi")
    .then(() => console.log('✅ Connected to MongoDB....'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));




app.get('/', verifyToken, (req, res) => {
    res.send('Invoice Generator API is running');
});






app.post('/api/generate-pdf', verifyToken, async (req, res) => {

    // [FIX 1] Define browser variable outside try block so we can close it in 'finally'
    let browser;

    try {
        const data = req.body;

        // [FIX 2] Destructure these variables so you can use them in the DB query below
        const { meta, billing, items, financials, settlement } = data;

        // ---------------------------------------------------------
        // STEP 1: VALIDATION (Check DB First)
        // ---------------------------------------------------------

        // [FIX 3] Check for duplicate BEFORE starting the heavy PDF generation
        const existingInvoice = await Invoice.findOne({
            invoiceNumber: meta.invoiceNumber,
            userId: req.user.id
        });

        if (existingInvoice) {
            return res.status(400).json({ message: "Invoice number already exists." });
        }

        // ---------------------------------------------------------
        // STEP 2: PDF GENERATION
        // ---------------------------------------------------------

        const newData = {
            ...data,
            sender: {
                companyName: req.user.name || "Mayicodes Tech Solutions",
                address: req.user.address || "123 Tech Avenue, Silicon Valley, CA",
                phone: req.user.phone || "+1 (555) 123-4567",
                email: req.user.email || "contact@mayicodes.com"
            },
            senderLogoUrl: req.user.signatureUrl || '',
        };

        const htmlContent = generateHTML(newData);

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });

        // We close the browser immediately after generation
        await browser.close();
        browser = null; // Prevent double closing in finally block


        // ---------------------------------------------------------
        // STEP 3: SAVE TO DATABASE
        // ---------------------------------------------------------

        const newInvoice = new Invoice({
            userId: req.user.id,
            invoiceNumber: meta.invoiceNumber, // [FIX 4] Now 'meta' is defined
            client: {
                name: billing.clientName, // [FIX 4] Now 'billing' is defined
                email: billing.clientEmail,
                address: billing.clientAddress
            },
            items: items.map(item => ({
                ...item,
                amount: item.quantity * item.rate
            })),
            financials,
            settlement,
            status: financials.isPaidInFull ? 'Paid' : 'Sent'
        });

        const savedInvoice = await newInvoice.save();

        if (!savedInvoice) {
            return res.status(500).json({ message: "Failed to save invoice to database" });
        }

        console.log('Invoice saved with ID:', savedInvoice);

        // ---------------------------------------------------------
        // STEP 4: SEND RESPONSE
        // ---------------------------------------------------------

        // [FIX 5] Only set PDF headers if everything else succeeded
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice_${meta.invoiceNumber}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        return res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);

        // Check if headers were already sent to avoid crashing the server
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF document' });
        }
    } finally {
        // [FIX 6] Ensure browser closes even if code crashes midway
        if (browser) {
            await browser.close();
        }
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






app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
