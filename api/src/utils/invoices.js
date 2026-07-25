// const html_to_pdf = require("html-pdf-node");
const fs = require('fs').promises;
const path = require('path');
const db = require('../models');
const { customerPlanPurchaseEmail } = require('../Emails/stripeEmails');
const notificationService = require('../services/notificationService');

let cachedLogoBase64 = '';

(async () => {
  try {
    const logoPath = path.join(__dirname, '../../public/static/App_logo.png');
    const logoBuffer = await fs.readFile(logoPath);
    const base64 = logoBuffer.toString('base64');
    cachedLogoBase64 = `data:image/png;base64,${base64}`;
  } catch (e) {
    console.error('PDF Logo cache failed:', e.message);
  }
})();

const generateCustomInvoicePDF = async (data) => {
  const logoBase64 = cachedLogoBase64 || '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    font-family:'Inter',sans-serif;
    background:#F3F4F6;
    color:#111827;
    padding:60px;
}

.invoice{
    max-width:850px;
    margin:auto;
    background:#fff;
    border-radius:24px;
    border:1px solid #E5E7EB;
    overflow:hidden;
    box-shadow:
        0 12px 40px rgba(15,23,42,.08),
        0 2px 8px rgba(15,23,42,.04);
}

/* HEADER */

.header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    padding:48px;
    border-bottom:1px solid #F1F5F9;
}

.company h1{
    font-size:36px;
    font-weight:800;
    letter-spacing:-1px;
    color:#111827;
}

.company p{
    margin-top:8px;
    color:#6B7280;
    font-size:15px;
}

.logo img{
    width:130px;
    height:auto;
}

.badge{
    display:inline-flex;
    align-items:center;
    gap:8px;
    margin-top:20px;
    background:#ECFDF5;
    color:#059669;
    border:1px solid #A7F3D0;
    border-radius:999px;
    padding:8px 18px;
    font-size:13px;
    font-weight:600;
}

/* INFO */

.info{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:24px;
    padding:40px 48px;
}

.card{
    background:#FAFAFA;
    border:1px solid #ECECEC;
    border-radius:18px;
    padding:24px;
}

.label{
    color:#9CA3AF;
    font-size:12px;
    font-weight:600;
    letter-spacing:1px;
    text-transform:uppercase;
    margin-bottom:12px;
}

.value{
    color:#111827;
    font-size:18px;
    font-weight:700;
}

.small{
    margin-top:8px;
    color:#6B7280;
    font-size:14px;
}

/* TABLE */

.table-wrapper{
    padding:0 48px;
}

table{
    width:100%;
    border-collapse:collapse;
    overflow:hidden;
    border-radius:18px;
    border:1px solid #E5E7EB;
}

thead{
    background:#F9FAFB;
}

th{
    padding:18px 24px;
    text-align:left;
    color:#6B7280;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:.8px;
}

th:last-child{
    text-align:right;
}

td{
    padding:24px;
    border-top:1px solid #F1F5F9;
    color:#111827;
}

td:last-child{
    text-align:right;
    font-weight:700;
    font-size:16px;
}

.plan-name{
    font-size:16px;
    font-weight:700;
    margin-bottom:6px;
}

.plan-desc{
    color:#6B7280;
    font-size:13px;
}

/* SUMMARY */

.summary{
    display:flex;
    justify-content:flex-end;
    padding:40px 48px;
}

.summary-card{
    width:320px;
    background:#111827;
    color:#fff;
    border-radius:20px;
    padding:28px;
}

.row{
    display:flex;
    justify-content:space-between;
    margin-bottom:16px;
    color:#D1D5DB;
    font-size:14px;
}

.total{
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-top:1px solid rgba(255,255,255,.12);
    padding-top:20px;
    margin-top:10px;
    font-size:22px;
    font-weight:700;
}

/* FOOTER */

.footer{
    padding:36px;
    text-align:center;
    border-top:1px solid #F1F5F9;
    color:#6B7280;
    font-size:14px;
    line-height:24px;
}

.footer strong{
    display:block;
    color:#111827;
    margin-bottom:10px;
    font-size:16px;
}
</style>

</head>

<body>

<div class="invoice">

    <div class="header">

        <div class="company">

            <h1>${process.env.PROJECT_NAME}</h1>

            <p>Invoice #${data.invoiceNumber}</p>

            <div class="badge">
                ✓ Payment Successful
            </div>

        </div>

        <div class="logo">

            ${logoBase64 ? `<img src="${logoBase64}" alt="${process.env.PROJECT_NAME} Logo"/>` : ''}

        </div>

    </div>

    <div class="info">

        <div class="card">

            <div class="label">
                Bill To
            </div>

            <div class="value">
                ${data.customerName}
            </div>

            <div class="small">
                ${data.customerEmail}
            </div>

        </div>

        <div class="card" style="text-align:right;">

            <div class="label">
                Invoice Details
            </div>

            <div class="value">
                ${new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
            </div>

            <div class="small">
                Invoice Generated
            </div>

        </div>

    </div>

    <div class="table-wrapper">

        <table>

            <thead>

                <tr>

                    <th>Description</th>

                    <th>Amount</th>

                </tr>

            </thead>

            <tbody>

                <tr>

                    <td>

                        <div class="plan-name">
                            ${data.planName}
                        </div>

                        <div class="plan-desc">
                            Subscription Plan
                        </div>

                    </td>

                    <td>

                        ${data.currency} ${data.amount}

                    </td>

                </tr>

            </tbody>

        </table>

    </div>

    <div class="summary">

        <div class="summary-card">

            <div class="row">

                <span>Subtotal</span>

                <span>${data.currency} ${data.amount}</span>

            </div>

            <div class="row">

                <span>Tax</span>

                <span>Included</span>

            </div>

            <div class="total">

                <span>Total Paid</span>

                <span>${data.currency} ${data.amount}</span>

            </div>

        </div>

    </div>

    <div class="footer">

        <strong>Thank you for your purchase.</strong>

        This invoice confirms that your payment has been received successfully.<br>

        © ${new Date().getFullYear()} Seat Open. All rights reserved.

    </div>

</div>

</body>
</html>
  `;

  const options = {
    format: 'A4',
    printBackground: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  };

  return await html_to_pdf.generatePdf({ content: htmlContent }, options);
};

const handlePostPaymentTasks = async (
  session,
  entity,
  plan,
  sub,
  validDate,
  userModel = 'users',
) => {
  try {
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const directoryPath = path.join(__dirname, '../../public/invoices');
    const fileName = `invoice_${session.id}.pdf`;
    const filePath = path.join(directoryPath, fileName);
    const publicUrl = `${process.env.BACK_WEB_URL}/invoices/${fileName}`;

    let customInvoiceBuffer = null;
    try {
      customInvoiceBuffer = await generateCustomInvoicePDF({
        invoiceNumber: session.invoice || `INV-${Date.now()}`,
        customerName: entity.fullName || entity.name || 'Customer',
        customerEmail: entity.email,
        planName: plan.name,
        amount: Number(amount).toFixed(2),
        currency: session.currency?.toUpperCase() || 'USD',
        type: plan.type,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
    }

    let savedPublicUrl = '';
    if (customInvoiceBuffer) {
      try {
        await fs.mkdir(directoryPath, { recursive: true });
        await fs.writeFile(filePath, customInvoiceBuffer);
        savedPublicUrl = publicUrl;
      } catch (error) {
        console.error('Failed to save PDF file:', error);
      }
    }

    const entityUpdate =
      userModel === 'users'
        ? db.users.findByIdAndUpdate(entity._id, {
            $set: { planId: plan._id, subscriptionId: sub._id },
          })
        : db.organization?.findByIdAndUpdate(entity._id, {
            $set: { planId: plan._id, subscriptionId: sub._id },
          });

    const transactionService = require('../services/transactionService');

    await Promise.all([
      entityUpdate,
      db.subscriptions.findByIdAndUpdate(sub._id, {
        $set: {
          invoice_pdf: savedPublicUrl,
        },
      }),
      transactionService.create({
        userId: entity._id,
        purchased_planId: plan._id,
        amount: Number(amount),
        status: session.payment_status === 'paid' ? 'success' : 'pending',
        currency: session.currency || 'usd',
        stripe_session_id: session.id,
        stripe_payment_id:
          session.metadata?.stripe_price_id || session.line_items?.data?.[0]?.price?.id || '',
        invoiceUrl: savedPublicUrl,
        type: plan.type,
        subscriptionId: sub._id,
      }),
      customerPlanPurchaseEmail({
        name: entity.fullName || entity.name || 'Customer',
        email: entity.email,
        planName: plan.name,
        planPrice: Number(amount),
        planValidity: validDate
          ? new Date(validDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
          : 'N/A',
        invoiceUrl: savedPublicUrl,
        type: plan.type,
      }),
      notificationService.createNotification({
        userId: entity._id,
        type: session.payment_status === 'paid' ? 'payment_success' : 'payment_failed',
        title: session.payment_status === 'paid' ? 'Payment successful' : 'Payment failed',
        message: session.payment_status === 'paid'
          ? `Your ${plan.name} subscription is now active.`
          : `Payment for ${plan.name} requires attention.`,
        metadata: { planId: plan._id, subscriptionId: sub._id },
      }),
      notificationService.notifyAdmins({
        type: 'subscription_reminder',
        title: 'New subscription purchase',
        message: `${entity.fullName || entity.name} subscribed to ${plan.name}.`,
        metadata: { userId: entity._id, planId: plan._id, subscriptionId: sub._id },
      }),
    ]);
  } catch (error) {
    console.error('Background Task Error:', error);
  }
};

module.exports = { generateCustomInvoicePDF, handlePostPaymentTasks };
