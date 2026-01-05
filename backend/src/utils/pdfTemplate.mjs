export const generateHTML = (data) => {

    const { invoiceNumber, client, items, date } = data;

    // Calculate math for the template
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const tax = subtotal * 0.1; // 10% tax example
    const total = subtotal + tax;

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .invoice-title { color: #4F46E5; font-size: 32px; font-weight: bold; }
          .details { margin-top: 30px; display: flex; justify-content: space-between; }
          .section-label { color: #6B7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          th { background-color: #F9FAFB; text-align: left; padding: 12px; border-bottom: 1px solid #E5E7EB; color: #374151; }
          td { padding: 12px; border-bottom: 1px solid #F3F4F6; }
          .totals { margin-top: 30px; float: right; width: 250px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand-total { border-top: 2px solid #4F46E5; margin-top: 10px; font-weight: bold; font-size: 18px; color: #4F46E5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div>#${invoiceNumber || 'N/A'}</div>
          </div>
          <div style="text-align: right">
            <p><strong>Your Company Name</strong><br>your@email.com<br>123 Tech Lane</p>
          </div>
        </div>

        <div class="details">
          <div>
            <div class="section-label">Billed To:</div>
            <strong>${client.name}</strong><br>
            ${client.email}
          </div>
          <div style="text-align: right">
            <div class="section-label">Date Issued:</div>
            ${date || new Date().toLocaleDateString()}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${Number(item.rate).toFixed(2)}</td>
                <td>$${(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
      </body>
    </html>
  `;
};
