const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

// Use the Public API Key from YOUR Maya Sandbox account. Do not use a guessed/shared key.
const MAYA_PUBLIC_KEY = (process.env.MAYA_PUBLIC_KEY || '').trim();
const MAYA_API = 'https://pg-sandbox.paymaya.com';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// MySQL connection pool. The storefront remains available if DB settings are
// not configured, but /api/products reports a clear setup error.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mensify_db', waitForConnections: true,
  connectionLimit: 10, decimalNumbers: true
});
function parseJson(value, fallback = []) { if (value == null) return fallback; if (typeof value !== 'string') return value; try { return JSON.parse(value); } catch { return fallback; } }
function productFromRow(r) { return { id:r.id, name:r.name, brand:r.brand, category:r.category, categoryName:r.category_name, description:r.description, price:Number(r.price), discount:Number(r.discount), stock:Number(r.stock), sku:r.sku, image:r.image_url, images:parseJson(r.images, r.image_url ? [r.image_url] : []), sizes:parseJson(r.sizes), colors:parseJson(r.colors), tags:parseJson(r.tags), rating:Number(r.rating), reviewsCount:Number(r.reviews_count) }; }
app.get('/api/products', async (_req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC'); res.json({ ok:true, products:rows.map(productFromRow) }); }
  catch (e) { res.status(503).json({ ok:false, error:'MySQL is not ready. Import database/schema.sql, configure DB_* in .env, and restart the server.', detail: process.env.NODE_ENV === 'development' ? e.message : undefined }); }
});
app.get('/api/products/:id', async (req, res) => {
  try { const [rows] = await pool.execute('SELECT * FROM products WHERE id=? LIMIT 1', [req.params.id]); if (!rows.length) return res.status(404).json({ok:false,error:'Product not found'}); res.json({ok:true,product:productFromRow(rows[0])}); }
  catch (e) { res.status(503).json({ok:false,error:'MySQL is not ready.'}); }
});
app.post('/api/products', async (req, res) => {
  const p = req.body || {};
  if (!p.id || !p.name || !p.category || !Number.isFinite(Number(p.price))) return res.status(400).json({ok:false,error:'id, name, category, and numeric price are required.'});
  try {
    await pool.execute(`INSERT INTO products (id,name,brand,category,category_name,description,price,discount,stock,sku,image_url,images,sizes,colors,tags,rating,reviews_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),brand=VALUES(brand),category=VALUES(category),category_name=VALUES(category_name),description=VALUES(description),price=VALUES(price),discount=VALUES(discount),stock=VALUES(stock),sku=VALUES(sku),image_url=VALUES(image_url),images=VALUES(images),sizes=VALUES(sizes),colors=VALUES(colors),tags=VALUES(tags),rating=VALUES(rating),reviews_count=VALUES(reviews_count)`, [String(p.id),String(p.name),p.brand||'',String(p.category),p.categoryName||p.category_name||'',p.description||'',Number(p.price),Number(p.discount||0),Number(p.stock||0),p.sku||null,p.image||p.image_url||null,JSON.stringify(p.images||[]),JSON.stringify(p.sizes||[]),JSON.stringify(p.colors||[]),JSON.stringify(p.tags||[]),Number(p.rating||0),Number(p.reviewsCount||0)]);
    res.status(201).json({ok:true,message:'Product saved to MySQL.'});
  } catch(e) { res.status(503).json({ok:false,error:'Could not save product to MySQL.',detail:process.env.NODE_ENV==='development'?e.message:undefined}); }
});
app.delete('/api/products/:id', async (req,res) => { try { const [result]=await pool.execute('DELETE FROM products WHERE id=?',[req.params.id]); res.json({ok:true,deleted:result.affectedRows}); } catch(e) { res.status(503).json({ok:false,error:'Could not delete product from MySQL.'}); } });

// Serve the original MENSIFY files unchanged.
app.use(express.static(__dirname));

function basicAuthHeader(key) {
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

function cleanText(value, max = 255) {
  return String(value ?? '').replace(/[<>]/g, '').slice(0, max);
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid amount.');
  return Number(n.toFixed(2));
}

function buildMayaPayload(order) {
  if (!order || !order.customer || !Array.isArray(order.items) || !order.items.length) {
    throw new Error('Invalid MENSIFY order.');
  }

  const total = money(order.totals?.total);
  if (total <= 0) throw new Error('Order total must be greater than zero.');

  const items = order.items.map((item) => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const unit = money(item.price);
    return {
      name: cleanText(item.name, 120),
      quantity: qty,
      code: cleanText(item.productId || 'MENSIFY', 36),
      description: cleanText(`${item.size || ''} ${item.color || ''}`.trim(), 200),
      amount: { value: unit, currency: 'PHP' },
      totalAmount: { value: Number((unit * qty).toFixed(2)), currency: 'PHP' }
    };
  });

  // Maya requires the totalAmount to match the checkout amount. MENSIFY's existing
  // subtotal/shipping/tax/coupon calculation is preserved; the server uses that total.
  return {
    totalAmount: { value: total, currency: 'PHP' },
    buyer: {
      firstName: cleanText(order.customer.fullName?.split(' ')[0] || 'MENSIFY', 50),
      lastName: cleanText(order.customer.fullName?.split(' ').slice(1).join(' ') || 'Customer', 50),
      contact: {
        phone: cleanText(order.customer.phone, 30),
        email: cleanText(order.customer.email, 120)
      },
      billingAddress: {
        line1: cleanText(order.customer.address, 200),
        city: cleanText(order.customer.city, 80),
        state: cleanText(order.customer.province, 80),
        zipCode: cleanText(order.customer.zip, 20),
        countryCode: 'PH'
      }
    },
    items,
    redirectUrl: {
      success: `${BASE_URL}/payment.html?maya=success`,
      failure: `${BASE_URL}/payment.html?maya=failure`,
      cancel: `${BASE_URL}/payment.html?maya=cancel`
    },
    requestReferenceNumber: `MENSIFY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  };
}

// Create a real Maya-hosted Checkout session.
app.post('/api/maya/checkout', async (req, res) => {
  try {
    if (!MAYA_PUBLIC_KEY) {
      return res.status(503).json({
        ok: false,
        error: 'Maya Sandbox Public API Key is not configured. Add MAYA_PUBLIC_KEY to .env and restart the server.'
      });
    }
    const payload = buildMayaPayload(req.body);
    const response = await fetch(`${MAYA_API}/checkout/v1/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(MAYA_PUBLIC_KEY),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      console.error('Maya Create Checkout failed:', response.status, data);
      return res.status(response.status).json({
        ok: false,
        error: data?.message || data?.error || 'Maya rejected the checkout request.',
        details: data
      });
    }

    const checkoutId = data.checkoutId || data.id;
    const redirectUrl = data.redirectUrl;
    if (typeof redirectUrl !== 'string' || !/^https:\/\//i.test(redirectUrl)) {
      console.error('Maya response did not contain a valid hosted checkout redirect URL:', data);
      return res.status(502).json({ ok: false, error: 'Maya accepted the request but did not return a valid hosted checkout URL.', details: data });
    }
    console.log('Maya checkout created:', checkoutId || '(no checkout ID)', redirectUrl);
    res.json({
      ok: true,
      checkoutId,
      redirectUrl,
      requestReferenceNumber: payload.requestReferenceNumber
    });
  } catch (err) {
    console.error('Maya checkout error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unable to connect to Maya.' });
  }
});

// Public-key endpoint: the browser can fetch the configured key status without exposing a secret key.
app.get('/api/maya/config', (_req, res) => {
  res.json({ ok: true, provider: 'Maya Checkout Sandbox', configured: Boolean(MAYA_PUBLIC_KEY), mode: 'sandbox' });
});

// Maya Checkout payment status uses the Public API Key.
app.get('/api/maya/status/:paymentId', async (req, res) => {
  try {
    if (!MAYA_PUBLIC_KEY) {
      return res.status(503).json({
        ok: false,
        error: 'Maya Sandbox Public API Key is not configured. Add MAYA_PUBLIC_KEY to .env and restart the server.'
      });
    }
    const paymentId = encodeURIComponent(req.params.paymentId);
    const response = await fetch(`${MAYA_API}/payments/v1/payments/${paymentId}/status`, {
      headers: { Authorization: basicAuthHeader(MAYA_PUBLIC_KEY) }
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Unable to retrieve Maya payment status.' });
  }
});

// Webhook endpoint. For a production deployment, put this behind HTTPS and register it in Maya.
app.post('/api/maya/webhook', (req, res) => {
  console.log('Maya webhook received:', JSON.stringify(req.body));
  res.sendStatus(200);
});

app.get('/api/health', async (_req, res) => { let mysqlStatus='disconnected'; try { await pool.query('SELECT 1'); mysqlStatus='connected'; } catch {} res.json({ ok:true, maya:'sandbox', mysql:mysqlStatus }); });

app.listen(PORT, () => {
  console.log(`MENSIFY running at ${BASE_URL}`);
  console.log(`Maya Checkout Sandbox: ${MAYA_API}`);
  console.log(`Maya public key loaded: ${MAYA_PUBLIC_KEY ? 'YES' : 'NO'}`);
});
