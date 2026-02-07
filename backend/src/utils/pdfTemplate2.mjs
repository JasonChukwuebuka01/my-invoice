export const generateHTML2 = (data) => {
    // Destructure all incoming data
    const {
        client,
        financials,
        settlement,
        invoiceNumber,
        items,
        sender,
        issuedDate,
        senderLogoUrl
    } = data;




    // Nigerian Naira Formatter Logic
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(amount);
    };


    // Status Logic
    const isPaid = financials.balanceDue <= 0;
    const statusColor = isPaid ? "#059669" : "#0F172A";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${invoiceNumber}</title>
      <style>
        /* A4 SETTINGS */
        @page { size: A4; margin: 0; }
        
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #0F172A;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }

        /* MAIN CONTAINER */
        .page-container {
          padding: 60px 80px; 
          position: relative;
          min-height: 100vh;
          box-sizing: border-box;
        }

        /* WATERMARK */
        .watermark {
          position: absolute;
          top: 45%; left: 50%;
          transform: translate(-50%, -50%) rotate(-12deg);
          font-size: 180px;
          font-weight: 900;
          color: rgba(16, 185, 129, 0.04);
          text-transform: uppercase;
          z-index: 0;
          pointer-events: none;
        }

        /* HEADER */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; position: relative; z-index: 10; }
        .sender-block h2 { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: -0.5px; }
        .sender-block p { font-size: 12px; color: #64748B; margin: 3px 0; font-weight: 500; }
        
        .title-block { text-align: right; }
        .invoice-title { font-family: 'Times New Roman', serif; font-size: 64px; font-style: italic; margin: 0; line-height: 0.8; }
        .invoice-badge { display: inline-block; background: #0F172A; color: #FFF; font-size: 10px; font-weight: 800; padding: 6px 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 15px; }

        /* RECIPIENT GRID */
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 50px; padding-bottom: 30px; border-bottom: 1px solid #F1F5F9; position: relative; z-index: 10; }
        .label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #CBD5E1; margin-bottom: 10px; display: block; }
        .client-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .client-detail { font-size: 13px; color: #475569; margin: 2px 0; }
        .date-val { font-size: 14px; font-weight: 700; text-decoration: underline; text-decoration-color: #F1F5F9; text-underline-offset: 4px; }
        .due-val { font-size: 14px; color: #64748B; margin-top: 5px; font-weight: 600; }

        /* ITEMS TABLE STYLES UPDATE */
        table { width: 100%; border-collapse: collapse; margin-bottom: 50px; position: relative; z-index: 10; table-layout: fixed; }
        th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #CBD5E1; padding-bottom: 20px; border-bottom: 2px solid #0F172A; }
        
        /* Specific column alignments */
        th.right, td.right { text-align: right; }
        th.center, td.center { text-align: center; }
        
        td { padding: 25px 0; border-bottom: 1px solid #F8FAFC; vertical-align: top; }
        
        .item-desc { font-size: 18px; font-weight: 700; color: #0F172A; }
        .item-sub { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
        /* Font size adjustment for number columns to match hierarchy */
        .item-text { font-size: 16px; font-weight: 600; color: #475569; } 
        .item-total { font-size: 20px; font-weight: 800; text-align: right; letter-spacing: -0.5px; }

        /* BOTTOM SECTION */
        .bottom-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; position: relative; z-index: 10; }
        .settlement-box { width: 48%; background: #F8FAFC; padding: 25px; border-radius: 12px; border: 1px solid #F1F5F9; }
        .pay-method { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; display: block; }
        .pay-details { font-size: 11px; color: #64748B; font-weight: 600; line-height: 1.5; padding-top: 10px; border-top: 1px solid #E2E8F0; }

        /* Totals */
        .totals-box { width: 38%; text-align: right; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .t-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; }
        .t-value { font-size: 14px; font-weight: 700; color: #0F172A; }
        .grand-total { margin-top: 25px; padding-top: 25px; border-top: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: flex-end; }
        .balance-val { font-size: 48px; font-weight: 800; letter-spacing: -2px; line-height: 0.8; font-style: italic; color: ${statusColor}; }

        /* FOOTER */
        .footer { position: absolute; bottom: 60px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #F8FAFC; padding-top: 40px; }
        .sig-img { height: 60px; opacity: 0.9; mix-blend-mode: multiply; margin-bottom: 15px; display: block; filter: grayscale(100%) contrast(1.2); }
        .sig-placeholder { width: 220px; border-bottom: 2px dashed #CBD5E1; height: 40px; margin-bottom: 15px; }

      </style>
    </head>
    <body>
      <div class="page-container">
        
        ${isPaid ? '<div class="watermark">PAID</div>' : ''}

        <div class="header">
          <div class="sender-block">
            <h2>${sender.companyName}</h2>
            <p>${sender.address}</p>
            <p>${sender.phone}</p>
            <p>${sender.email}</p>
          </div>
          <div class="title-block">
            <h1 class="invoice-title">Invoice</h1>
            <span class="invoice-badge">${invoiceNumber}</span>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <span class="label">Billed To</span>
            <div class="client-name">${client.name}</div>
            ${client.address ? `<div class="client-detail">${client.address}</div>` : ''}
            <div class="client-detail">${client.email}</div>
          </div>
          <div style="text-align: right;">
            <span class="label">Information</span>
            <div class="date-val">Issued: ${new Date(issuedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>

          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">Description</th>
              <th class="center" style="width: 15%">Qty</th>
              <th class="right" style="width: 15%">Rate</th>
              <th class="right" style="width: 20%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td>
                  <div class="item-desc">${item.description}</div>
                  <div class="item-sub">Professional Service</div>
                </td>
                <td class="center">
                    <span class="item-text">${item.quantity}</span>
                </td>
                <td class="right">
                    <span class="item-text">${formatCurrency(item.rate)}</span>
                </td>
                <td class="right">
                    <span class="item-total">${formatCurrency(item.quantity * item.rate)}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="bottom-section">
          
          <div class="settlement-box">
            <span class="label" style="margin-bottom:12px;">Payment Method</span>
            <span class="pay-method">${settlement.method}</span>
            <div class="pay-details">
              ${settlement.details}
            </div>
          </div>

          <div class="totals-box">
            <div class="total-row">
              <span class="t-label">Subtotal</span>
              <span class="t-value">${formatCurrency(financials.subtotal)}</span>
            </div>

            ${financials.taxRate > 0 ? `
              <div class="total-row">
                <span class="t-label">Tax (${financials.taxRate}%)</span>
                <span class="t-value">${formatCurrency(financials.taxAmount)}</span>
              </div>
            ` : ''}

            ${financials.amountPaid > 0 ? `
              <div class="total-row">
                <span class="t-label" style="color:#059669">Paid</span>
                <span class="t-value" style="color:#059669">-${formatCurrency(financials.amountPaid)}</span>
              </div>
            ` : ''}

            <div class="grand-total">
              <span class="t-label" style="margin-bottom:8px;">Balance Due</span>
              <span class="balance-val">${isPaid ? 'Paid' : formatCurrency(financials.balanceDue)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>
            <span class="label">Authorized Signature</span>
            ${senderLogoUrl
            ? `<img src="${senderLogoUrl}" class="sig-img" />`
            : `<div class="sig-placeholder">pssst</div>`
        }
            <div class="t-label" style="color:#0F172A;">${sender.companyName}</div>
          </div>
          <div>
            <span class="label">Verified Document</span>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};