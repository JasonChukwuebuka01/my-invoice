export function generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `INV-${random}`;
};
