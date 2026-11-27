const state = {
  bootstrap: null,
  qualityEvaluations: new Map(),
};

const VIEW_TITLES = {
  command: 'غرفة القيادة التنفيذية — العرب الماسي',
  advisor: 'الوكيل الإداري التنفيذي (22 تخصصاً)',
  profitability: 'حاسبة الربحية ونقطة التعادل (ROAS)',
  carts: 'مهارة السلات المتروكة التلقائية (القسم 17)',
  product: 'محرك كتابة صفحات المنتجات الهجين (القسم 10)',
  quality: 'بوابة الجودة من 60 زاوية ومعايير الإتقان العشرة',
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function numOrNull(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function switchView(viewId) {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `view-${viewId}`);
  });
  document.getElementById('page-title').textContent = VIEW_TITLES[viewId] || VIEW_TITLES.command;
}

function renderCommandView(data) {
  const snap = data.snapshot;
  const sum = snap.dashboardSummary;

  document.getElementById('os-version').textContent = data.version;
  document.getElementById('sheet-external-link').href = snap.sheetUrl;
  document.getElementById('live-decision-text').textContent = snap.currentExecutiveDecision;
  document.getElementById('sync-status-line').textContent =
    `آخر قراءة من لوحة المتابعة: ${snap.capturedAtRiyadh} · تبويبات البيانات الحية (زد: ${snap.tabCounts.zidRows} | واتساب: ${snap.tabCounts.whatsappRows} | إعلانات: ${snap.tabCounts.adsRows} | بحث: ${snap.tabCounts.searchRows})`;

  const badge = document.getElementById('connection-badge');
  if (snap.connectionStatus === 'live') {
    badge.textContent = 'متصل حيّ بـ Google Sheets';
    badge.className = 'status-tag tag-ok';
  } else if (snap.connectionStatus === 'cached') {
    badge.textContent = 'لقطة محفوظة';
    badge.className = 'status-tag tag-warn';
  } else {
    badge.textContent = 'تعذر الاتصال';
    badge.className = 'status-tag tag-fail';
  }

  const kpis = [
    {
      label: 'المهام الحرجة المفتوحة',
      value: sum.openCriticalTasks ?? 'غير متوفر',
      note: 'أولوية قصوى: A-01 وA-02',
    },
    {
      label: 'المخاطر الحرجة',
      value: sum.criticalRisks ?? 'غير متوفر',
      note: 'R-01 هدر الإنفاق · R-02 نفاد المخزون',
    },
    {
      label: 'CTR البحث (مرصود)',
      value: sum.searchCtrLabel ?? 'غير متوفر',
      note: `${sum.searchClicks ?? '—'} نقرة / ${sum.searchImpressions ?? '—'} ظهور (مفلتر لاستعلام واحد)`,
    },
    {
      label: 'المستهدف التشغيلي ROAS',
      value: sum.targetMinRoas ? `${sum.targetMinRoas}x` : '≥ 3.0x',
      note: `الميثاق ≥3x · الدليل ${sum.targetMinRoas ?? '—'}x (مستهدف وليس فعلياً)`,
    },
    {
      label: 'مبيعات شهرية مستهدفة',
      value: sum.targetMonthlySales ? `${sum.targetMonthlySales.toLocaleString('en-US')} ر.س` : 'غير متوفر',
      note: `ميزانية الدليل: ${sum.guideMonthlyBudget ?? '—'} ر.س`,
    },
  ];

  document.getElementById('command-kpis').innerHTML = kpis
    .map(
      (k) => `
      <div class="kpi-card">
        <div class="kpi-label">${esc(k.label)}</div>
        <div class="kpi-value">${esc(k.value)}</div>
        <div class="kpi-note">${esc(k.note)}</div>
      </div>`,
    )
    .join('');

  document.getElementById('tasks-table-body').innerHTML = snap.tasksAndRisks.length
    ? snap.tasksAndRisks
        .map(
          (r) => `
        <tr>
          <td><strong>${esc(r.id)}</strong></td>
          <td>${esc(r.type)}</td>
          <td><span class="priority-${esc(r.priority.toLowerCase())}">${esc(r.priority)}</span></td>
          <td><strong>${esc(r.title)}</strong><div class="muted">${esc(r.description)}</div></td>
          <td>${esc(r.namedOwner || r.functionalOwner)}</td>
          <td>${esc(r.status)}</td>
          <td>${esc(r.closureEvidence)}</td>
        </tr>`,
        )
        .join('')
    : '<tr><td colspan="7" class="muted">لا توجد سجلات مقروءة حالياً.</td></tr>';

  document.getElementById('tools-list').innerHTML = data.tools
    .map(
      (t) => `
      <li class="tool-item">
        <div>
          <div class="tool-name">${esc(t.name)}</div>
          <div class="tool-detail">${esc(t.detail)}</div>
        </div>
        <span class="status-tag ${t.connected ? 'tag-ok' : 'tag-warn'}">${t.connected ? 'متصل' : 'يحتاج إعداد'}</span>
      </li>`,
    )
    .join('');

  document.getElementById('branches-grid').innerHTML = data.branches
    .map(
      (b) => `
      <div class="branch-card">
        <h3>${esc(b.nameAr)}</h3>
        <p>${esc(b.addressAr)}</p>
        <small>${esc(b.notes)}</small>
      </div>`,
    )
    .join('');

  document.getElementById('zid-proof-body').innerHTML = snap.zidProofRows.length
    ? snap.zidProofRows
        .map(
          (z) => `
        <tr>
          <td>${esc(z.productName)}</td>
          <td><code>${esc(z.sku)}</code></td>
          <td><strong>${esc(z.availableQuantity)}</strong></td>
          <td>${esc(z.warehouse)}</td>
        </tr>`,
        )
        .join('')
    : '<tr><td colspan="4" class="muted">لا توجد صفوف إثبات.</td></tr>';
}

function renderAdvisorOutput(res) {
  const b = res.brief;
  const html = `
    <article class="brief-block">
      <div class="panel-head">
        <h2>القرار التنفيذي</h2>
        <span class="status-tag tag-ok">${res.mode === 'llm-enhanced' ? 'محرك ذكي + بيانات حية' : 'محرك تنفيذي حتمي + بيانات حية'}</span>
      </div>
      <div class="decision-banner">
        <span class="decision-label">القرار أولاً</span>
        <p>${esc(b.decisionFirst)}</p>
      </div>

      ${res.llmNarrative ? `<h3>التحليل التنفيذي المفصل</h3><div class="cart-message">${esc(res.llmNarrative)}</div>` : ''}

      <h3>النتائج والأدلة</h3>
      <ul>${b.summaryAndEvidence.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>

      <h3>القرار النهائي</h3>
      <p><strong>${esc(b.finalDecision)}</strong></p>

      <h3>أول ثلاث خطوات الآن</h3>
      <ol>${b.firstThreeStepsNow.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>

      <h3>ما يجب قياسه</h3>
      <ul>${b.whatToMeasure.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>

      <h3>النتيجة المتوقعة دون ضمان</h3>
      <p>${esc(b.expectedOutcomeNoGuarantee)}</p>

      <h3>موعد المراجعة</h3>
      <p>${esc(b.reviewSchedule)}</p>

      ${
        b.blockersOrMissingPermissions.length
          ? `<h3>العوائق أو الصلاحيات الناقصة</h3><ul>${b.blockersOrMissingPermissions.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
          : ''
      }

      <h3>التخصصات والأدوات المفعّلة تلقائياً</h3>
      <p class="muted">${esc(b.activatedLenses.join(' · '))}</p>
    </article>
  `;
  document.getElementById('advisor-output').innerHTML = html;
}

function renderProfitabilityOutput(report) {
  const { kpis, assessment } = report;
  const toneClass = assessment.scalingAllowed
    ? 'tag-ok'
    : assessment.aboveBreakEvenRoas === false
      ? 'tag-fail'
      : 'tag-warn';

  const entries = [
    ['معدل التحويل CVR', kpis.cvr],
    ['متوسط قيمة الطلب AOV', kpis.aov],
    ['تكلفة الطلب CPA', kpis.cpa],
    ['تكلفة اكتساب العميل CAC', kpis.cac],
    ['العائد الإعلاني ROAS', kpis.roas],
    ['معدل النقر CTR', kpis.ctr],
    ['هامش المساهمة قبل الإعلان', kpis.contributionMarginBeforeAds],
    ['نسبة هامش المساهمة', kpis.contributionMarginPctBeforeAds],
    ['هامش المساهمة بعد الإعلان', kpis.contributionMarginAfterAds],
    ['نقطة التعادل Break-even ROAS', kpis.breakEvenRoas],
  ];

  document.getElementById('profit-output').innerHTML = `
    <div class="profit-verdict ${toneClass}">${esc(assessment.verdictAr)}</div>
    <div class="profit-kpi-grid">
      ${entries
        .map(
          ([label, m]) => `
        <div class="mini-kpi">
          <span>${esc(label)}</span>
          <strong>${esc(m.formatted)}</strong>
          <div class="muted">${esc(m.formula)}</div>
        </div>`,
        )
        .join('')}
    </div>
    ${
      assessment.warnings.length
        ? `<h3 style="margin-top:14px;font-size:14px;">تنبيهات الحوكمة والدقة</h3><ul>${assessment.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`
        : ''
    }
  `;
}

function renderCartsOutput(res) {
  const header = `
    <div class="panel">
      <strong>${esc(res.noticeAr)}</strong>
      <div class="muted" style="margin-top:4px;">${esc(res.sourceNote || '')} · وقت الفحص: ${esc(res.evaluatedAtRiyadh)} · مستبعد بسبب إتمام الطلب: ${res.excludedCompletedOrders} · خارج النافذة: ${res.excludedOutOfWindow}</div>
    </div>
  `;

  const cards = res.drafts
    .map(
      (d) => `
      <article class="cart-card">
        <div class="panel-head">
          <h2>${esc(d.customerName)} — ${esc(d.productName)} (${esc(d.sizeLabel)})</h2>
          <span class="status-tag tag-warn">بانتظار اعتمادك قبل الإرسال</span>
        </div>
        <div class="muted">السلة: ${esc(d.cartId)} · تاريخ الإنشاء: ${esc(d.createdAtRiyadh)} (منذ ${d.ageHours} ساعة)</div>
        <div class="cart-message">${esc(d.messageText)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div><strong>رقم الجوال للنسخ:</strong> <code dir="ltr">${esc(d.rawPhoneForCopy)}</code></div>
          ${
            d.whatsappUrl
              ? `<a class="btn btn-primary" href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">فتح واتساب بالنص الجاهز ↗</a>`
              : ''
          }
        </div>
      </article>`,
    )
    .join('');

  document.getElementById('carts-output').innerHTML = header + cards;
}

function renderProductOutput(pkg) {
  document.getElementById('product-output').innerHTML = `
    ${
      pkg.unverifiedWarnings.length
        ? `<div class="profit-verdict tag-warn">${pkg.unverifiedWarnings.map((w) => `<div>• ${esc(w)}</div>`).join('')}</div>`
        : ''
    }
    <h3>العنوان التجاري</h3>
    <p><strong>${esc(pkg.commercialTitle)}</strong></p>

    <h3>SEO Title & Meta Description</h3>
    <p><strong>SEO Title:</strong> ${esc(pkg.seo.seoTitle)}<br/><strong>Meta:</strong> ${esc(pkg.seo.metaDescription)}</p>

    <h3>الوصف المختصر</h3>
    <p>${esc(pkg.shortDescription)}</p>

    <h3>الوصف التفصيلي الهجين (${pkg.wordCount} كلمة)</h3>
    <div class="cart-message">${esc(pkg.detailedHybridDescription)}</div>

    <h3>جدول المواصفات</h3>
    <table class="data-table">
      <thead><tr><th>المواصفة</th><th>القيمة</th><th>الحالة</th></tr></thead>
      <tbody>
        ${pkg.specsTable
          .map(
            (s) => `
          <tr>
            <td>${esc(s.label)}</td>
            <td>${esc(s.value)}</td>
            <td><span class="status-tag ${s.verified ? 'tag-ok' : 'tag-warn'}">${s.verified ? 'مثبت' : 'يحتاج تحقق'}</span></td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    <h3>5 عبارات بحث شرائية طبيعية</h3>
    <ul>${pkg.seo.buyingQueries.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>

    <h3>الأسئلة الشائعة (FAQ)</h3>
    <ul>${pkg.faq.map((f) => `<li><strong>${esc(f.question)}</strong><br/>${esc(f.answer)}</li>`).join('')}</ul>

    <h3>الصور وALT عربي وإنجليزي (WebP 1000×1000)</h3>
    <ul>${pkg.seo.images.map((im) => `<li><code>${esc(im.seoFilename)}</code><br/>AR: ${esc(im.altAr)}<br/>EN: ${esc(im.altEn)}</li>`).join('')}</ul>

    <h3>Schema JSON-LD (Product)</h3>
    <pre class="code-block">${esc(JSON.stringify(pkg.schemaJsonLd, null, 2))}</pre>
  `;
}

function renderQualityDomains(domains) {
  const container = document.getElementById('quality-domains-list');
  container.innerHTML = domains
    .map(
      (d) => `
      <article class="domain-card">
        <h3>${d.id}. ${esc(d.title)}</h3>
        ${d.checkpoints
          .map((cp) => {
            const cur = state.qualityEvaluations.get(cp.id) || { status: 'unverifiable', evidence: '' };
            return `
            <div class="check-row" data-cp="${esc(cp.id)}">
              <strong>${esc(cp.id)}</strong>
              <div>
                <div><strong>${esc(cp.title)}</strong></div>
                <div class="muted">${esc(cp.requirement)}</div>
              </div>
              <select class="q-status" data-id="${esc(cp.id)}">
                <option value="unverifiable" ${cur.status === 'unverifiable' ? 'selected' : ''}>متعذر التحقق</option>
                <option value="pass" ${cur.status === 'pass' ? 'selected' : ''}>ناجح (يتطلب دليلاً)</option>
                <option value="fail" ${cur.status === 'fail' ? 'selected' : ''}>فاشل</option>
                <option value="na" ${cur.status === 'na' ? 'selected' : ''}>غير منطبق</option>
              </select>
              <input type="text" class="q-evidence" data-id="${esc(cp.id)}" value="${esc(cur.evidence)}" placeholder="أرفق الدليل الفعلي هنا..." />
            </div>`;
          })
          .join('')}
      </article>`,
    )
    .join('');

  container.querySelectorAll('.q-status').forEach((el) => {
    el.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const prev = state.qualityEvaluations.get(id) || { status: 'unverifiable', evidence: '' };
      state.qualityEvaluations.set(id, { ...prev, status: e.target.value });
    });
  });

  container.querySelectorAll('.q-evidence').forEach((el) => {
    el.addEventListener('input', (e) => {
      const id = e.target.dataset.id;
      const prev = state.qualityEvaluations.get(id) || { status: 'unverifiable', evidence: '' };
      state.qualityEvaluations.set(id, { ...prev, evidence: e.target.value });
    });
  });
}

async function evaluateGate() {
  const evaluations = [...state.qualityEvaluations.entries()].map(([id, val]) => ({
    id,
    status: val.status,
    evidence: val.evidence,
  }));
  const res = await fetch('/api/quality-gate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evaluations }),
  });
  const report = await res.json();
  const s = report.summary;
  const tone = s.readyForDelivery ? 'tag-ok' : s.fail > 0 ? 'tag-fail' : 'tag-warn';

  document.getElementById('quality-summary').innerHTML = `
    <div class="profit-verdict ${tone}">
      ${esc(s.verdictAr)} · (ناجح: ${s.pass} | فاشل: ${s.fail} | متعذر التحقق: ${s.unverifiable} | غير منطبق: ${s.na} من أصل ${report.totalChecks})
    </div>
  `;

  document.getElementById('mastery-grid').innerHTML = report.masteryCriteria
    .map(
      (m) => `
      <div class="mastery-item">
        <span>${m.id}. ${esc(m.title)}</span>
        <span class="status-tag ${m.status === 'pass' ? 'tag-ok' : m.status === 'fail' ? 'tag-fail' : 'tag-warn'}">${esc(m.statusAr)}</span>
      </div>`,
    )
    .join('');
}

async function loadBootstrap(refresh = false) {
  const res = await fetch(`/api/bootstrap${refresh ? '?refresh=1' : ''}`);
  const data = await res.json();
  state.bootstrap = data;
  renderCommandView(data);
  renderQualityDomains(data.qualityDomains);
  await evaluateGate();
}

// ربط الأحداث
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('btn-refresh-snapshot').addEventListener('click', () => loadBootstrap(true));

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.getElementById('advisor-input').value = chip.dataset.prompt;
    document.getElementById('advisor-form').requestSubmit();
  });
});

document.getElementById('advisor-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('advisor-input').value.trim();
  if (!query) return;
  const res = await fetch('/api/advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  renderAdvisorOutput(await res.json());
});

document.getElementById('profit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {};
  for (const [k, v] of fd.entries()) payload[k] = numOrNull(v);
  const res = await fetch('/api/profitability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  renderProfitabilityOutput(await res.json());
});

async function runCarts(fetchLiveZid) {
  const windowHours = Number(document.getElementById('cart-window-hours').value || 24);
  const limit = Number(document.getElementById('cart-limit').value || 3);
  let carts = [];
  if (!fetchLiveZid) {
    const raw = document.getElementById('manual-carts-json').value.trim();
    if (raw) {
      try {
        carts = JSON.parse(raw);
      } catch {
        alert('صيغة JSON المدخلة غير صحيحة. يرجى التأكد من الأقواس والفواصل.');
        return;
      }
    }
  }
  const res = await fetch('/api/abandoned-carts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fetchLiveZid, windowHours, limit, carts }),
  });
  renderCartsOutput(await res.json());
}

document.getElementById('btn-fetch-live-carts').addEventListener('click', () => runCarts(true));
document.getElementById('btn-process-manual-carts').addEventListener('click', () => runCarts(false));

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    productNameAr: fd.get('productNameAr'),
    productNameEn: fd.get('productNameEn') || undefined,
    category: fd.get('category'),
    sku: fd.get('sku') || undefined,
    priceSar: numOrNull(fd.get('priceSar')),
    color: fd.get('color') || undefined,
    fabric: fd.get('fabric') || undefined,
    collarType: fd.get('collarType') || undefined,
    sleeveType: fd.get('sleeveType') || undefined,
    closureType: fd.get('closureType') || undefined,
    imageCount: Number(fd.get('imageCount') || 3),
    availableSizes: String(fd.get('availableSizes') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    verifiedFeatures: String(fd.get('verifiedFeatures') || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
  const res = await fetch('/api/product-writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  renderProductOutput(await res.json());
});

document.getElementById('btn-evaluate-gate').addEventListener('click', evaluateGate);

loadBootstrap(false);
