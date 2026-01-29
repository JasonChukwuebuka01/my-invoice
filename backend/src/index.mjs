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
    origin: 'http://localhost:3001', // Your Frontend Port
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));






app.use(express.json());
app.use(signupRouter);
app.use(signInRouter);
app.use(signInWithGoogleRouter);
app.use(userOnboarding);

app.use(passport.initialize());
//app.use(passport.session());





mongoose.connect("mongodb://localhost/invoicegeneratorapi")
    .then(() => console.log('✅ Connected to MongoDB...'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));




app.get('/', verifyToken, (req, res) => {
    res.send('Invoice Generator API is running');
});







app.post('/api/generate-pdf',
    verifyToken,
    async (req, res) => {
        try {
            // 1. Data comes from req.body (ensure app.use(express.json()) is active)
            const data = req.body;


            // 2. Generate the HTML string using the high-end template
            console.log("Generating HTML with sender as Mayicodes", data);

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

            // 3. Launch Puppeteer
            const browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // 4. Set Content (networkidle0 ensures the signature image is fully loaded)
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // 5. Create PDF Buffer
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true, // Required to render the background colors and watermark
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
            });

            await browser.close();

            // 6. Set Headers and Send Buffer
            // We use .send() because pdfBuffer is a Buffer object
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=invoice_${data.meta.invoiceNumber}.pdf`,
                'Content-Length': pdfBuffer.length
            });

            return res.status(200).send(pdfBuffer);

        } catch (error) {
            console.error('PDF Generation Error:', error);
            res.status(500).json({ error: 'Failed to generate PDF document' });
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
