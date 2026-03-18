// ===== MÓDULO DE RELATÓRIOS – VISUAL CRM =====
const REL_TABS = [
  { id:'vendas',      icon:'💰', label:'Vendas' },
  { id:'pipeline',    icon:'🔄', label:'Pipeline' },
  { id:'conversao',   icon:'🎯', label:'Conversão por Fonte' },
  { id:'performance', icon:'🏆', label:'Performance' },
  { id:'forecast',    icon:'📡', label:'Forecast' },
  { id:'risco',       icon:'⚠️', label:'Deals em Risco' },
  { id:'produtos',    icon:'📦', label:'Produtos' },
  { id:'agendamentos',icon:'⏰', label:'Agendamentos' }
];

const CHART_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#7c3aed','#db2777','#ea580c'];
const MONTHS_6 = ['Out/25','Nov/25','Dez/25','Jan/26','Fev/26','Mar/26'];
let _charts = {};
let _relTab = 'vendas';

function _destroyChart(id) { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } }
function _mkChart(id, cfg) {
  _destroyChart(id);
  const canvas = document.getElementById(id);
  if (!canvas || typeof Chart === 'undefined') return;
  _charts[id] = new Chart(canvas, cfg);
  return _charts[id];
}

// ===== EXPORT FUNCTIONS =====
function exportCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '.csv';
  a.click();
  showToast('CSV exportado!', 'success');
}

function exportExcel(rows, headers, filename) {
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const colWidths = headers.map((h, i) => ({ wch: Math.max(h.length, ...rows.map(r => String(r[i]||'').length)) + 2 }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, filename + '.xlsx');
    showToast('Excel exportado!', 'success');
  } else {
    exportCSV([headers, ...rows], filename);
    showToast('xlsx.js indisponível – exportado como CSV', 'warning');
  }
}

function exportPrint(title) {
  const orig = document.title;
  document.title = title;
  window.print();
  document.title = orig;
}

function exportTabPDF(tabTitle) {
  const content = document.getElementById('relContent');
  if (!content) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>${tabTitle}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #1f2937; padding: 24px; }
      h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #1e40af; }
      h2 { font-size: 14px; font-weight: 700; margin: 16px 0 8px; border-bottom: 2px solid #2563eb; padding-bottom: 4px; color: #1e40af; }
      .subtitle { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; page-break-inside: avoid; }
      th { background: #f3f4f6; padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
      td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
      tr:nth-child(even) td { background: #f9fafb; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
      .kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
      .kpi-label { font-size: 9px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
      .kpi-value { font-size: 20px; font-weight: 700; }
      .kpi-sub { font-size: 10px; color: #9ca3af; }
      .badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; }
      .badge-fechado { background: #dcfce7; color: #16a34a; }
      .badge-pendente { background: #fef3c7; color: #d97706; }
      .badge-perdido { background: #fee2e2; color: #dc2626; }
      .funnel-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
      .funnel-label { width: 100px; font-size: 11px; font-weight: 600; }
      .funnel-bar-wrap { flex: 1; background: #f3f4f6; border-radius: 3px; height: 14px; }
      .funnel-bar { height: 100%; border-radius: 3px; }
      .funnel-meta { font-size: 11px; color: #6b7280; width: 180px; }
      .alert { padding: 10px 14px; border-radius: 6px; font-size: 12px; margin-bottom: 10px; border: 1px solid transparent; }
      .alert-danger { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
      .alert-warning { background: #fef3c7; border-color: #fcd34d; color: #92400e; }
      .alert-success { background: #dcfce7; border-color: #86efac; color: #14532d; }
      canvas, .rel-tabs, .rel-header, .filter-bar button, .btn, .table-actions, .product-drawer { display: none !important; }
      @media print { @page { margin: 1.5cm; size: A4; } body { padding: 0; } .kpi-grid { grid-template-columns: repeat(2,1fr); } }
    </style>
  </head>
  <body>
    <h1>Relatório: ${tabTitle}</h1>
    <p class="subtitle">Gerado em ${new Date().toLocaleString('pt-BR')} · Visual CRM – Comunicação Visual</p>
    <div>${content.innerHTML}</div>
    <script>setTimeout(() => { window.print(); }, 500);<\/script>
  </body></html>`);
  w.document.close();
}

// ===== SKELETON LOADING =====
function skeletonLoading(rows = 3) {
  return `<div class="skeleton-wrap">
    <div class="skeleton-kpi-grid">${[1,2,3,4].map(()=>`<div class="skeleton-card"><div class="sk sk-sm"></div><div class="sk sk-lg"></div><div class="sk sk-md"></div></div>`).join('')}</div>
    ${[...Array(rows)].map(()=>`<div class="sk sk-block" style="margin-bottom:8px"></div>`).join('')}
  </div>`;
}

// ===== MAIN ENTRY =====
window.RelatoriosModule = {
  render(area) {
    const tabsHtml = REL_TABS.map(t =>
      `<button class="rel-tab-btn${t.id===_relTab?' active':''}" data-tab="${t.id}">${t.icon} ${t.label}</button>`
    ).join('');

    area.innerHTML = `
      <div class="rel-header">
        <div class="rel-tabs">${tabsHtml}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-secondary btn-sm" onclick="exportTabPDF(document.querySelector('.rel-tab-btn.active')?.textContent||'Relatório')">📄 PDF</button>
          <button class="btn btn-secondary btn-sm" onclick="exportPrint('Relatório – Visual CRM')">🖨️ Imprimir</button>
        </div>
      </div>
      <div class="rel-content" id="relContent"></div>`;

    document.querySelectorAll('.rel-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _relTab = btn.dataset.tab;
        document.querySelectorAll('.rel-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === _relTab));
        this._renderTab(_relTab);
      });
    });

    this._renderTab(_relTab);
  },

  _renderTab(tab) {
    Object.keys(_charts).forEach(k => _destroyChart(k));
    const renders = {
      vendas: renderVendas, pipeline: renderPipelineTab,
      conversao: renderConversao, performance: renderPerformance,
      forecast: renderForecast, risco: renderRisco,
      produtos: renderProdutos, agendamentos: renderAgendamentos
    };
    if (renders[tab]) renders[tab]();
  }
};

function renderRelatorios(area) { window.RelatoriosModule.render(area); }

// ===== 1. VENDAS =====
let _vendasFilters = { from: '', to: '', responsavel: '', _debounce: null };

async function renderVendas() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(6);
  const [revenue] = await Promise.all([
    HOLDPRINT.getReportRevenue('2025-10-01','2026-03-31')
  ]);
  const data = revenue?.monthly || revenue || HOLDPRINT._M.revenue.monthly;
  const byResp = HOLDPRINT._M.revenue.by_responsible;
  window._vendasData = { data, byResp };
  _renderVendasContent(data, byResp);
}

function _renderVendasContent(data, byResp) {
  const el = document.getElementById('relContent');
  const totalRev = data.reduce((s,m) => s + m.revenue, 0);
  const totalDeals = data.reduce((s,m) => s + m.deals, 0);
  const melhorMes = data.reduce((a,b) => b.revenue > a.revenue ? b : a, data[0]);
  const totalMeta = data.reduce((s,m) => s + (m.meta||0), 0);
  const pctMeta = totalMeta > 0 ? Math.round(totalRev/totalMeta*100) : 0;
  const sellers = HOLDPRINT._M.sellers.map(s => s.name);

  el.innerHTML = `
    <div class="filter-bar" style="margin-bottom:16px;padding:12px 16px;background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius)">
      <span style="font-size:12px;font-weight:600;color:var(--gray-500)">FILTROS:</span>
      <input class="form-control" type="date" id="fvFrom" value="${_vendasFilters.from}" onchange="_vendasFilter()" style="width:140px" title="Data inicial">
      <span style="color:var(--gray-400);font-size:12px">até</span>
      <input class="form-control" type="date" id="fvTo" value="${_vendasFilters.to}" onchange="_vendasFilter()" style="width:140px" title="Data final">
      <select class="form-control" id="fvResp" onchange="_vendasFilter()" style="width:180px">
        <option value="">Todos os responsáveis</option>
        ${sellers.map(s=>`<option value="${s}" ${_vendasFilters.responsavel===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <button class="btn btn-secondary btn-sm" onclick="_limparFiltrosVendas()">✕ Limpar</button>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-icon">💰</div><div class="kpi-label">Receita Período</div><div class="kpi-value">${fmt.money(totalRev)}</div><div class="kpi-sub">últimos 6 meses</div></div>
      <div class="kpi-card"><div class="kpi-icon">📦</div><div class="kpi-label">Deals Fechados</div><div class="kpi-value">${totalDeals}</div><div class="kpi-sub">no período</div></div>
      <div class="kpi-card"><div class="kpi-icon">🏆</div><div class="kpi-label">Melhor Mês</div><div class="kpi-value">${melhorMes?.month||'-'}</div><div class="kpi-sub">${fmt.money(melhorMes?.revenue||0)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">🎯</div><div class="kpi-label">Meta Atingida</div><div class="kpi-value" style="color:${pctMeta>=100?'var(--success)':pctMeta>=80?'var(--warning)':'var(--danger)'}">${pctMeta}%</div><div class="kpi-sub">Ticket médio: ${totalDeals?fmt.money(totalRev/totalDeals):'R$ 0'}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">Receita Mensal vs Meta</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chVendasMensal"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Por Responsável</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chVendasResp"></canvas></div></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Detalhamento Mensal</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-secondary" onclick="exportCSV([['Mês','Receita','Deals','Meta','% Meta'],...window._vendasData.data.map(m=>[m.month,m.revenue,m.deals,m.meta||0,m.meta?Math.round(m.revenue/m.meta*100)+'%':'0%'])],'vendas_mensal')">📥 CSV</button>
          <button class="btn btn-sm btn-secondary" onclick="exportExcel(window._vendasData.data.map(m=>[m.month,m.revenue,m.deals,m.meta||0]),['Mês','Receita (R$)','Deals','Meta (R$)'],'vendas_mensal')">📊 Excel</button>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Mês</th><th>Receita</th><th>Deals</th><th>Meta</th><th>% da Meta</th><th>Var. Mês Ant.</th></tr></thead>
            <tbody>${data.map((m,i) => {
              const pct = m.meta ? Math.round(m.revenue/m.meta*100) : 0;
              const prev = i > 0 ? data[i-1].revenue : m.revenue;
              const var_ = prev > 0 ? Math.round((m.revenue - prev)/prev*100) : 0;
              return `<tr>
                <td><strong>${m.month}</strong></td>
                <td>${fmt.money(m.revenue)}</td>
                <td>${m.deals}</td>
                <td>${fmt.money(m.meta||0)}</td>
                <td><span class="badge ${pct>=100?'badge-fechado':pct>=80?'badge-proposta':'badge-perdido'}">${pct}%</span></td>
                <td style="color:${var_>=0?'var(--success)':'var(--danger)'};font-weight:600">${var_>=0?'▲':'▼'} ${Math.abs(var_)}%</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Receita por Responsável</span>
        <button class="btn btn-sm btn-secondary" onclick="exportExcel(window._vendasData.byResp.map(r=>[r.name,r.revenue,r.deals,r.deals?Math.round(r.revenue/r.deals):0]),['Responsável','Receita (R$)','Deals','Ticket Médio (R$)'],'vendas_por_responsavel')">📊 Excel</button>
      </div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th>Responsável</th><th>Receita</th><th>Deals</th><th>% do Total</th><th>Ticket Médio</th></tr></thead>
        <tbody>${byResp.map(r=>`<tr>
          <td><strong>${r.name}</strong></td>
          <td>${fmt.money(r.revenue)}</td>
          <td>${r.deals}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--gray-100);border-radius:3px;height:8px">
                <div style="width:${Math.round(r.revenue/totalRev*100)}%;background:var(--primary);height:8px;border-radius:3px;transition:width .4s"></div>
              </div>
              <span style="min-width:32px">${Math.round(r.revenue/totalRev*100)}%</span>
            </div>
          </td>
          <td><strong>${r.deals?fmt.money(r.revenue/r.deals):'-'}</strong></td>
        </tr>`).join('')}</tbody></table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    _mkChart('chVendasMensal', {
      type:'bar',
      data:{
        labels: data.map(m => m.month),
        datasets:[
          { label:'Receita', data: data.map(m=>m.revenue), backgroundColor:'rgba(37,99,235,0.85)', borderRadius:5 },
          { label:'Meta', data: data.map(m=>m.meta||0), type:'line', borderColor:'#dc2626', borderDash:[5,3], fill:false, tension:0.3, pointRadius:4, pointBackgroundColor:'#dc2626' }
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}}, scales:{y:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')},beginAtZero:true}} }
    });
    _mkChart('chVendasResp', {
      type:'doughnut',
      data:{ labels: byResp.map(r=>r.name), datasets:[{ data: byResp.map(r=>r.revenue), backgroundColor: CHART_COLORS }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'bottom'}, tooltip:{callbacks:{label:c=>`${c.label}: ${fmt.money(c.raw)}`}} } }
    });
  });
}

function _vendasFilter() {
  clearTimeout(_vendasFilters._debounce);
  _vendasFilters._debounce = setTimeout(() => {
    _vendasFilters.from = document.getElementById('fvFrom')?.value || '';
    _vendasFilters.to = document.getElementById('fvTo')?.value || '';
    _vendasFilters.responsavel = document.getElementById('fvResp')?.value || '';
    if (!window._vendasData) return;
    let { data, byResp } = window._vendasData;
    const resp = _vendasFilters.responsavel;
    if (resp) {
      const totalRev = HOLDPRINT._M.revenue.by_responsible.reduce((s,r)=>s+r.revenue,0);
      const respData = HOLDPRINT._M.revenue.by_responsible.find(r=>r.name===resp);
      const pct = totalRev > 0 ? (respData?.revenue||0) / totalRev : 1;
      data = data.map(m => ({ ...m, revenue: Math.round(m.revenue*pct), deals: Math.max(1, Math.round(m.deals*pct)) }));
      byResp = HOLDPRINT._M.revenue.by_responsible.filter(r => r.name === resp);
    }
    Object.keys(_charts).forEach(k => _destroyChart(k));
    _renderVendasContent(data, byResp);
  }, 300);
}

function _limparFiltrosVendas() {
  _vendasFilters = { from:'', to:'', responsavel:'', _debounce: null };
  renderVendas();
}

// ===== 2. PIPELINE =====
async function renderPipelineTab() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(5);
  const opps = await HOLDPRINT.getOpportunities();
  const list = Array.isArray(opps) ? opps : HOLDPRINT._M.opps;
  const stages = ['prospecção','qualificação','proposta','negociação','fechamento'];
  const stageLabels = { prospecção:'Prospecção', qualificação:'Qualificação', proposta:'Proposta', negociação:'Negociação', fechamento:'Fechamento' };
  const byStage = stages.map(s => ({
    stage: s, label: stageLabels[s],
    count: list.filter(o=>o.stage===s).length,
    value: list.filter(o=>o.stage===s).reduce((t,o)=>t+o.value,0),
    prob: {prospecção:20,qualificação:40,proposta:60,negociação:80,fechamento:95}[s]
  }));
  const totalPipe = byStage.reduce((t,s)=>t+s.value,0);
  const weighted = byStage.reduce((t,s)=>t+(s.value*s.prob/100),0);
  const ganhos = list.filter(o=>o.stage==='ganho');
  const perdidos = list.filter(o=>o.stage==='perdido');
  const totalGanho = ganhos.reduce((t,o)=>t+o.value,0);
  const totalPerdido = perdidos.reduce((t,o)=>t+o.value,0);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-icon">💼</div><div class="kpi-label">Total Pipeline</div><div class="kpi-value">${fmt.money(totalPipe)}</div><div class="kpi-sub">${list.filter(o=>!['ganho','perdido'].includes(o.stage)).length} deals ativos</div></div>
      <div class="kpi-card"><div class="kpi-icon">⚖️</div><div class="kpi-label">Forecast Ponderado</div><div class="kpi-value">${fmt.money(weighted)}</div><div class="kpi-sub">por probabilidade média</div></div>
      <div class="kpi-card" style="border-left:3px solid var(--success)"><div class="kpi-icon">✅</div><div class="kpi-label">Ganhos</div><div class="kpi-value" style="color:var(--success)">${fmt.money(totalGanho)}</div><div class="kpi-sub">${ganhos.length} deals fechados</div></div>
      <div class="kpi-card" style="border-left:3px solid var(--danger)"><div class="kpi-icon">❌</div><div class="kpi-label">Perdidos</div><div class="kpi-value" style="color:var(--danger)">${perdidos.length}</div><div class="kpi-sub">${fmt.money(totalPerdido)} perdidos</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card"><div class="card-header"><span class="card-title">Volume por Etapa</span></div><div class="card-body"><div class="chart-container"><canvas id="chPipeVol"></canvas></div></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Valor por Etapa (R$)</span></div><div class="card-body"><div class="chart-container"><canvas id="chPipeVal"></canvas></div></div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Funil de Vendas por Etapa</span></div>
      <div class="card-body">
        ${byStage.map((s,i) => `
          <div class="funnel-row">
            <div class="funnel-label">${s.label}</div>
            <div class="funnel-bar-wrap">
              <div class="funnel-bar" style="width:${totalPipe>0?Math.max(4,Math.round(s.value/totalPipe*100)):0}%;background:${CHART_COLORS[i%8]}"></div>
            </div>
            <div class="funnel-meta"><strong>${s.count}</strong> deals · <strong>${fmt.money(s.value)}</strong> · prob. ${s.prob}%</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Deals por Etapa – Detalhado</span>
        <button class="btn btn-sm btn-secondary" onclick="exportExcel(${JSON.stringify(byStage)}.map(s=>[s.label,s.count,s.value,s.prob,Math.round(s.value*s.prob/100)]),['Etapa','Deals','Valor Total (R$)','Probabilidade %','Valor Ponderado (R$)'],'pipeline_etapas')">📊 Excel</button>
      </div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Etapa</th><th>Deals</th><th>Valor Total</th><th>Probabilidade</th><th>Valor Ponderado</th><th>% do Funil</th></tr></thead>
          <tbody>${byStage.map(s=>`<tr>
            <td><strong>${s.label}</strong></td>
            <td>${s.count}</td>
            <td>${fmt.money(s.value)}</td>
            <td>${s.prob}%</td>
            <td style="color:var(--primary);font-weight:600">${fmt.money(Math.round(s.value*s.prob/100))}</td>
            <td>${totalPipe>0?Math.round(s.value/totalPipe*100):0}%</td>
          </tr>`).join('')}
          <tr style="background:var(--gray-50);font-weight:700">
            <td>TOTAL</td><td>${byStage.reduce((t,s)=>t+s.count,0)}</td>
            <td>${fmt.money(totalPipe)}</td><td>–</td>
            <td style="color:var(--primary)">${fmt.money(Math.round(weighted))}</td><td>100%</td>
          </tr></tbody>
        </table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    _mkChart('chPipeVol', { type:'bar', data:{ labels: byStage.map(s=>s.label), datasets:[{ label:'Deals', data: byStage.map(s=>s.count), backgroundColor: CHART_COLORS, borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
    _mkChart('chPipeVal', { type:'bar', data:{ labels: byStage.map(s=>s.label), datasets:[{ label:'Valor', data: byStage.map(s=>s.value), backgroundColor:'rgba(37,99,235,0.85)', borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}} } });
  });
}

// ===== 3. CONVERSÃO POR FONTE =====
async function renderConversao() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(5);
  const data = HOLDPRINT._M.conversion;
  const bySource = data.by_source;
  const monthly = data.monthly;
  const best = bySource.reduce((a,b) => b.rate > a.rate ? b : a, bySource[0]);
  const worst = bySource.reduce((a,b) => b.rate < a.rate ? b : a, bySource[0]);
  const bestTicket = bySource.reduce((a,b) => b.avg_ticket > a.avg_ticket ? b : a, bySource[0]);
  const avgCycle = Math.round(bySource.reduce((s,x)=>s+x.cycle_days,0)/bySource.length);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card" style="border-left:3px solid var(--success)"><div class="kpi-icon">🥇</div><div class="kpi-label">Melhor Fonte</div><div class="kpi-value" style="font-size:18px">${best.source}</div><div class="kpi-sub">${best.rate}% conversão · Ciclo ${best.cycle_days}d</div></div>
      <div class="kpi-card" style="border-left:3px solid var(--danger)"><div class="kpi-icon">📉</div><div class="kpi-label">Pior Fonte</div><div class="kpi-value" style="font-size:18px">${worst.source}</div><div class="kpi-sub">${worst.rate}% conversão · Ciclo ${worst.cycle_days}d</div></div>
      <div class="kpi-card"><div class="kpi-icon">⏱️</div><div class="kpi-label">Ciclo Médio Geral</div><div class="kpi-value">${avgCycle} dias</div><div class="kpi-sub">tempo médio de fechamento</div></div>
      <div class="kpi-card"><div class="kpi-icon">💡</div><div class="kpi-label">Maior Ticket Médio</div><div class="kpi-value" style="font-size:18px">${bestTicket.source}</div><div class="kpi-sub">${fmt.money(bestTicket.avg_ticket)} por deal</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card"><div class="card-header"><span class="card-title">Taxa de Conversão por Fonte</span></div><div class="card-body"><div class="chart-container"><canvas id="chConvBar"></canvas></div></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Fonte × Ticket Médio (bolha = volume)</span></div><div class="card-body"><div class="chart-container"><canvas id="chConvBubble"></canvas></div></div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Evolução de Conversão por Fonte (mês a mês)</span></div>
      <div class="card-body"><div class="chart-container" style="height:260px"><canvas id="chConvLine"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Detalhamento por Fonte</span>
        <button class="btn btn-sm btn-secondary" onclick="exportExcel(${JSON.stringify(bySource)}.map(s=>[s.source,s.total,s.won,s.lost,s.open,s.rate,s.avg_ticket,s.cycle_days]),['Fonte','Total','Ganhos','Perdidos','Em Aberto','Conversão%','Ticket Médio','Ciclo (dias)'],'conversao_fonte')">📊 Excel</button>
      </div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th>Fonte</th><th>Total</th><th>Ganhos</th><th>Perdidos</th><th>Em Aberto</th><th>Conversão</th><th>Ticket Médio</th><th>Ciclo Médio</th></tr></thead>
        <tbody>${bySource.map(s=>`<tr>
          <td><strong>${s.source}</strong></td>
          <td>${s.total}</td>
          <td style="color:var(--success);font-weight:600">${s.won}</td>
          <td style="color:var(--danger);font-weight:600">${s.lost}</td>
          <td>${s.open}</td>
          <td><span class="badge ${s.rate>=60?'badge-fechado':s.rate>=40?'badge-proposta':'badge-perdido'}">${s.rate}%</span></td>
          <td>${fmt.money(s.avg_ticket)}</td>
          <td>${s.cycle_days} dias</td>
        </tr>`).join('')}</tbody></table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    _mkChart('chConvBar', {
      type:'bar',
      data:{ labels: bySource.map(s=>s.source), datasets:[{ label:'% Conversão', data: bySource.map(s=>s.rate), backgroundColor: CHART_COLORS, borderRadius:5 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{max:100, ticks:{callback:v=>v+'%'}}} }
    });
    _mkChart('chConvBubble', {
      type:'bubble',
      data:{ datasets: bySource.map((s,i) => ({ label:s.source, data:[{ x:i*15+10, y:s.avg_ticket/1000, r: Math.max(8, s.total*2.5) }], backgroundColor: CHART_COLORS[i]+'99', borderColor: CHART_COLORS[i], borderWidth:2 })) },
      options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{title:{display:true,text:'Ticket Médio (R$ mil)'}, ticks:{callback:v=>'R$'+v+'k'}}, x:{display:false} }, plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: Ticket R$${(c.parsed.y*1000).toLocaleString('pt-BR')}, Volume: ${bySource[c.datasetIndex].total} deals`}}} }
    });
    const sources = ['inbound','outbound','indicacao','retorno','marketing'];
    const srcLabels = ['Inbound','Outbound','Indicação','Retorno','Marketing'];
    _mkChart('chConvLine', {
      type:'line',
      data:{ labels: monthly.map(m=>m.month), datasets: sources.map((s,i) => ({ label:srcLabels[i], data: monthly.map(m=>m[s]), borderColor: CHART_COLORS[i], backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:3 })) },
      options:{ responsive:true, maintainAspectRatio:false, scales:{y:{ticks:{callback:v=>v+'%'},max:100}}, plugins:{legend:{position:'top'}} }
    });
  });
}

// ===== 4. PERFORMANCE =====
async function renderPerformance() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(5);
  const sellers = HOLDPRINT._M.sellers;
  const sorted = [...sellers].sort((a,b)=>b.conversion-a.conversion);

  el.innerHTML = `
    <div class="kpi-grid">
      ${sorted.map((s,i)=>`
        <div class="kpi-card" style="cursor:pointer;transition:transform .15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''" onclick="openSellerDetail('${s.name}')">
          <div class="kpi-icon" style="font-size:20px">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'👤'}</div>
          <div class="kpi-label">${s.name}</div>
          <div class="kpi-value" style="font-size:22px">${s.conversion}%</div>
          <div class="kpi-sub">${s.open_deals} abertos · ${fmt.money(s.total_value)}</div>
        </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card"><div class="card-header"><span class="card-title">Comparativo de Pipeline</span></div><div class="card-body"><div class="chart-container"><canvas id="chPerfBar"></canvas></div></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Radar Multi-Dimensão</span></div><div class="card-body"><div class="chart-container"><canvas id="chPerfRadar"></canvas></div></div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Tendência de Pipeline (últimos 3 meses)</span></div>
      <div class="card-body"><div class="chart-container"><canvas id="chPerfLine"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Ranking de Vendedores</span>
        <button class="btn btn-sm btn-secondary" onclick="exportExcel(${JSON.stringify(sorted)}.map((s,i)=>[i+1,s.name,s.open_deals,s.total_value,s.won,s.lost,s.conversion,s.avg_ticket,s.activities]),['#','Nome','Deals Abertos','Pipeline Total','Ganhos','Perdidos','Conversão%','Ticket Médio','Atividades'],'performance_vendedores')">📊 Excel</button>
      </div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Deals Abertos</th><th>Pipeline Total</th><th>Ganhos</th><th>Perdidos</th><th>Conversão</th><th>Ticket Médio</th><th>Atividades</th><th>Ações</th></tr></thead>
          <tbody>${sorted.map((s,i)=>`<tr>
            <td><strong style="font-size:16px">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+String(i+1)}</strong></td>
            <td><strong>${s.name}</strong></td>
            <td>${s.open_deals}</td>
            <td>${fmt.money(s.total_value)}</td>
            <td style="color:var(--success);font-weight:600">${s.won}</td>
            <td style="color:var(--danger)">${s.lost}</td>
            <td><span class="badge ${s.conversion>=75?'badge-fechado':s.conversion>=60?'badge-proposta':'badge-perdido'}">${s.conversion}%</span></td>
            <td>${fmt.money(s.avg_ticket)}</td>
            <td>${s.activities}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-sm btn-secondary" onclick="openSellerDetail('${s.name}')">📊 Detalhes</button>
                <button class="btn btn-sm btn-primary" onclick="openCoachingModal('${s.name}')">🗣️ Feedback</button>
              </div>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    _mkChart('chPerfBar', {
      type:'bar',
      data:{ labels: sellers.map(s=>s.name), datasets:[{ label:'Pipeline', data: sellers.map(s=>s.total_value), backgroundColor: CHART_COLORS, borderRadius:5 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}} }
    });
    const maxVal = Math.max(...sellers.map(s=>s.total_value));
    const maxConv = Math.max(...sellers.map(s=>s.conversion));
    const maxAct = Math.max(...sellers.map(s=>s.activities));
    _mkChart('chPerfRadar', {
      type:'radar',
      data:{ labels:['Pipeline','Conversão','Velocidade','Ganhos','Atividades'],
        datasets: sellers.map((s,i)=>({ label:s.name, data:[
          Math.round(s.total_value/maxVal*100),
          s.conversion,
          Math.min(100, Math.round((1/Math.max(1,s.avg_days))*100*20)),
          Math.round(s.won/Math.max(1,s.won+s.lost)*100),
          Math.round(s.activities/maxAct*100)
        ], borderColor: CHART_COLORS[i], backgroundColor: CHART_COLORS[i]+'33', pointRadius:4, borderWidth:2 }))
      },
      options:{ responsive:true, maintainAspectRatio:false, scales:{r:{min:0,max:100,ticks:{stepSize:25}}}, plugins:{legend:{position:'bottom'}} }
    });
    _mkChart('chPerfLine', {
      type:'line',
      data:{ labels:['2 meses atrás','1 mês atrás','Atual'],
        datasets: sellers.map((s,i)=>({ label:s.name, data: s.pipeline_trend, borderColor: CHART_COLORS[i], backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:5 }))
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}}, scales:{y:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}} }
    });
  });
}

function openSellerDetail(name) {
  const s = HOLDPRINT._M.sellers.find(x=>x.name===name);
  if (!s) return;
  const opps = HOLDPRINT._M.opps.filter(o=>o.responsible===name);
  const ativos = opps.filter(o=>!['ganho','perdido'].includes(o.stage));
  const html = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Pipeline Total</div><div class="detail-value" style="font-size:20px;font-weight:700;color:var(--primary)">${fmt.money(s.total_value)}</div></div>
      <div class="detail-item"><div class="detail-label">Taxa de Conversão</div><div class="detail-value" style="font-size:20px;font-weight:700;color:${s.conversion>=75?'var(--success)':'var(--warning)'}">${s.conversion}%</div></div>
      <div class="detail-item"><div class="detail-label">Ticket Médio</div><div class="detail-value">${fmt.money(s.avg_ticket)}</div></div>
      <div class="detail-item"><div class="detail-label">Tempo Médio de Ciclo</div><div class="detail-value">${s.avg_days} dias</div></div>
      <div class="detail-item"><div class="detail-label">Deals Ganhos</div><div class="detail-value" style="color:var(--success);font-weight:700">${s.won}</div></div>
      <div class="detail-item"><div class="detail-label">Deals Perdidos</div><div class="detail-value" style="color:var(--danger)">${s.lost}</div></div>
      <div class="detail-item"><div class="detail-label">Atividades Registradas</div><div class="detail-value">${s.activities}</div></div>
      <div class="detail-item"><div class="detail-label">Deals em Risco</div><div class="detail-value" style="color:var(--warning)">${_countSellerRisk(name)}</div></div>
    </div>
    <div style="margin-bottom:12px;display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="closeModal();openCoachingModal('${name}')">🗣️ Sessão de Feedback/Coaching</button>
    </div>
    <div style="font-weight:600;margin:16px 0 8px;font-size:14px">Deals Ativos (${ativos.length})</div>
    <div class="table-wrapper">
      <table><thead><tr><th>Deal</th><th>Empresa</th><th>Valor</th><th>Etapa</th><th>Probabilidade</th><th>Fechamento Prev.</th></tr></thead>
      <tbody>${ativos.length===0?'<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">Nenhum deal ativo</td></tr>':ativos.map(o=>`<tr>
        <td style="font-weight:600">${o.title}</td>
        <td>${o.company}</td>
        <td>${fmt.money(o.value)}</td>
        <td><span class="badge badge-${o.stage==='negociação'?'negociacao':o.stage}">${o.stage}</span></td>
        <td>${o.probability}%</td>
        <td>${fmt.date(o.expected_close)}</td>
      </tr>`).join('')}</tbody></table>
    </div>`;
  openModal(`📊 Detalhes – ${name}`, html, () => closeModal(), true);
  document.getElementById('modalSave').style.display = 'none';
  document.getElementById('modalCancel').textContent = 'Fechar';
}

function _countSellerRisk(name) {
  const now = new Date();
  return HOLDPRINT._M.opps.filter(o => {
    if (o.responsible !== name || ['ganho','perdido'].includes(o.stage)) return false;
    const diasSemAtiv = Math.floor((now - new Date(o.last_activity)) / 86400000);
    return diasSemAtiv > 7 || o.probability < 40 || new Date(o.expected_close) < now;
  }).length;
}

function openCoachingModal(name) {
  const s = HOLDPRINT._M.sellers.find(x=>x.name===name);
  if (!s) return;
  const badge = s.conversion >= 75 ? '🟢 Alto desempenho' : s.conversion >= 60 ? '🟡 Bom desempenho' : '🔴 Precisa atenção';
  const html = `
    <div class="coaching-header">
      <div class="coaching-badge">${badge}</div>
      <div style="margin-top:12px;padding:12px;background:var(--gray-50);border-radius:8px;border-left:3px solid var(--primary)">
        <div style="font-size:12px;font-weight:600;color:var(--gray-500);margin-bottom:6px">PONTOS DE DESTAQUE</div>
        ${s.conversion >= 75 ? '<p style="font-size:13px">✅ Excelente taxa de conversão. Compartilhe as técnicas com o time.</p>' : ''}
        ${s.open_deals > 5 ? '<p style="font-size:13px">⚠️ Muitos deals abertos – priorize os de maior probabilidade.</p>' : ''}
        ${s.avg_days > 20 ? '<p style="font-size:13px">⏱️ Ciclo de vendas acima da média – identifique os gargalos.</p>' : ''}
        ${s.activities < 15 ? '<p style="font-size:13px">📞 Baixa atividade registrada – aumente os contatos semanais.</p>' : ''}
        ${_countSellerRisk(name) > 0 ? `<p style="font-size:13px">🚨 ${_countSellerRisk(name)} deals em risco – requer atenção imediata.</p>` : ''}
      </div>
    </div>
    <div class="form-group" style="margin-top:16px">
      <label class="form-label">Pontos Fortes (feedback positivo)</label>
      <textarea id="cForcas" class="form-control" placeholder="Ex: Excelente relacionamento com clientes, boa cadência de follow-ups..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Pontos de Melhoria</label>
      <textarea id="cMelhorias" class="form-control" placeholder="Ex: Melhorar qualificação inicial, aumentar ticket médio..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Metas acordadas para o próximo período</label>
      <textarea id="cMetas" class="form-control" placeholder="Ex: Fechar 3 deals acima de R$ 10k, reduzir ciclo para 18 dias..."></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Data da Sessão</label>
        <input id="cData" class="form-control" type="date" value="${new Date().toISOString().slice(0,10)}">
      </div>
      <div class="form-group">
        <label class="form-label">Próximo Check-in</label>
        <input id="cProximo" class="form-control" type="date">
      </div>
    </div>`;
  openModal(`🗣️ Feedback & Coaching – ${name}`, html, () => {
    showToast(`Sessão de coaching com ${name} registrada!`, 'success');
    closeModal();
  });
  document.getElementById('modalSave').textContent = '✅ Salvar Sessão';
}

// ===== 5. FORECAST =====
async function renderForecast() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(6);
  const fc = HOLDPRINT._M.forecast;
  const rev = HOLDPRINT._M.revenue.monthly;
  const sellers = HOLDPRINT._M.sellers;
  const pct = Math.round(fc.weighted / fc.meta * 100);
  const gaugeColor = pct >= 100 ? '#16a34a' : pct >= 80 ? '#d97706' : '#dc2626';
  const alerts = [];
  if (pct < 80) alerts.push({ type:'danger', msg:`Forecast ${pct}% da meta. Adicione deals para atingir ${fmt.money(fc.meta)}.` });
  if (fc.by_stage.find(s=>s.stage==='prospecção')?.value < 20000) alerts.push({ type:'warning', msg:'Poucos deals em prospecção. Intensifique a captação de leads.' });
  if (pct >= 100) alerts.push({ type:'success', msg:`Forecast supera a meta em ${pct-100}%! Ótimo desempenho no período.` });

  // Forecast por responsável (proporcional ao pipeline de cada vendedor)
  const totalPipe = sellers.reduce((t,s)=>t+s.total_value,0);
  const forecastByResp = sellers.map(s => {
    const pctResp = totalPipe > 0 ? s.total_value / totalPipe : 0;
    return {
      name: s.name,
      open_deals: s.open_deals,
      pipeline: s.total_value,
      weighted: Math.round(fc.weighted * pctResp),
      conversion: s.conversion,
      avg_close: _addDays(new Date(), Math.round(s.avg_days))
    };
  });

  // Forecast próximas semanas
  const nextWeeks = [1,2,3,4].map(w => {
    const val = Math.round(fc.weighted / 4 * (1 - (w-1)*0.05));
    return { week:`Semana +${w}`, deals: Math.round(fc.weighted / fc.meta * 3), value: val };
  });

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">Forecast vs Meta</span></div>
        <div class="card-body" style="text-align:center">
          <div class="gauge-wrap"><canvas id="chGauge" height="160"></canvas>
            <div class="gauge-label">
              <div style="font-size:32px;font-weight:700;color:${gaugeColor}">${pct}%</div>
              <div style="font-size:11px;color:var(--gray-500)">da meta</div>
            </div>
          </div>
          <div style="margin-top:12px">
            <div style="font-size:13px;color:var(--gray-500)">Forecast ponderado</div>
            <div style="font-size:22px;font-weight:700;color:var(--gray-900)">${fmt.money(fc.weighted)}</div>
            <div style="font-size:12px;color:var(--gray-400)">Meta mensal: ${fmt.money(fc.meta)}</div>
          </div>
          <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
            <div style="background:var(--gray-50);padding:10px;border-radius:8px">
              <div style="color:var(--gray-500);margin-bottom:2px">Pessimista</div>
              <div style="font-weight:700;color:var(--danger)">${fmt.money(Math.round(fc.weighted*0.7))}</div>
            </div>
            <div style="background:var(--gray-50);padding:10px;border-radius:8px">
              <div style="color:var(--gray-500);margin-bottom:2px">Otimista</div>
              <div style="font-weight:700;color:var(--success)">${fmt.money(fc.optimistic)}</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        ${alerts.map(a=>`<div class="alert alert-${a.type}" style="margin-bottom:10px">⚠️ ${a.msg}</div>`).join('')}
        <div class="card">
          <div class="card-header"><span class="card-title">Forecast vs Realizado (últimos 3 meses)</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="chFcBar"></canvas></div></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Tendência de Forecast (6 meses)</span></div>
      <div class="card-body"><div class="chart-container"><canvas id="chFcArea"></canvas></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Forecast por Responsável</span>
          <button class="btn btn-sm btn-secondary" onclick="exportExcel(${JSON.stringify(forecastByResp)}.map(r=>[r.name,r.open_deals,r.pipeline,r.weighted,r.conversion]),['Responsável','Deals Abertos','Pipeline','Forecast Pond.','Conversão%'],'forecast_responsavel')">📊 Excel</button>
        </div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>Responsável</th><th>Deals</th><th>Pipeline</th><th>Forecast Pond.</th><th>Conversão</th></tr></thead>
          <tbody>${forecastByResp.map(r=>`<tr>
            <td><strong>${r.name}</strong></td>
            <td>${r.open_deals}</td>
            <td>${fmt.money(r.pipeline)}</td>
            <td style="font-weight:700;color:var(--primary)">${fmt.money(r.weighted)}</td>
            <td><span class="badge ${r.conversion>=75?'badge-fechado':r.conversion>=60?'badge-proposta':'badge-perdido'}">${r.conversion}%</span></td>
          </tr>`).join('')}
          <tr style="background:var(--gray-50);font-weight:700">
            <td>TOTAL</td><td>${forecastByResp.reduce((t,r)=>t+r.open_deals,0)}</td>
            <td>${fmt.money(totalPipe)}</td>
            <td style="color:var(--primary)">${fmt.money(fc.weighted)}</td>
            <td>–</td>
          </tr></tbody></table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Forecast Próximas Semanas</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>Período</th><th>Deals Prev.</th><th>Valor Estimado</th></tr></thead>
          <tbody>${nextWeeks.map(w=>`<tr>
            <td><strong>${w.week}</strong></td>
            <td>${w.deals}</td>
            <td style="font-weight:700;color:var(--primary)">${fmt.money(w.value)}</td>
          </tr>`).join('')}</tbody></table>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Cálculo do Forecast por Etapa</span>
        <button class="btn btn-sm btn-secondary" onclick="exportExcel(${JSON.stringify(fc.by_stage)}.map(s=>[s.stage,s.value,s.probability+'%',s.weighted]),['Etapa','Valor Total','Probabilidade','Valor Ponderado'],'forecast_etapa')">📊 Excel</button>
      </div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th>Etapa</th><th>Valor Total</th><th>Probabilidade</th><th>Valor Ponderado</th><th>% do Forecast</th></tr></thead>
        <tbody>${fc.by_stage.map(s=>`<tr>
          <td><strong>${s.stage}</strong></td>
          <td>${fmt.money(s.value)}</td>
          <td>${s.probability}%</td>
          <td><strong style="color:var(--primary)">${fmt.money(s.weighted)}</strong></td>
          <td>${Math.round(s.weighted/fc.weighted*100)}%</td>
        </tr>`).join('')}
        <tr style="background:var(--gray-50);font-weight:700">
          <td>TOTAL</td><td>${fmt.money(fc.by_stage.reduce((t,s)=>t+s.value,0))}</td>
          <td>–</td><td style="color:var(--primary)">${fmt.money(fc.weighted)}</td><td>100%</td>
        </tr></tbody></table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    _mkChart('chGauge', {
      type:'doughnut',
      data:{ datasets:[{ data:[Math.min(100,pct), Math.max(0,100-pct)], backgroundColor:[gaugeColor,'#e5e7eb'], borderWidth:0, circumference:180, rotation:-90 }] },
      options:{ responsive:false, cutout:'72%', plugins:{legend:{display:false},tooltip:{enabled:false}} }
    });
    const forecastByMonth = rev.map(m => Math.round(m.revenue * 1.08));
    _mkChart('chFcBar', {
      type:'bar',
      data:{ labels: rev.slice(-3).map(m=>m.month), datasets:[
        { label:'Realizado', data: rev.slice(-3).map(m=>m.revenue), backgroundColor:'rgba(37,99,235,0.8)', borderRadius:4 },
        { label:'Forecast', data: forecastByMonth.slice(-3), backgroundColor:'rgba(22,163,74,0.8)', borderRadius:4 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}}, scales:{y:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}} }
    });
    _mkChart('chFcArea', {
      type:'line',
      data:{ labels: rev.map(m=>m.month), datasets:[
        { label:'Realizado', data: rev.map(m=>m.revenue), borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.1)', fill:true, tension:0.4 },
        { label:'Meta', data: rev.map(m=>m.meta||0), borderColor:'#dc2626', borderDash:[5,3], fill:false, tension:0.3, pointRadius:0 },
        { label:'Forecast Otimista', data: rev.map(m=>Math.round(m.revenue*1.15)), borderColor:'#16a34a', backgroundColor:'rgba(22,163,74,0.05)', fill:true, tension:0.4, borderDash:[4,2] }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}}, scales:{y:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}} }
    });
  });
}

function _addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('pt-BR');
}

// ===== 6. DEALS EM RISCO =====
async function renderRisco() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(5);
  const opps = HOLDPRINT._M.opps.filter(o=>!['ganho','perdido'].includes(o.stage));
  const now = new Date();

  function calcRisk(o) {
    const dias_sem_ativ = Math.floor((now - new Date(o.last_activity)) / 86400000);
    const dias_ate_close = Math.floor((new Date(o.expected_close) - now) / 86400000);
    const dias_na_etapa = Math.floor((now - new Date(o.stage_entered_at || o.created_at)) / 86400000);
    const criterios = [];
    if (dias_sem_ativ > 7) criterios.push(`Sem atividade há ${dias_sem_ativ} dias`);
    if (o.probability < 40) criterios.push(`Probabilidade baixa (${o.probability}%)`);
    if (dias_ate_close < 0) criterios.push(`Data de fechamento vencida há ${Math.abs(dias_ate_close)} dias`);
    if (o.stage === 'negociação' && dias_na_etapa > 30) criterios.push(`Em negociação há ${dias_na_etapa} dias`);
    let nivel;
    if (criterios.length >= 2 || dias_ate_close < 0) nivel = 'critico';
    else if (criterios.length === 1 && (dias_sem_ativ > 7 || o.probability < 30)) nivel = 'alto';
    else if (criterios.length === 1) nivel = 'medio';
    else if (dias_ate_close <= 5 && dias_ate_close >= 0) nivel = 'aviso';
    else nivel = 'ok';
    return { dias_sem_ativ, dias_ate_close, criterios, nivel };
  }

  const withRisk = opps.map(o => ({ ...o, _risk: calcRisk(o) })).filter(o=>o._risk.nivel !== 'ok').sort((a,b)=>{
    const ord = {critico:0,alto:1,medio:2,aviso:3};
    return ord[a._risk.nivel]-ord[b._risk.nivel];
  });
  const totalEmRisco = withRisk.reduce((t,o)=>t+o.value,0);
  const totalPipe = opps.reduce((t,o)=>t+o.value,0);
  const pctRisco = totalPipe > 0 ? Math.round(totalEmRisco/totalPipe*100) : 0;

  // Padrões de risco por vendedor
  const riskBySeller = {};
  withRisk.forEach(o => {
    if (!riskBySeller[o.responsible]) riskBySeller[o.responsible] = { total: 0, value: 0, critico: 0 };
    riskBySeller[o.responsible].total++;
    riskBySeller[o.responsible].value += o.value;
    if (o._risk.nivel === 'critico') riskBySeller[o.responsible].critico++;
  });
  const sellerRiskList = Object.entries(riskBySeller).sort((a,b)=>b[1].total-a[1].total);

  window._riscoData = withRisk;

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card" style="border-left:4px solid var(--danger)"><div class="kpi-icon">🚨</div><div class="kpi-label">Deals em Risco</div><div class="kpi-value">${withRisk.length}</div><div class="kpi-sub">${pctRisco}% do pipeline ativo</div></div>
      <div class="kpi-card"><div class="kpi-icon">💸</div><div class="kpi-label">Valor em Risco</div><div class="kpi-value" style="color:var(--danger)">${fmt.money(totalEmRisco)}</div><div class="kpi-sub">de ${fmt.money(totalPipe)} total</div></div>
      <div class="kpi-card"><div class="kpi-icon">🔴</div><div class="kpi-label">Críticos</div><div class="kpi-value">${withRisk.filter(o=>o._risk.nivel==='critico').length}</div><div class="kpi-sub">necessitam ação imediata</div></div>
      <div class="kpi-card"><div class="kpi-icon">🟡</div><div class="kpi-label">Em Alerta</div><div class="kpi-value">${withRisk.filter(o=>['alto','medio','aviso'].includes(o._risk.nivel)).length}</div><div class="kpi-sub">monitorar de perto</div></div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Deals com Risco Identificado</span>
          <select class="form-control" style="width:auto;min-width:140px" id="filtroRisco" onchange="filterRisco()">
            <option value="">Todos os níveis</option>
            <option value="critico">🔴 Crítico</option>
            <option value="alto">🟠 Alto</option>
            <option value="medio">🟡 Médio</option>
            <option value="aviso">🔵 Aviso</option>
          </select>
        </div>
        <div class="card-body" style="padding:0" id="riscoTable">
          ${renderRiscoTable(withRisk)}
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><span class="card-title">Padrões de Risco por Vendedor</span></div>
          <div class="card-body" style="padding:0">
            <table><thead><tr><th>Vendedor</th><th>Deals</th><th>Críticos</th><th>Valor</th></tr></thead>
            <tbody>${sellerRiskList.length===0?'<tr><td colspan="4" style="text-align:center;color:var(--gray-400);padding:20px">Nenhum risco</td></tr>':sellerRiskList.map(([name,d])=>`<tr>
              <td><strong>${name}</strong></td>
              <td>${d.total}</td>
              <td>${d.critico>0?`<span style="color:var(--danger);font-weight:700">${d.critico}</span>`:'0'}</td>
              <td style="font-size:12px">${fmt.money(d.value)}</td>
            </tr>`).join('')}</tbody></table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">🤖 Recomendações de IA</span></div>
          <div class="card-body" style="padding:12px">
            ${withRisk.slice(0,3).map(o=>`
              <div class="ai-rec-item">
                <div class="ai-rec-deal">${o.title}</div>
                <div class="ai-rec-text">${getAIRecommendation(o)}</div>
              </div>`).join('')}
            ${withRisk.length===0?'<div style="text-align:center;color:var(--gray-400)">✅ Nenhum deal em risco</div>':''}
          </div>
        </div>
      </div>
    </div>`;
}

function getAIRecommendation(o) {
  const dias = Math.floor((new Date() - new Date(o.last_activity)) / 86400000);
  if (dias > 14) return `📞 Entre em contato com ${o.contact} hoje. ${dias} dias sem interação é crítico para este deal.`;
  if (o.probability < 30) return `🔁 Reavalie a proposta para ${o.company}. Considere ajuste de preço ou escopo.`;
  if (new Date(o.expected_close) < new Date()) return `⚡ Data de fechamento vencida. Revalide o interesse de ${o.contact} urgentemente.`;
  if (o.stage === 'negociação') return `🤝 Deal em negociação há muito tempo. Ofereça uma condição especial para acelerar.`;
  return `📋 Agende uma reunião com ${o.company} para retomar o avanço no funil.`;
}

function filterRisco() {
  const nivel = document.getElementById('filtroRisco')?.value;
  const filtered = nivel ? window._riscoData.filter(o=>o._risk.nivel===nivel) : window._riscoData;
  document.getElementById('riscoTable').innerHTML = renderRiscoTable(filtered);
}

function renderRiscoTable(data) {
  if (!data.length) return '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">Nenhum deal em risco encontrado</div></div>';
  const nivelCls = { critico:'risco-critico', alto:'risco-alto', medio:'risco-medio', aviso:'risco-aviso' };
  const nivelLabel = { critico:'🔴 Crítico', alto:'🟠 Alto', medio:'🟡 Médio', aviso:'🔵 Aviso' };
  return `<div class="table-wrapper"><table>
    <thead><tr><th>Deal</th><th>Cliente</th><th>Resp.</th><th>Valor</th><th>Dias s/ Ativ.</th><th>Nível</th><th>Ações</th></tr></thead>
    <tbody>${data.map(o=>`<tr class="${nivelCls[o._risk.nivel]||''}">
      <td>
        <strong>${o.title}</strong>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px">${o._risk.criterios.join(' · ')}</div>
      </td>
      <td>${o.company}</td>
      <td style="font-size:12px">${o.responsible}</td>
      <td style="font-weight:600">${fmt.money(o.value)}</td>
      <td style="color:${o._risk.dias_sem_ativ>7?'var(--danger)':'inherit'};font-weight:600">${o._risk.dias_sem_ativ}d</td>
      <td>${nivelLabel[o._risk.nivel]||o._risk.nivel}</td>
      <td>
        <div class="table-actions" style="flex-wrap:wrap;gap:4px">
          <button class="btn btn-sm btn-primary" onclick="agendarFollowup('${o.id}','${(o.title||'').replace(/'/g,'')}')" title="Agendar Follow-up">📅</button>
          <button class="btn btn-sm btn-secondary" onclick="openReavaliacao('${o.id}','${(o.title||'').replace(/'/g,'')}')" title="Reavaliar Deal">🔁</button>
          <button class="btn btn-sm btn-secondary" onclick="openMoverEtapa('${o.id}','${(o.title||'').replace(/'/g,'')}')" title="Mover Etapa">→</button>
        </div>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function agendarFollowup(id, title) {
  const html = `
    <div class="form-group"><label class="form-label">Deal</label><input class="form-control" readonly value="${title}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Data</label><input id="fuDate" class="form-control" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label class="form-label">Tipo de Contato</label>
        <select id="fuTipo" class="form-control">
          <option>📞 Ligação</option><option>📧 Email</option><option>📅 Reunião</option><option>🏢 Visita Presencial</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Horário</label><input id="fuHora" class="form-control" type="time" value="10:00"></div>
    <div class="form-group"><label class="form-label">Objetivo / Pauta</label><textarea id="fuObs" class="form-control" placeholder="O que pretende abordar neste contato?"></textarea></div>`;
  openModal('📅 Agendar Follow-up', html, () => {
    showToast('Follow-up agendado para ' + fmt.date(getVal('fuDate')), 'success');
    closeModal();
  });
}

function openReavaliacao(id, title) {
  const deal = HOLDPRINT._M.opps.find(o=>String(o.id)===String(id));
  const html = `
    <div class="form-group"><label class="form-label">Deal</label><input class="form-control" readonly value="${title}"></div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nova Probabilidade (%)</label>
        <input id="rvProb" class="form-control" type="range" min="0" max="100" value="${deal?.probability||50}" oninput="document.getElementById('rvProbVal').textContent=this.value+'%'">
        <div style="text-align:center;font-weight:700;color:var(--primary)" id="rvProbVal">${deal?.probability||50}%</div>
      </div>
      <div class="form-group">
        <label class="form-label">Nova Data de Fechamento</label>
        <input id="rvData" class="form-control" type="date" value="${deal?.expected_close?.slice(0,10)||''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Motivo da Reavaliação</label>
      <select id="rvMotivo" class="form-control">
        <option>Cliente demonstrou interesse renovado</option>
        <option>Ajuste de proposta comercial</option>
        <option>Mudança no decisor/influenciador</option>
        <option>Concorrência identificada</option>
        <option>Orçamento do cliente revisado</option>
        <option>Outro</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Observações</label><textarea id="rvObs" class="form-control" placeholder="Detalhes sobre a reavaliação..."></textarea></div>`;
  openModal('🔁 Reavaliar Deal', html, () => {
    showToast(`Deal "${title}" reavaliado com sucesso!`, 'success');
    closeModal();
  });
}

function openMoverEtapa(id, title) {
  const deal = HOLDPRINT._M.opps.find(o=>String(o.id)===String(id));
  const stages = ['prospecção','qualificação','proposta','negociação','fechamento','ganho','perdido'];
  const html = `
    <div class="form-group"><label class="form-label">Deal</label><input class="form-control" readonly value="${title}"></div>
    <div class="form-group">
      <label class="form-label">Etapa Atual</label>
      <input class="form-control" readonly value="${deal?.stage||'–'}">
    </div>
    <div class="form-group">
      <label class="form-label">Mover para</label>
      <select id="meEtapa" class="form-control">
        ${stages.filter(s=>s!==deal?.stage).map(s=>`<option value="${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Motivo da Mudança</label><textarea id="meMotivo" class="form-control" placeholder="Por que está mudando a etapa?"></textarea></div>`;
  openModal('→ Mover Etapa', html, () => {
    const novaEtapa = getVal('meEtapa');
    HOLDPRINT.patchOpportunityStage(id, novaEtapa);
    showToast(`Deal movido para "${novaEtapa}"!`, 'success');
    closeModal();
    renderRisco();
  });
}

// ===== 7. PRODUTOS =====
async function renderProdutos() {
  const el = document.getElementById('relContent');
  el.innerHTML = skeletonLoading(5);
  const products = HOLDPRINT._M.products;
  const totalRev = products.reduce((t,p)=>t+p.revenue,0);
  const top = products.reduce((a,b)=>b.revenue>a.revenue?b:a,products[0]);
  const sorted = [...products].sort((a,b)=>b.revenue-a.revenue);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-icon">🏆</div><div class="kpi-label">Maior Receita</div><div class="kpi-value" style="font-size:18px">${top.name}</div><div class="kpi-sub">${fmt.money(top.revenue)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">📦</div><div class="kpi-label">Total Vendido</div><div class="kpi-value">${products.reduce((t,p)=>t+p.sold,0)}</div><div class="kpi-sub">unidades/serviços</div></div>
      <div class="kpi-card"><div class="kpi-icon">💰</div><div class="kpi-label">Receita Total</div><div class="kpi-value">${fmt.money(totalRev)}</div><div class="kpi-sub">todos os produtos</div></div>
      <div class="kpi-card"><div class="kpi-icon">📈</div><div class="kpi-label">Em Crescimento</div><div class="kpi-value">${products.filter(p=>p.trend==='up').length}</div><div class="kpi-sub">produtos com tendência ↑</div></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card"><div class="card-header"><span class="card-title">Top 10 por Receita (R$)</span></div><div class="card-body"><div class="chart-container" style="height:280px"><canvas id="chProdBar"></canvas></div></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Distribuição de Receita</span></div><div class="card-body"><div class="chart-container" style="height:280px"><canvas id="chProdPie"></canvas></div></div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Tendência de Vendas – Top 4 Produtos (últimos 6 meses)</span></div>
      <div class="card-body"><div class="chart-container"><canvas id="chProdLine"></canvas></div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Detalhamento de Produtos</span>
        <button class="btn btn-sm btn-secondary" onclick="exportExcel(${JSON.stringify(sorted)}.map(p=>[p.name,p.category,p.sold,p.revenue,p.avg_price,p.trend]),['Produto','Categoria','Qtd Vendida','Receita','Preço Médio','Tendência'],'produtos')">📊 Excel</button>
      </div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th>Produto</th><th>Categoria</th><th>Qtd Vendida</th><th>Receita</th><th>% do Total</th><th>Preço Médio</th><th>Tendência</th><th>Ação</th></tr></thead>
        <tbody>${sorted.map(p=>`<tr style="cursor:pointer" onclick="openProductDetail(${p.id})">
          <td><strong style="color:var(--primary)">${p.name}</strong></td>
          <td><span class="badge badge-qualificado" style="font-size:10px">${p.category}</span></td>
          <td>${p.sold}</td>
          <td><strong>${fmt.money(p.revenue)}</strong></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--gray-100);border-radius:3px;height:6px">
                <div style="width:${Math.round(p.revenue/totalRev*100)}%;background:var(--primary);height:6px;border-radius:3px"></div>
              </div>
              ${Math.round(p.revenue/totalRev*100)}%
            </div>
          </td>
          <td>${fmt.money(p.avg_price)}</td>
          <td>${p.trend==='up'?'<span style="color:var(--success);font-weight:600">↑ Crescendo</span>':p.trend==='down'?'<span style="color:var(--danger);font-weight:600">↓ Caindo</span>':'<span style="color:var(--gray-500)">→ Estável</span>'}</td>
          <td><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();openProductDetail(${p.id})">🔍 Ver</button></td>
        </tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🔗 Análise de Cross-sell</span></div>
      <div class="card-body">
        ${_renderCrossSell(sorted)}
      </div>
    </div>`;

  requestAnimationFrame(() => {
    _mkChart('chProdBar', {
      type:'bar',
      data:{ labels: sorted.map(p=>p.name), datasets:[{ label:'Receita', data: sorted.map(p=>p.revenue), backgroundColor: CHART_COLORS[0], borderRadius:4 }] },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}} }
    });
    _mkChart('chProdPie', {
      type:'pie',
      data:{ labels: sorted.map(p=>p.name), datasets:[{ data: sorted.map(p=>p.revenue), backgroundColor: CHART_COLORS }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'bottom',labels:{font:{size:10}}}, tooltip:{callbacks:{label:c=>`${c.label}: ${fmt.money(c.raw)}`}} } }
    });
    _mkChart('chProdLine', {
      type:'line',
      data:{ labels: MONTHS_6, datasets: sorted.slice(0,4).map((p,i)=>({ label:p.name, data: p.monthly, borderColor: CHART_COLORS[i], backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:3 })) },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top'}}, scales:{y:{beginAtZero:true}} }
    });
  });
}

function _renderCrossSell(products) {
  // Lógica de cross-sell baseada em categorias complementares
  const crossSellMap = {
    'Banner em Lona': ['Impressão Digital','Folder/Flyer'],
    'Fachada ACM': ['Letreiro Luminoso','Placa em ACM'],
    'Adesivo Vinil': ['Plotagem Veicular'],
    'Letreiro Luminoso': ['Fachada ACM','Totem Indicativo'],
    'Totem Indicativo': ['Placa em ACM','Letreiro Luminoso']
  };
  const items = Object.entries(crossSellMap).slice(0,4);
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${items.map(([prod, complementos])=>`
        <div style="padding:14px;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-200)">
          <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px">📦 ${prod}</div>
          <div style="font-size:11px;color:var(--gray-500);margin-bottom:8px">Clientes que compraram este produto também compraram:</div>
          ${complementos.map(c=>`<span style="display:inline-block;background:#fff;border:1px solid var(--gray-300);padding:3px 8px;border-radius:12px;font-size:11px;margin:2px;font-weight:500">${c}</span>`).join('')}
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:12px;background:var(--primary-light);border-radius:8px;font-size:13px">
      💡 <strong>Oportunidade:</strong> Clientes de Impressão Digital raramente compram Fachada ACM. Há potencial de cross-sell com ${fmt.money(180000)} em receita adicional estimada.
    </div>`;
}

function openProductDetail(productId) {
  const p = HOLDPRINT._M.products.find(x=>x.id===productId);
  if (!p) return;
  const totalRev = HOLDPRINT._M.products.reduce((t,x)=>t+x.revenue,0);
  const peak = p.monthly ? p.monthly.indexOf(Math.max(...p.monthly)) : 0;
  const html = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Categoria</div><div class="detail-value">${p.category}</div></div>
      <div class="detail-item"><div class="detail-label">Tendência</div><div class="detail-value">${p.trend==='up'?'<span style="color:var(--success)">↑ Crescendo</span>':p.trend==='down'?'<span style="color:var(--danger)">↓ Caindo</span>':'→ Estável'}</div></div>
      <div class="detail-item"><div class="detail-label">Receita Total</div><div class="detail-value" style="font-size:20px;font-weight:700;color:var(--primary)">${fmt.money(p.revenue)}</div></div>
      <div class="detail-item"><div class="detail-label">% da Receita Total</div><div class="detail-value">${Math.round(p.revenue/totalRev*100)}%</div></div>
      <div class="detail-item"><div class="detail-label">Quantidade Vendida</div><div class="detail-value">${p.sold} unidades</div></div>
      <div class="detail-item"><div class="detail-label">Preço Médio</div><div class="detail-value">${fmt.money(p.avg_price)}</div></div>
    </div>
    <div style="font-weight:600;margin:16px 0 8px">Sazonalidade (vendas por mês)</div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:16px">
      ${MONTHS_6.map((m,i)=>`
        <div style="text-align:center;padding:8px 4px;background:${i===peak?'var(--primary)':'var(--gray-100)'};border-radius:6px;color:${i===peak?'#fff':'var(--gray-700)'}">
          <div style="font-size:11px;font-weight:500">${m.split('/')[0]}</div>
          <div style="font-size:15px;font-weight:700">${p.monthly?p.monthly[i]:'-'}</div>
        </div>`).join('')}
    </div>
    <div style="padding:12px;background:${p.trend==='up'?'var(--success-light)':p.trend==='down'?'var(--danger-light)':'var(--gray-50)'};border-radius:8px;font-size:13px">
      ${p.trend==='up'?`📈 <strong>Crescimento detectado!</strong> ${p.name} está em tendência de alta. Considere aumentar estoques e divulgar em campanhas.`:p.trend==='down'?`📉 <strong>Atenção!</strong> ${p.name} está em queda. Avalie promoções ou reformulação da oferta.`:`→ Produto com demanda estável. Mês de pico: ${MONTHS_6[peak]}.`}
    </div>`;
  openModal(`📦 ${p.name}`, html, () => closeModal(), true);
  document.getElementById('modalSave').style.display = 'none';
  document.getElementById('modalCancel').textContent = 'Fechar';
}

// ===== 8. AGENDAMENTOS =====
const _SEND_HISTORY = [
  { data:'18/03/2026 08:00', nome:'Pipeline Diário', dest:'diretor@empresa.com', status:'Enviado', arquivo:'pipeline_20260318.pdf' },
  { data:'17/03/2026 08:00', nome:'Pipeline Diário', dest:'diretor@empresa.com', status:'Enviado', arquivo:'pipeline_20260317.pdf' },
  { data:'17/03/2026 09:00', nome:'Relatório Semanal de Vendas', dest:'equipe@empresa.com', status:'Enviado', arquivo:'vendas_sem11_2026.xlsx' },
  { data:'10/03/2026 09:00', nome:'Relatório Semanal de Vendas', dest:'equipe@empresa.com', status:'Enviado', arquivo:'vendas_sem10_2026.xlsx' },
  { data:'01/03/2026 08:00', nome:'Performance Mensal', dest:'gerencia@empresa.com', status:'Enviado', arquivo:'performance_fev2026.pdf' },
  { data:'01/03/2026 08:01', nome:'Performance Mensal', dest:'gerencia@empresa.com', status:'Erro', arquivo:'-' }
];

function renderAgendamentos() {
  const el = document.getElementById('relContent');
  const agendamentos = JSON.parse(localStorage.getItem('crm_agendamentos') || '[]');

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="font-size:16px;font-weight:700">Relatórios Agendados</h3>
        <p style="font-size:13px;color:var(--gray-500)">Configure envios automáticos de relatórios por email</p>
      </div>
      <button class="btn btn-primary" onclick="openFormAgendamento()">+ Novo Agendamento</button>
    </div>

    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:var(--gray-600);margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Templates Rápidos</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        ${[
          { label:'Relatório Semanal de Vendas', freq:'Semanalmente (seg, 08:00)', tipo:'Vendas', dest:'equipe@empresa.com', ativo:true },
          { label:'Pipeline Diário', freq:'Diariamente (09:00)', tipo:'Pipeline', dest:'diretor@empresa.com', ativo:true },
          { label:'Performance Mensal', freq:'Mensalmente (1º, 08:00)', tipo:'Performance', dest:'gerencia@empresa.com', ativo:false }
        ].map(t=>`
          <div class="card" style="cursor:pointer;border:1px dashed var(--primary);transition:all .15s" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''" onclick="openFormAgendamento(${JSON.stringify(t).replace(/"/g,'&quot;')})">
            <div class="card-body" style="padding:14px">
              <div style="font-size:10px;font-weight:700;color:var(--primary);margin-bottom:6px;text-transform:uppercase">📋 Template</div>
              <div style="font-weight:600;margin-bottom:4px;font-size:13px">${t.label}</div>
              <div style="font-size:12px;color:var(--gray-500)">${t.freq}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">Agendamentos Configurados (${agendamentos.length})</span></div>
      <div class="card-body" style="padding:0" id="agendamentosTable">
        ${renderAgendamentosTable(agendamentos)}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Histórico de Envios</span></div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Data/Hora</th><th>Relatório</th><th>Destinatários</th><th>Status</th><th>Arquivo</th></tr></thead>
          <tbody>${_SEND_HISTORY.map(h=>`<tr>
            <td style="font-size:12px;color:var(--gray-600)">${h.data}</td>
            <td><strong>${h.nome}</strong></td>
            <td style="font-size:12px">${h.dest}</td>
            <td><span class="badge ${h.status==='Enviado'?'badge-fechado':'badge-perdido'}">${h.status==='Enviado'?'✅ '+h.status:'❌ '+h.status}</span></td>
            <td>${h.arquivo!=='-'?`<button class="btn btn-sm btn-secondary" onclick="showToast('Baixando: ${h.arquivo}','success')">📥 ${h.arquivo}</button>`:'-'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

function renderAgendamentosTable(list) {
  if (!list.length) return `
    <div class="empty-state">
      <div class="empty-state-icon">⏰</div>
      <div class="empty-state-text">Nenhum agendamento configurado</div>
      <div><button class="btn btn-primary" onclick="openFormAgendamento()">+ Criar Agendamento</button></div>
    </div>`;
  return `<table><thead><tr><th>Nome</th><th>Tipo</th><th>Frequência</th><th>Próximo Envio</th><th>Destinatários</th><th>Formato</th><th>Status</th><th>Ações</th></tr></thead>
  <tbody>${list.map((a,i)=>`<tr>
    <td><strong>${a.nome}</strong></td>
    <td>${a.tipo}</td>
    <td>${a.frequencia}</td>
    <td style="font-size:12px">${a.proximo||'-'}</td>
    <td style="font-size:12px">${a.destinatarios||'-'}</td>
    <td>${a.formato}</td>
    <td>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" ${a.ativo?'checked':''} onchange="toggleAgendamento(${i},this.checked)">
        <span class="badge ${a.ativo?'badge-fechado':'badge-perdido'}" style="font-size:10px">${a.ativo?'Ativo':'Inativo'}</span>
      </label>
    </td>
    <td>
      <div class="table-actions">
        <button class="btn btn-sm btn-secondary" onclick="openFormAgendamento(null,${i})" title="Editar">✏️</button>
        <button class="btn btn-sm btn-success" onclick="executarAgendamento('${a.nome}')" title="Executar agora">▶️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAgendamento(${i})" title="Excluir">🗑️</button>
      </div>
    </td>
  </tr>`).join('')}</tbody></table>`;
}

function toggleAgendamento(idx, ativo) {
  const list = JSON.parse(localStorage.getItem('crm_agendamentos') || '[]');
  if (list[idx]) { list[idx].ativo = ativo; localStorage.setItem('crm_agendamentos', JSON.stringify(list)); }
  showToast(ativo ? 'Agendamento ativado' : 'Agendamento pausado', ativo ? 'success' : 'warning');
}

function openFormAgendamento(template, editIdx) {
  const list = JSON.parse(localStorage.getItem('crm_agendamentos') || '[]');
  const item = editIdx !== undefined ? list[editIdx] : null;
  const t = template || {};
  const html = `
    <div class="form-group"><label class="form-label">Nome do Relatório *</label><input id="agNome" class="form-control" value="${item?.nome || t.label || ''}" placeholder="Ex: Relatório Semanal de Pipeline"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Tipo de Relatório</label>
        <select id="agTipo" class="form-control">
          ${['Vendas','Pipeline','Conversão por Fonte','Performance','Forecast','Deals em Risco','Produtos'].map(tp=>`<option ${(item?.tipo||t.tipo)===tp?'selected':''}>${tp}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Frequência</label>
        <select id="agFreq" class="form-control">
          ${['Diariamente','Semanalmente (seg, 08:00)','Semanalmente (sex, 17:00)','Quinzenalmente','Mensalmente (1º, 08:00)','Mensalmente (último dia)'].map(f=>`<option ${(item?.frequencia||t.freq)===f?'selected':''}>${f}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Horário preferido</label><input id="agHora" class="form-control" type="time" value="${item?.hora||'08:00'}"></div>
      <div class="form-group"><label class="form-label">Formato de envio</label>
        <select id="agFormato" class="form-control">
          <option>PDF</option><option>Excel/CSV</option><option>PDF + Excel</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Destinatários (emails, separados por vírgula)</label><input id="agDest" class="form-control" value="${item?.destinatarios||t.dest||''}" placeholder="email1@empresa.com, email2@empresa.com"></div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--gray-50);border-radius:8px">
      <input id="agAtivo" type="checkbox" ${(item?.ativo!==false)?'checked':''} style="width:16px;height:16px;cursor:pointer">
      <label for="agAtivo" class="form-label" style="margin:0;cursor:pointer">Agendamento ativo (será executado automaticamente)</label>
    </div>`;
  openModal(editIdx !== undefined ? 'Editar Agendamento' : 'Novo Agendamento', html, () => {
    const nome = getVal('agNome').trim();
    if (!nome) { showToast('Nome é obrigatório', 'error'); return; }
    const now = new Date(); now.setDate(now.getDate()+1);
    const ag = { nome, tipo: getVal('agTipo'), frequencia: getVal('agFreq'), hora: getVal('agHora'), formato: getVal('agFormato'), destinatarios: getVal('agDest'), ativo: document.getElementById('agAtivo').checked, criadoEm: new Date().toISOString(), proximo: now.toLocaleDateString('pt-BR') };
    if (editIdx !== undefined) list[editIdx] = ag; else list.push(ag);
    localStorage.setItem('crm_agendamentos', JSON.stringify(list));
    closeModal();
    showToast(editIdx !== undefined ? 'Agendamento atualizado!' : 'Agendamento criado!', 'success');
    renderAgendamentos();
  });
}

function deleteAgendamento(idx) {
  if (!confirm('Excluir este agendamento?')) return;
  const list = JSON.parse(localStorage.getItem('crm_agendamentos') || '[]');
  list.splice(idx, 1);
  localStorage.setItem('crm_agendamentos', JSON.stringify(list));
  renderAgendamentos();
  showToast('Agendamento excluído', 'warning');
}

function executarAgendamento(nome) {
  showToast(`Relatório "${nome}" gerado e enviado!`, 'success');
  // Add to history mock
  const now = new Date();
  _SEND_HISTORY.unshift({
    data: now.toLocaleString('pt-BR'),
    nome,
    dest: 'equipe@empresa.com',
    status: 'Enviado',
    arquivo: nome.toLowerCase().replace(/\s+/g,'_') + '_' + now.toISOString().slice(0,10).replace(/-/g,'') + '.pdf'
  });
}
