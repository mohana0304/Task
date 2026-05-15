const express = require('express');
const path    = require('path');
const { Pool } = require('pg');

const app  = express();
const pool = new Pool({
  user:     'postgres',
  host:     'localhost',
  database: 'AvolveTyres',
  password: 'Mohana@0304',
  port:     5432
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

/* ─────────────────────────────────────────────────────────────────
   SCHEMA DIAGNOSTIC  →  /schema
───────────────────────────────────────────────────────────────── */
app.get('/schema', async (req, res) => {
  try {
    const tables = await pool.query(`
      SELECT t.table_name, c.column_name, c.data_type, c.is_nullable
      FROM information_schema.tables  t
      JOIN information_schema.columns c
        ON c.table_name   = t.table_name
       AND c.table_schema = t.table_schema
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `);
    const tableNames = [...new Set(tables.rows.map(r => r.table_name))];
    const counts = {};
    for (const tbl of tableNames) {
      const r = await pool.query(`SELECT COUNT(*) AS n FROM "${tbl}"`);
      counts[tbl] = r.rows[0].n;
    }
    const schema = {};
    for (const row of tables.rows) {
      if (!schema[row.table_name]) schema[row.table_name] = [];
      schema[row.table_name].push(`${row.column_name} (${row.data_type}${row.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
    }
    let html = `<html><head><style>
      body{font-family:monospace;padding:2rem;background:#f8f5ff}
      h1{color:#7c3aed} h2{color:#4c1d95;border-bottom:1px solid #ede9fe;margin-top:1.5rem}
      ul{margin:.3rem 0 0 1rem;color:#374151} .c{color:#6b7280;font-size:.85rem;margin-left:.5rem}
    </style></head><body>
    <h1>AvolveTyres — Database Schema</h1>
    <p style="color:#6b7280">${tableNames.length} tables found</p>`;
    for (const tbl of tableNames) {
      html += `<h2>${tbl}<span class="c">(${counts[tbl]} rows)</span></h2><ul>`;
      for (const col of schema[tbl]) html += `<li>${col}</li>`;
      html += '</ul>';
    }
    html += '</body></html>';
    res.send(html);
  } catch (err) {
    res.status(500).send('<pre>Schema error: ' + err.message + '</pre>');
  }
});

/* ─────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────────── */
app.get('/', async (req, res) => {
  try {

    // ── TYRE PURCHASE ────────────────────────────────────────────────────
    // tyre_purchases has 0 rows but the table exists — safe to query
    const tyrePurchaseQ = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS total_purchased
      FROM tyre_purchases
      WHERE EXTRACT(QUARTER FROM purchase_date) = EXTRACT(QUARTER FROM CURRENT_DATE)
        AND EXTRACT(YEAR   FROM purchase_date)  = EXTRACT(YEAR   FROM CURRENT_DATE)
    `);

    const purchaseMonthly = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', purchase_date), 'Mon') AS month,
        EXTRACT(MONTH FROM purchase_date)::int             AS month_num,
        SUM(quantity)                                      AS qty
      FROM tyre_purchases
      WHERE purchase_date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    // purchase_commitments table: quarter (varchar), commitment_qty, target_percentage
    const commitmentQ = await pool.query(`
      SELECT
        COALESCE(SUM(commitment_qty), 0)      AS committed_qty,
        COALESCE(MAX(target_percentage), 85)  AS target_pct
      FROM purchase_commitments
      WHERE quarter = 'Q' || EXTRACT(QUARTER FROM CURRENT_DATE)::text
                          || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::text
    `);

    const totalPurchased  = parseInt(tyrePurchaseQ.rows[0].total_purchased) || 0;
    const committedQty    = parseInt(commitmentQ.rows[0].committed_qty)     || 0;
    const purchasePct     = committedQty > 0
      ? Math.round(totalPurchased / committedQty * 100)
      : null;

    // ── TYRE HEALTH & PERFORMANCE ────────────────────────────────────────
    // tyre_installations: vehicle_id, tyre_id, running_km, running_days, active
    const activeTyres = await pool.query(`
      SELECT COUNT(*) AS count FROM tyre_installations WHERE active = true
    `);

    // inspections: tyre_id, tread_depth_mm, inspection_date, mileage, condition
    const under4mm = await pool.query(`
      SELECT COUNT(*) AS count
      FROM inspections i
      JOIN (
        SELECT tyre_id, MAX(inspection_date) AS latest
        FROM inspections GROUP BY tyre_id
      ) li ON i.tyre_id = li.tyre_id AND i.inspection_date = li.latest
      WHERE i.tread_depth_mm < 4
    `);

    const avgRunningDays = await pool.query(`
      SELECT ROUND(AVG(running_days)) AS avg_days
      FROM tyre_installations WHERE active = true
    `);

    // Mileage distribution — from inspections.mileage (latest per tyre)
    const mileageData = await pool.query(`
      SELECT
        CASE
          WHEN i.mileage < 20000 THEN '0-20k'
          WHEN i.mileage < 40000 THEN '20-40k'
          ELSE '40k+'
        END      AS bucket,
        COUNT(*) AS tyre_count
      FROM inspections i
      JOIN (
        SELECT tyre_id, MAX(inspection_date) AS latest
        FROM inspections GROUP BY tyre_id
      ) li ON i.tyre_id = li.tyre_id AND i.inspection_date = li.latest
      WHERE i.mileage IS NOT NULL
      GROUP BY bucket
      ORDER BY MIN(i.mileage)
    `);

    // Retreatability: tyres where status = 'retreadable'
    const retreatability = await pool.query(`
      SELECT
        COUNT(*)                                                      AS total,
        COUNT(*) FILTER (WHERE status = 'retreadable')               AS retreadable_count,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'retreadable')::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        )                                                             AS pct
      FROM tyres
    `);

    // Durability: running_km vs warranty_km from tyre_installations JOIN tyres
    const durabilityFactor = await pool.query(`
      SELECT ROUND(
        AVG(
          CASE WHEN t.warranty_km > 0
               THEN LEAST(ti.running_km::numeric / t.warranty_km * 100, 100)
               ELSE NULL
          END
        ), 1
      ) AS pct
      FROM tyre_installations ti
      JOIN tyres t ON t.id = ti.tyre_id
      WHERE ti.active = true AND t.warranty_km IS NOT NULL AND t.warranty_km > 0
    `);

    // ── VEHICLES ─────────────────────────────────────────────────────────
    // vehicles: id, vehicle_number, vehicle_type, make, model, status, enrolled_date
    const vehiclesEnrolled = await pool.query(`
      SELECT COUNT(*) AS count FROM vehicles
    `);

    const vehiclesMapped = await pool.query(`
      SELECT COUNT(DISTINCT vehicle_id) AS count FROM tyre_installations
    `);

    // Vehicle inspection history by distinct vehicle per period
    const vehicleHistory = await pool.query(`
      SELECT
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '7 days')   AS last_7,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '15 days')  AS last_15,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '30 days')  AS last_1m,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '90 days')  AS last_3m,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '180 days') AS last_6m
      FROM inspections
    `);

    // ── INSPECTION ───────────────────────────────────────────────────────
    const vehiclesInspected = await pool.query(`
      SELECT
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '30 days')  AS last_30,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '60 days')  AS last_60,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '90 days')  AS last_90,
        COUNT(DISTINCT vehicle_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '120 days') AS last_120
      FROM inspections
    `);

    const tyresInspected = await pool.query(`
      SELECT
        COUNT(DISTINCT tyre_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '30 days')  AS last_30,
        COUNT(DISTINCT tyre_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '60 days')  AS last_60,
        COUNT(DISTINCT tyre_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '90 days')  AS last_90,
        COUNT(DISTINCT tyre_id) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '120 days') AS last_120
      FROM inspections
    `);

    const total = parseInt(vehiclesEnrolled.rows[0].count);
    const vi    = vehiclesInspected.rows[0];
    const vehiclesNotInsp = {
      last_30:  total - parseInt(vi.last_30),
      last_60:  total - parseInt(vi.last_60),
      last_90:  total - parseInt(vi.last_90),
      last_120: total - parseInt(vi.last_120)
    };

    // Monthly inspection variation
    const inspectionMonthly = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', inspection_date), 'Mon') AS month,
        EXTRACT(MONTH FROM inspection_date)::int             AS month_num,
        COUNT(*)                                             AS total
      FROM inspections
      WHERE inspection_date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    // ── WEAR PATTERNS ────────────────────────────────────────────────────
    // wear_patterns: inspection_id, pattern_name, severity, recommendation
    const wearPatterns = await pool.query(`
      SELECT
        pattern_name,
        COUNT(*)           AS tyre_count,
        MIN(severity)      AS severity,
        MIN(recommendation) AS recommendation
      FROM wear_patterns
      GROUP BY pattern_name
      ORDER BY tyre_count DESC
      LIMIT 5
    `);

    // ── RENDER ───────────────────────────────────────────────────────────
    res.render('dashboard', {
      totalPurchased,
      committedQty,
      purchasePct,
      purchaseMonthly:   purchaseMonthly.rows,

      activeTyres:       activeTyres.rows[0].count,
      under4mm:          under4mm.rows[0].count,
      avgRunningDays:    avgRunningDays.rows[0].avg_days || '—',
      mileageData:       mileageData.rows,
      durabilityFactor:  durabilityFactor.rows[0].pct   || '—',
      retreatability:    retreatability.rows[0].pct     || '—',

      vehiclesEnrolled:  vehiclesEnrolled.rows[0].count,
      vehiclesMapped:    vehiclesMapped.rows[0].count,
      vehicleHistory:    vehicleHistory.rows[0],

      vehiclesInspected: vehiclesInspected.rows[0],
      tyresInspected:    tyresInspected.rows[0],
      vehiclesNotInsp,
      inspectionMonthly: inspectionMonthly.rows,

      wearPatterns:      wearPatterns.rows
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send(
      `<h2 style="font-family:sans-serif;color:#991b1b">Database error</h2>
       <pre style="background:#fff;padding:1rem;border-radius:8px;font-family:monospace">${err.message}</pre>
       <p style="font-family:sans-serif"><a href="/schema">→ Open /schema</a> to see all tables &amp; columns</p>`
    );
  }
});

/* ─────────────────────────────────────────────────────────────────
   DRILL-DOWN API ENDPOINTS
───────────────────────────────────────────────────────────────── */

// Vehicles inspected in last N days
app.get('/api/vehicles-inspected', async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const r = await pool.query(`
      SELECT
        v.vehicle_number,
        v.vehicle_type,
        v.make,
        v.model,
        MAX(i.inspection_date)  AS last_inspected,
        MIN(i.tread_depth_mm)   AS min_tread_mm,
        i.condition
      FROM inspections i
      JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.inspection_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
      GROUP BY v.id, v.vehicle_number, v.vehicle_type, v.make, v.model, i.condition
      ORDER BY last_inspected DESC
    `, [days]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tyres inspected in last N days
app.get('/api/tyres-inspected', async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const r = await pool.query(`
      SELECT
        t.tyre_serial_number,
        t.brand,
        t.size,
        t.pattern,
        MAX(i.inspection_date)  AS last_inspected,
        MIN(i.tread_depth_mm)   AS tread_depth_mm,
        i.condition
      FROM inspections i
      JOIN tyres t ON t.id = i.tyre_id
      WHERE i.inspection_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
      GROUP BY t.id, t.tyre_serial_number, t.brand, t.size, t.pattern, i.condition
      ORDER BY last_inspected DESC
    `, [days]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Vehicles NOT inspected in last N days
app.get('/api/vehicles-not-inspected', async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const r = await pool.query(`
      SELECT
        v.vehicle_number,
        v.vehicle_type,
        v.make,
        v.model,
        MAX(i.inspection_date) AS last_inspected
      FROM vehicles v
      LEFT JOIN inspections i ON i.vehicle_id = v.id
      GROUP BY v.id, v.vehicle_number, v.vehicle_type, v.make, v.model
      HAVING MAX(i.inspection_date) < CURRENT_DATE - ($1 * INTERVAL '1 day')
          OR MAX(i.inspection_date) IS NULL
      ORDER BY last_inspected ASC NULLS FIRST
    `, [days]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tyres for a specific wear pattern
// wear_patterns links to inspections via inspection_id
// inspections links to vehicles via vehicle_id, to tyres via tyre_id
app.get('/api/wear-tyres', async (req, res) => {
  const pattern = req.query.pattern || '';
  try {
    const r = await pool.query(`
      SELECT
        t.tyre_serial_number,
        t.brand,
        t.size,
        v.vehicle_number,
        wp.pattern_name,
        wp.severity,
        wp.recommendation,
        i.inspection_date,
        i.tread_depth_mm
      FROM wear_patterns wp
      JOIN inspections i ON i.id        = wp.inspection_id
      JOIN tyres       t ON t.id        = i.tyre_id
      JOIN vehicles    v ON v.id        = i.vehicle_id
      WHERE wp.pattern_name = $1
      ORDER BY i.inspection_date DESC
    `, [pattern]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => console.log('Avolve Dashboard → http://localhost:3000'));