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
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    client: {
        name: { type: String, required: true },
        email: { type: String, required: true },
    },
    items: [ItemSchema], // Embedding the ItemSchema array
    subtotal: Number,
    tax: Number,
    total: Number,
    date: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    });


export const Invoice = mongoose.model('Invoice', InvoiceSchema);
