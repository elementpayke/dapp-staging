import { formatToLocal } from "@/utils/helpers";

interface Branding {
  primaryColor?: string;
  companyName: string;
  receiptTitle?: string;
  footerMessage?: string;
}

interface TransactionItem {
  name: string;
  price: string;
  quantity: number;
}

interface TransactionDetails {
  receiptNumber?: string;
  paymentStatus?: string;
  date?: string;
  recipient?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
  items?: TransactionItem[];
  transactionHash?: string;
  subtotal?: string;
  tax?: string;
  amount?: string;
  currency?: string;
}

const generateReceiptHTML = (
  branding: Branding,
  transactionDetails: TransactionDetails
): string => {
  const brandColor = branding?.primaryColor || "#4f46e5";
  const fallbackDate = new Date().toISOString();

  return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt: ${
              transactionDetails.receiptNumber || "unknown"
            }</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .receipt {
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 40px;
                position: relative;
                overflow: hidden;
              }
              .receipt-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
              }
              .brand-info {
                display: flex;
                flex-direction: column;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 4px;
                color: ${brandColor};
              }
              .receipt-label {
                color: #777;
                font-size: 14px;
                margin-top: 4px;
              }
              .receipt-number {
                font-size: 16px;
                font-weight: 500;
                color: #555;
              }
              .receipt-title {
                text-align: center;
                font-size: 26px;
                font-weight: bold;
                margin-bottom: 30px;
                color: ${brandColor};
              }
              .receipt-status {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 50px;
                background-color: #e6f7ea;
                color: #18a957;
                font-weight: 500;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .receipt-section {
                margin-bottom: 25px;
              }
              .section-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #555;
              }
              .receipt-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
              }
              .receipt-info-item {
                margin-bottom: 4px;
              }
              .receipt-info-label {
                color: #777;
                font-size: 14px;
                margin-bottom: 4px;
              }
              .receipt-info-value {
                font-weight: 500;
              }
              .payment-method {
                display: flex;
                align-items: center;
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 25px;
              }
              .payment-icon {
                margin-right: 15px;
                width: 32px;
                height: 32px;
                background-color: ${brandColor};
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
              }
              .payment-details {
                flex: 1;
              }
              .payment-name {
                font-weight: 500;
                margin-bottom: 2px;
              }
              .payment-date {
                font-size: 14px;
                color: #777;
              }
              .amount-section {
                text-align: right;
                padding-top: 20px;
                border-top: 1px solid #eee;
                margin-top: 30px;
              }
              .total-amount {
                font-size: 28px;
                font-weight: bold;
                color: ${brandColor};
                margin-bottom: 5px;
              }
              .receipt-footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #777;
                font-size: 14px;
              }
              .receipt-barcode {
                text-align: center;
                margin-top: 30px;
              }
              .qrcode-container {
                display: inline-block;
                padding: 10px;
                background: white;
                border-radius: 4px;
              }
              .transaction-id {
                font-family: monospace;
                word-break: break-all;
                font-size: 13px;
                color: #555;
                background-color: #f5f5f5;
                padding: 8px 12px;
                border-radius: 6px;
                margin-top: 4px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
              }
              .items-table th {
                text-align: left;
                padding: 10px;
                background-color: #f5f5f5;
                font-weight: 500;
                color: #555;
              }
              .items-table td {
                padding: 10px;
                border-bottom: 1px solid #eee;
              }
              .items-table tr:last-child td {
                border-bottom: none;
              }
              .item-price, .item-total {
                text-align: right;
              }
              .item-quantity {
                text-align: center;
              }
              .receipt-background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                opacity: 0.02;
                pointer-events: none;
                overflow: hidden;
              }
              .receipt-background::before {
                content: "";
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background-image: repeating-linear-gradient(
                  45deg,
                  ${brandColor},
                  ${brandColor} 10px,
                  transparent 10px,
                  transparent 20px
                );
                opacity: 0.5;
              }
              @media print {
                body {
                  padding: 0;
                  background: white;
                }
                .receipt {
                  box-shadow: none;
                  padding: 20px;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-background"></div>
              
              <div class="receipt-header">
                <div class="brand-info">
                  <div class="company-name">${branding.companyName}</div>
                  <div class="receipt-label">Official Payment Receipt</div>
                </div>
                <div>
                  <div class="receipt-label">Receipt ID</div>
                  <div class="receipt-number">${
                    transactionDetails.receiptNumber || "Pending"
                  }</div>
                </div>
              </div>
              
              <div class="receipt-title">${
                branding.receiptTitle || "Payment Receipt"
              }</div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <div class="receipt-status">${
                  transactionDetails.paymentStatus || "Processing"
                }</div>
              </div>
              
              <div class="receipt-section">
                <div class="section-title">Payment Information</div>
                <div class="receipt-grid">
                  <div class="receipt-info-item">
                    <div class="receipt-info-label">Date</div>
                    <div class="receipt-info-value">${formatToLocal(
                      transactionDetails.date || fallbackDate
                    )}</div>
                  </div>
                  <div class="receipt-info-item">
                    <div class="receipt-info-label">Recipient</div>
                    <div class="receipt-info-value">${
                      transactionDetails.recipient || "Unknown"
                    }</div>
                  </div>
                  ${
                    transactionDetails.customerName
                      ? `
                  <div class="receipt-info-item">
                    <div class="receipt-info-label">Customer</div>
                    <div class="receipt-info-value">${transactionDetails.customerName}</div>
                  </div>`
                      : ""
                  }
                  ${
                    transactionDetails.customerEmail
                      ? `
                  <div class="receipt-info-item">
                    <div class="receipt-info-label">Email</div>
                    <div class="receipt-info-value">${transactionDetails.customerEmail}</div>
                  </div>`
                      : ""
                  }
                </div>
              </div>
              
              <div class="payment-method">
                <div class="payment-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div class="payment-details">
                  <div class="payment-name">${
                    transactionDetails.paymentMethod || "Mobile Money"
                  }</div>
                  <div class="payment-date">Processed on ${formatToLocal(
                    transactionDetails.date || fallbackDate
                  )}</div>
                </div>
              </div>
              
              ${
                transactionDetails.items && transactionDetails.items.length > 0
                  ? `
              <div class="receipt-section">
                <div class="section-title">Items</div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Price</th>
                      <th class="item-quantity">Qty</th>
                      <th class="item-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactionDetails.items
                      .map(
                        (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.price}</td>
                      <td class="item-quantity">${item.quantity}</td>
                      <td class="item-total">Kes${(
                        Number.parseFloat(
                          item.price.replace(/[^0-9.-]+/g, "")
                        ) * item.quantity
                      ).toFixed(2)}</td>
                    </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
              `
                  : ""
              }
              
              <div class="receipt-section">
                <div class="section-title">Transaction Details</div>
                <div class="receipt-info-item">
                  <div class="receipt-info-label">Transaction ID</div>
                  <div class="transaction-id">${
                    transactionDetails.transactionHash || "Pending"
                  }</div>
                </div>
              </div>
              
              <div class="amount-section">
                ${
                  transactionDetails.subtotal
                    ? `
                <div style="margin-bottom: 5px;">
                  <span style="color: #777; display: inline-block; width: 120px; text-align: right;">Subtotal:</span>
                  <span style="font-weight: 500; display: inline-block; width: 100px; text-align: right;">${transactionDetails.subtotal}</span>
                </div>`
                    : ""
                }
                
                ${
                  transactionDetails.tax
                    ? `
                <div style="margin-bottom: 5px;">
                  <span style="color: #777; display: inline-block; width: 120px; text-align: right;">Tax:</span>
                  <span style="font-weight: 500; display: inline-block; width: 100px; text-align: right;">${transactionDetails.tax}</span>
                </div>`
                    : ""
                }
                
                <div class="total-amount">${transactionDetails.amount || "0"} ${
    transactionDetails.currency || "KES"
  }</div>
              </div>
              
              <div class="receipt-barcode">
                <div class="qrcode-container">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    transactionDetails.transactionHash || "pending"
                  )}" width="120" height="120" alt="Transaction QR Code">
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #777;">Scan to verify transaction</div>
              </div>
              
              <div class="receipt-footer">
                ${branding.footerMessage || "Thank you for your business!"}
                <div style="margin-top: 5px; font-size: 12px;">
                  For questions about this transaction, please contact customer support.
                </div>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="
                padding: 8px 16px;
                background-color: ${brandColor};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
              ">Print Receipt</button>
            </div>
          </body>
          </html>
        `;
};

export default generateReceiptHTML;
