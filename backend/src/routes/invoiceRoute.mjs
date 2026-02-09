import { Router } from "express";
import { verifyToken } from "../middleware/auth.mjs";
import { Invoice } from "../mongoose/schemas/invoice.mjs";
import mongoose from "mongoose";
import { generateHTML2 } from "../utils/pdfTemplate2.mjs";
import puppeteer from 'puppeteer';



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






// 'protect' is your middleware that verifies the user is logged in
router.get('/api/invoices/recent', verifyToken, async (req, res) => {
    try {
        // 1. Get the ID of the logged-in user from the request object
        const userId = req.user.id;

        // 2. ONLY fetch invoices where the userId matches
        const invoices = await Invoice.find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: "Could not retrieve your invoices." });
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
router.get('/api/invoices/:id/download',

    verifyToken,
    async (req, res) => {
        let browser = null; // Declare browser outside to handle it in finally block
        try {
            // [SECURITY FIX]: Ensure the user can only download THEIR OWN invoice
            const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });

            console.log("Params", req.params.id)

            console.log(req.user.id)

            console.log("checking invoice rn", invoice)

            if (!invoice) return res.status(404).json({ error: 'Invoice not found or unauthorized' });

            const newData = {
                ...invoice.toObject(), // Convert Mongoose doc to plain JS object
                sender: {
                    companyName: req.user.name || "Mayicodes Tech Solutions",
                    address: req.user.address || "123 Tech Avenue, Silicon Valley, CA",
                    phone: req.user.phone || "+1 (555) 123-4567",
                    email: req.user.email || "contact@mayicodes.com"
                },
                senderLogoUrl: req.user.signatureUrl || '',
            };

            //console.log(newData);
            const htmlContent = generateHTML2(newData);

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

            // Set PDF headers - using invoice.invoiceNumber correctly
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=invoice_${invoice.invoiceNumber}.pdf`,
                'Content-Length': pdfBuffer.length
            });

            return res.status(200).send(pdfBuffer);

        } catch (error) {
            console.error("PDF Generation Error:", error);
            res.status(500).json({ error: 'Error generating PDF' });
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    });






// GET /api/invoices/stats
router.get('/stats', verifyToken, async (req, res) => {

    try {
        const userId = req.user.id; // From your auth middleware



        const stats = await Invoice.aggregate([
            // 1. Only look at THIS user's invoices
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },

            // 2. Group them to calculate totals
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$financials.totalGross", 0] }
                    },
                    pendingAmount: {
                        $sum: { $cond: [{ $eq: ["$status", "Sent"] }, "$financials.balanceDue", 0] }
                    },
                    overdueAmount: {
                        $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, "$financials.balanceDue", 0] }
                    },
                    totalCount: { $sum: 1 }
                }
            }
        ]);

        // If no invoices exist, return zeros
        const result = stats[0] || {
            totalRevenue: 0,
            pendingAmount: 0,
            overdueAmount: 0,
            totalCount: 0
        };


        res.status(200).json(result);
    } catch (error) {
        // API Error Differentiation
        console.log(error)
        res.status(500).json({ message: "Failed to calculate dashboard statistics." });
    }
});










// GET /api/invoices/revenue-history
router.get('/daily-revenue', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Calculate the date for exactly 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const history = await Invoice.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    status: "Paid",
                    // Only get invoices from the last week
                    issuedDate: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        // Group by the specific day of the year to keep them unique
                        dayOfWeek: { $dayOfWeek: "$issuedDate" },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$issuedDate" } }
                    },
                    revenue: { $sum: "$financials.totalGross" }
                }
            },
            // Sort by the actual date string so they appear in order (Mon -> Tue -> Wed)
            { $sort: { "_id.date": 1 } }
        ]);

        // 2. Map day numbers (1-7) to Names
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const formattedData = history.map(item => ({
            name: dayNames[item._id.dayOfWeek - 1],
            revenue: item.revenue
        }));

        res.json(formattedData);
    } catch (error) {
        console.error("Daily Chart Error:", error);
        res.status(500).json({ message: "Error fetching daily trends" });
    }
});







// GET /api/invoices/activity
router.get('/activity', verifyToken, async (req, res) => {
    try {
        const activities = await Invoice.find({ userId: req.user.id })
            .sort({ updatedAt: -1 }) // Get the most recently changed ones
            .limit(4)
            .select('invoiceNumber client status updatedAt financials.totalGross');

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to load activity feed" });
    }
});








// PATCH /api/invoices/:id/pay
router.patch('/:id/pay', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the invoice AND ensure it belongs to this user (Security!)
        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, userId: userId },
            { $set: { status: 'Paid' } },
            { new: true } // This returns the updated document
        );

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found or unauthorized" });
        }

        res.json({ message: "Payment recorded successfully", invoice });
    } catch (error) {
        console.error("Payment Update Error:", error);
        res.status(500).json({ message: "Server error during payment update" });
    }
});








// DELETE /api/invoices/:id
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Security Check: Only delete if the invoice belongs to the logged-in user
        const invoice = await Invoice.findOneAndDelete({
            _id: id,
            userId: userId
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found or unauthorized" });
        }

        res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Server error during deletion" });
    }
});


export default router;