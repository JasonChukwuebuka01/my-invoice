import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
});

const InvoiceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    invoiceNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    client: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        address: String
    },
    items: [{
        description: String,
        quantity: Number,
        rate: Number,
        amount: Number
    }],
    financials: {
        subtotal: Number,
        taxRate: Number,
        taxAmount: Number,
        totalGross: Number,
        amountPaid: Number,
        balanceDue: Number
    },
    settlement: {
        method: String,
        details: String
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Paid', 'Overdue'],
        default: 'Sent'
    },
    issuedDate: { type: Date, default: Date.now },
    dueDate: Date
}, { timestamps: true });


export const Invoice = mongoose.model('Invoice', InvoiceSchema);
