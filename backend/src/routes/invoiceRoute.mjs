import { Router } from "express";
import { verifyToken } from "../middleware/auth.mjs";
import { Invoice } from "../mongoose/schemas/invoice.mjs";


const router = Router();



// GET: Fetch all invoices
router.get('/api/invoices', async (req, res) => {

    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});







// GET: Fetch a single invoice by ID
router.get('/api/invoices/:id',
    verifyToken,
    async (req, res) => {


        try {

            const invoice = await Invoice.findOne({
                invoiceNumber: req.params.id,
                userId: req.user.id // Security check: Ensure this invoice belongs to the logged-in user
            });

            console.log("fetched invoice:", invoice);

            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            };


            const invoiceWithSenderInfo = {
                clientName: invoice.client.name,
                invoiceNumber: invoice.invoiceNumber,
                financials: invoice.financials
            };


            // console.log("invoice with sender info:", invoiceWithSenderInfo);

            res.status(200).json(invoiceWithSenderInfo);

        } catch (error) {
            console.error('Error fetching invoice:', error);
            res.status(500).json({ error: 'Invalid ID or Server Error' });
        }
    });




// GET: Re-generate PDF for an existing invoice
router.get('/api/invoices/:id/download', async (req, res) => {
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











export default router;