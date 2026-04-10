const fs = require('fs');
const path = require('path');
const https = require('https');

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => (row[h] = values[idx] || ''));
    rows.push(row);
  }
  return { headers, rows };
}

function transformRows(csvData, mappings, userId) {
  const mappedCsvColumns = new Set();
  mappings.forEach((m) => {
    if (m.dataField && m.csvColumn) mappedCsvColumns.add(m.csvColumn);
  });

  const cleanNumber = (val) => {
    if (val === null || val === undefined || String(val).trim() === '') return 0;
    const s = String(val).replace(/[$₦€¥£\s]/g, '').replace(/,/g, '');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };

  return csvData.rows.map((row) => {
    const mapping = mappings.reduce((acc, m) => {
      if (m.dataField) acc[m.dataField] = row[m.csvColumn];
      return acc;
    }, {});

    const rawDate = mapping.sale_date || mapping.date || row.sale_date || row.date || new Date().toISOString();
    const d = new Date(rawDate);
    const dateObj = isNaN(d.getTime()) ? new Date() : d;
    const sale_date = dateObj.toISOString().split('T')[0];

    const amount = cleanNumber(mapping.amount ?? mapping.value ?? row.amount ?? row.value);
    const quantity = cleanNumber(mapping.quantity ?? row.quantity ?? mapping.qty ?? row.qty);

    const additional_data = {};
    Object.keys(row).forEach((col) => {
      if (!mappedCsvColumns.has(col)) additional_data[col] = row[col];
    });

    // Preserve any non-schema columns inside additional_data: category, date, region, product
    if (mapping.category || row.category) additional_data.category = mapping.category || row.category;
    if (mapping.date || row.date) additional_data.date = mapping.date || row.date;
    if (mapping.region || row.region) additional_data.region = mapping.region || row.region;
    if (mapping.product || row.product) additional_data.product = mapping.product || row.product;

    return {
      user_id: userId,
      sale_date,
      amount,
      quantity: quantity || null,
      additional_data: Object.keys(additional_data).length ? additional_data : null,
    };
  });
}

// Simple .env.local parser
function loadEnv(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    lines.forEach((l) => {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    });
    return env;
  } catch (e) {
    return {};
  }
}

function postToSupabase(restUrl, serviceKey, batch) {
  return new Promise((resolve, reject) => {
    const url = new URL(restUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=representation',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && (res.statusCode === 201 || res.statusCode === 200)) {
          try {
            const parsed = JSON.parse(data || '[]');
            resolve({ ok: true, data: parsed });
          } catch (e) {
            resolve({ ok: true, data: null });
          }
        } else {
          reject(new Error(`Supabase insert failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(JSON.stringify(batch));
    req.end();
  });
}

(async () => {
  const csvPath = path.join(__dirname, '..', 'sample_upload.csv');
  const text = fs.readFileSync(csvPath, 'utf8');
  const csvData = parseCSV(text);

  const mappings = csvData.headers.map((h) => ({ csvColumn: h, dataField: h }));

  const env = loadEnv(path.join(__dirname, '..', '.env.local'));
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
  const userId = process.env.DEMO_USER_ID || env.DEMO_USER_ID || 'local-test-user';
  const DRY_RUN = (process.env.DRY_RUN || env.DRY_RUN || 'true').toLowerCase() === 'true';

  const processed = transformRows(csvData, mappings, userId);

  const outPath = path.join(__dirname, '..', 'sample_payload.json');
  fs.writeFileSync(outPath, JSON.stringify(processed, null, 2), 'utf8');

  console.log('Processed', processed.length, 'rows. Sample:');
  console.log(JSON.stringify(processed.slice(0, 2), null, 2));
  console.log('Wrote payload to', outPath);

  const CHUNK_SIZE = 500;
  const totalBatches = Math.ceil(processed.length / CHUNK_SIZE);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('SUPABASE_URL or SERVICE_ROLE_KEY not found. Skipping POST (dry-run).');
    return;
  }

  for (let b = 0; b < totalBatches; b++) {
    const start = b * CHUNK_SIZE;
    const batch = processed.slice(start, start + CHUNK_SIZE);
    console.log(`Batch ${b + 1}/${totalBatches}: ${batch.length} rows`);

    if (DRY_RUN) {
      console.log('DRY_RUN=true — not sending to Supabase. Sample payload:');
      console.log(JSON.stringify(batch.slice(0, 1), null, 2));
      continue;
    }

    try {
      const restUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sales`;
      const res = await postToSupabase(restUrl, SERVICE_KEY, batch);
      console.log('Inserted batch', b + 1, 'rows inserted:', Array.isArray(res.data) ? res.data.length : 'unknown');
    } catch (err) {
      console.error('Error inserting batch', b + 1, err.message || err);
      process.exit(1);
    }
  }
})();
