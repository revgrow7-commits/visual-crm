// ===== HOLDPRINT API CLIENT =====
const HOLDPRINT = {
  BASE_URL: localStorage.getItem('hp_url') || 'https://api.holdprint.net',
  region: localStorage.getItem('hp_region') || 'sp',
  _cache: {},
  CACHE_TTL: 900000, // 15 min
  useMock: false,

  TOKENS: {
    sp: '4e20f4c2-6f84-49e7-9ab9-e27d6930a13a',
    poa: '84ae7df8-893c-4b0d-9b6e-516def1367f0'
  },

  token() { return this.TOKENS[this.region]; },

  setRegion(r) {
    this.region = r;
    localStorage.setItem('hp_region', r);
    this._cache = {};
    document.getElementById('regionLabel') && (document.getElementById('regionLabel').textContent = r.toUpperCase());
  },

  _ck(path) { return this.region + ':' + path; },
  _gc(path) {
    const e = this._cache[this._ck(path)];
    return e && Date.now() - e.t < this.CACHE_TTL ? e.d : null;
  },
  _sc(path, d) { this._cache[this._ck(path)] = { d, t: Date.now() }; },

  async request(method, path, body) {
    const cached = method === 'GET' ? this._gc(path) : null;
    if (cached) return cached;
    if (this.useMock) return this._mock(path);
    try {
      const resp = await fetch(this.BASE_URL + path, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.token() },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      if (method === 'GET') this._sc(path, data);
      return data;
    } catch (e) {
      console.warn('[Holdprint] API indisponível, usando dados de exemplo:', e.message);
      this.useMock = true;
      this._updateApiStatus(false);
      return this._mock(path);
    }
  },

  _updateApiStatus(ok) {
    const el = document.getElementById('apiStatus');
    if (!el) return;
    el.className = 'api-status ' + (ok ? 'connected' : 'mock');
    el.title = ok ? 'Holdprint API conectada' : 'Modo demo (API offline)';
    el.textContent = ok ? '● API' : '◌ Demo';
  },

  get(p) { return this.request('GET', p); },
  post(p, b) { return this.request('POST', p, b); },
  put(p, b) { return this.request('PUT', p, b); },
  patch(p, b) { return this.request('PATCH', p, b); },

  // ===== ENDPOINTS =====
  getOpportunities(params = {}) { return this.get('/api/opportunities' + _qs(params)); },
  getOpportunitiesByStage() { return this.get('/api/opportunities/by-stage'); },
  getProposals(params = {}) { return this.get('/api/proposals' + _qs(params)); },
  getContacts(params = {}) { return this.get('/api/contacts' + _qs(params)); },
  getCompanies() { return this.get('/api/companies'); },
  getProducts() { return this.get('/api/products'); },
  getActivities(params = {}) { return this.get('/api/activities' + _qs(params)); },
  getTasks(params = {}) { return this.get('/api/tasks' + _qs(params)); },
  patchOpportunityStage(id, stage) { return this.patch(`/api/opportunities/${id}/stage`, { stage }); },
  patchProposalStatus(id, status) { return this.patch(`/api/proposals/${id}/status`, { status }); },
  getReportPipeline() { return this.get('/api/reports/pipeline-summary'); },
  getReportForecast(period) { return this.get('/api/reports/sales-forecast?period=' + (period || '')); },
  getReportConversion(from, to) { return this.get(`/api/reports/conversion-rate?from_date=${from}&to_date=${to}`); },
  getReportRevenue(from, to) { return this.get(`/api/reports/revenue-by-period?period=monthly&from=${from}&to=${to}`); },
  getReportSellers(month) { return this.get('/api/reports/seller-performance?month=' + (month || '')); },

  // ===== MOCK DATA =====
  _mock(path) {
    if (path.includes('/by-stage')) return this._mockByStage();
    if (path.includes('/opportunities')) return this._M.opps;
    if (path.includes('/proposals')) return this._M.proposals;
    if (path.includes('/products')) return this._M.products;
    if (path.includes('/contacts')) return this._M.contacts;
    if (path.includes('/companies')) return this._M.companies;
    if (path.includes('/activities')) return this._M.activities;
    if (path.includes('/tasks')) return this._M.tasks;
    if (path.includes('pipeline-summary')) return this._M.pipeline;
    if (path.includes('sales-forecast')) return this._M.forecast;
    if (path.includes('conversion-rate')) return this._M.conversion;
    if (path.includes('revenue-by-period')) return this._M.revenue;
    if (path.includes('seller-performance')) return this._M.sellers;
    return [];
  },

  _mockByStage() {
    const s = {};
    for (const o of this._M.opps) { if (!s[o.stage]) s[o.stage] = []; s[o.stage].push(o); }
    return s;
  },

  _M: {
    opps: [
      { id:1, title:"Fachada ACM – Loja Centro", company:"Moda Fashion SP", contact:"Pedro Alves", value:8500, stage:"negociação", probability:80, source:"inbound", responsible:"Carlos Mendes", expected_close:"2026-03-25", created_at:"2026-02-10T10:00:00Z", last_activity:"2026-03-05T14:00:00Z", stage_entered_at:"2026-02-20T10:00:00Z" },
      { id:2, title:"Plotagem Frota 5 Veículos", company:"Transportes Veloz", contact:"Sandra Lima", value:6200, stage:"proposta", probability:60, source:"outbound", responsible:"Carlos Mendes", expected_close:"2026-04-05", created_at:"2026-02-15T09:00:00Z", last_activity:"2026-03-10T11:00:00Z", stage_entered_at:"2026-03-01T09:00:00Z" },
      { id:3, title:"Letreiro Luminoso – Farmácia", company:"Farmácia Saúde Total", contact:"Dr. Marcus Rocha", value:12000, stage:"fechamento", probability:95, source:"indicacao", responsible:"Ana Lima", expected_close:"2026-03-22", created_at:"2026-01-20T08:00:00Z", last_activity:"2026-03-17T09:00:00Z", stage_entered_at:"2026-03-10T08:00:00Z" },
      { id:4, title:"Banner PDV – Supermercado", company:"Super Bom Preço", contact:"Carla Mendes", value:3800, stage:"qualificação", probability:40, source:"retorno", responsible:"Ana Lima", expected_close:"2026-04-10", created_at:"2026-03-01T10:00:00Z", last_activity:"2026-03-14T16:00:00Z", stage_entered_at:"2026-03-05T10:00:00Z" },
      { id:5, title:"Impressão Digital – Evento Corp.", company:"EventosPro", contact:"Rodrigo Faria", value:5500, stage:"fechamento", probability:95, source:"marketing", responsible:"Carlos Mendes", expected_close:"2026-03-20", created_at:"2026-03-05T11:00:00Z", last_activity:"2026-03-16T10:00:00Z", stage_entered_at:"2026-03-12T11:00:00Z" },
      { id:6, title:"Totem Indicativo – Hospital", company:"Hospital São Lucas", contact:"Dra. Cristina Borges", value:18000, stage:"proposta", probability:60, source:"outbound", responsible:"Ana Lima", expected_close:"2026-04-15", created_at:"2026-02-01T08:00:00Z", last_activity:"2026-03-08T15:00:00Z", stage_entered_at:"2026-02-25T08:00:00Z" },
      { id:7, title:"Adesivo Vinil – Frota Ônibus", company:"Viação Progresso", contact:"Marcelo Teixeira", value:9800, stage:"prospecção", probability:20, source:"outbound", responsible:"Carlos Mendes", expected_close:"2026-05-01", created_at:"2026-03-12T14:00:00Z", last_activity:"2026-03-12T14:00:00Z", stage_entered_at:"2026-03-12T14:00:00Z" },
      { id:8, title:"Comunicação Visual – Academia", company:"Fit Academy Plus", contact:"Bruno Coelho", value:22000, stage:"negociação", probability:75, source:"inbound", responsible:"Ana Lima", expected_close:"2026-03-28", created_at:"2026-01-15T09:00:00Z", last_activity:"2026-02-28T11:00:00Z", stage_entered_at:"2026-02-10T09:00:00Z" },
      { id:9, title:"Placa de Obra – Construtora", company:"Construtora Horizonte", contact:"Eng. Paulo Vasconcelos", value:4500, stage:"qualificação", probability:35, source:"indicacao", responsible:"Carlos Mendes", expected_close:"2026-04-20", created_at:"2026-03-08T10:00:00Z", last_activity:"2026-03-09T14:00:00Z", stage_entered_at:"2026-03-08T10:00:00Z" },
      { id:10, title:"Fachada Restaurante Temático", company:"Restaurante Gaúcho", contact:"Ana Oliveira", value:7200, stage:"proposta", probability:65, source:"inbound", responsible:"Roberto Santos", expected_close:"2026-04-01", created_at:"2026-02-20T09:00:00Z", last_activity:"2026-03-12T10:00:00Z", stage_entered_at:"2026-03-05T09:00:00Z" },
      { id:11, title:"Sinalização Interna – Clínica", company:"Clínica Bem Estar POA", contact:"Dr. Fernandez", value:8900, stage:"negociação", probability:80, source:"retorno", responsible:"Juliana Costa", expected_close:"2026-03-24", created_at:"2026-02-05T11:00:00Z", last_activity:"2026-03-10T09:00:00Z", stage_entered_at:"2026-02-25T11:00:00Z" },
      { id:12, title:"Banner Outdoor – Rede de Lojas", company:"Lojas Gaúchas S.A.", contact:"Diretora Maria Clara", value:31000, stage:"fechamento", probability:90, source:"marketing", responsible:"Roberto Santos", expected_close:"2026-03-21", created_at:"2026-01-10T08:00:00Z", last_activity:"2026-03-16T14:00:00Z", stage_entered_at:"2026-03-08T08:00:00Z" },
      { id:13, title:"Plotagem Carro de Som", company:"Rádio Cidade FM", contact:"Gustavo Dias", value:1800, stage:"prospecção", probability:20, source:"outbound", responsible:"Juliana Costa", expected_close:"2026-04-30", created_at:"2026-03-15T15:00:00Z", last_activity:"2026-03-15T15:00:00Z", stage_entered_at:"2026-03-15T15:00:00Z" },
      { id:14, title:"Folder Campanha – Imobiliária", company:"Imobiliária Torres", contact:"Fábio Rocha", value:2800, stage:"ganho", probability:100, source:"inbound", responsible:"Carlos Mendes", expected_close:"2026-02-28", created_at:"2026-02-01T09:00:00Z", last_activity:"2026-02-28T17:00:00Z", stage_entered_at:"2026-02-25T09:00:00Z" },
      { id:15, title:"Letreiro Shopping – Boutique", company:"Boutique Estilo", contact:"Renata Fontes", value:6500, stage:"ganho", probability:100, source:"indicacao", responsible:"Ana Lima", expected_close:"2026-02-25", created_at:"2026-01-25T10:00:00Z", last_activity:"2026-02-25T16:00:00Z", stage_entered_at:"2026-02-20T10:00:00Z" },
      { id:16, title:"Comunicação Visual – Auto Posto", company:"Auto Posto Estrela", contact:"Seu Antônio", value:14000, stage:"perdido", probability:0, source:"outbound", responsible:"Carlos Mendes", expected_close:"2026-02-15", created_at:"2026-01-05T08:00:00Z", last_activity:"2026-02-15T12:00:00Z", rejection_reason:"Preço acima do orçado" },
      { id:17, title:"Adesivo Vitrine – Rede Farmácias", company:"Rede Farmácias Mais", contact:"Gerente Regional", value:11000, stage:"perdido", probability:0, source:"marketing", responsible:"Ana Lima", expected_close:"2026-03-01", created_at:"2026-01-20T11:00:00Z", last_activity:"2026-03-01T10:00:00Z", rejection_reason:"Optou por fornecedor local" },
      { id:18, title:"Sinalização Shopping Nova Era", company:"Shopping Nova Era", contact:"Gerente de Marketing", value:45000, stage:"negociação", probability:70, source:"inbound", responsible:"Roberto Santos", expected_close:"2026-04-30", created_at:"2026-01-30T09:00:00Z", last_activity:"2026-03-01T11:00:00Z", stage_entered_at:"2026-02-15T09:00:00Z" }
    ],

    proposals: [
      { id:1, number:"2026-0001", opportunity_id:3, status:"visualizado", total_value:12000, sent_date:"2026-03-12", viewed_date:"2026-03-13", company:"Farmácia Saúde Total" },
      { id:2, number:"2026-0002", opportunity_id:5, status:"aceito", total_value:5500, sent_date:"2026-03-10", accepted_date:"2026-03-16", company:"EventosPro" },
      { id:3, number:"2026-0003", opportunity_id:12, status:"enviado", total_value:31000, sent_date:"2026-03-14", company:"Lojas Gaúchas S.A." }
    ],

    products: [
      { id:1, name:"Banner em Lona", category:"Grande Formato", sold:48, revenue:86400, trend:"up", avg_price:1800, monthly:[8,9,7,10,7,7] },
      { id:2, name:"Fachada ACM", category:"Fachadas", sold:12, revenue:96000, trend:"up", avg_price:8000, monthly:[1,2,1,3,2,3] },
      { id:3, name:"Impressão Digital", category:"Impressão", sold:156, revenue:46800, trend:"stable", avg_price:300, monthly:[24,28,22,30,26,26] },
      { id:4, name:"Adesivo Vinil", category:"Adesivos", sold:73, revenue:65700, trend:"up", avg_price:900, monthly:[10,12,9,14,14,14] },
      { id:5, name:"Plotagem Veicular", category:"Veicular", sold:21, revenue:88200, trend:"up", avg_price:4200, monthly:[3,4,2,4,4,4] },
      { id:6, name:"Letreiro Luminoso", category:"Luminosos", sold:8, revenue:80000, trend:"up", avg_price:10000, monthly:[1,1,1,2,1,2] },
      { id:7, name:"Placa em ACM", category:"Placas", sold:34, revenue:40800, trend:"stable", avg_price:1200, monthly:[5,6,5,7,5,6] },
      { id:8, name:"Cartão de Visita", category:"Impressão", sold:280, revenue:25200, trend:"down", avg_price:90, monthly:[52,48,44,50,46,40] },
      { id:9, name:"Folder/Flyer", category:"Impressão", sold:95, revenue:28500, trend:"stable", avg_price:300, monthly:[16,17,15,18,15,14] },
      { id:10, name:"Totem Indicativo", category:"Sinalização", sold:5, revenue:45000, trend:"up", avg_price:9000, monthly:[0,1,0,2,1,1] }
    ],

    contacts: [], companies: [], tasks: [], activities: [],

    pipeline: { total_value: 186300, conversion_rate: 42, by_stage: { prospecção:2, qualificação:2, proposta:3, negociação:3, fechamento:3, ganho:2, perdido:2 } },

    forecast: { meta: 80000, weighted: 130060, optimistic: 196000, ganho: 9300, by_stage: [
      { stage:"prospecção", value:11600, probability:20, weighted:2320 },
      { stage:"qualificação", value:8300, probability:38, weighted:3154 },
      { stage:"proposta", value:56200, probability:62, weighted:34844 },
      { stage:"negociação", value:84400, probability:77, weighted:64988 },
      { stage:"fechamento", value:48500, probability:93, weighted:45105 }
    ]},

    conversion: {
      monthly: [
        { month:"Out/25", inbound:45, outbound:28, indicacao:55, retorno:65, marketing:30 },
        { month:"Nov/25", inbound:48, outbound:32, indicacao:58, retorno:68, marketing:35 },
        { month:"Dez/25", inbound:42, outbound:25, indicacao:60, retorno:70, marketing:28 },
        { month:"Jan/26", inbound:50, outbound:35, indicacao:62, retorno:72, marketing:38 },
        { month:"Fev/26", inbound:52, outbound:30, indicacao:65, retorno:75, marketing:40 },
        { month:"Mar/26", inbound:55, outbound:33, indicacao:68, retorno:78, marketing:42 }
      ],
      by_source: [
        { source:"Inbound",    total:24, won:12, lost:4, open:8, rate:50.0, avg_ticket:7200, cycle_days:18 },
        { source:"Outbound",   total:18, won:6,  lost:6, open:6, rate:33.3, avg_ticket:5800, cycle_days:28 },
        { source:"Indicação",  total:15, won:9,  lost:2, open:4, rate:60.0, avg_ticket:9100, cycle_days:14 },
        { source:"Retorno",    total:10, won:7,  lost:1, open:2, rate:70.0, avg_ticket:6500, cycle_days:10 },
        { source:"Marketing",  total:12, won:4,  lost:4, open:4, rate:33.3, avg_ticket:4200, cycle_days:22 }
      ]
    },

    revenue: {
      monthly:[
        { month:"Out/25", revenue:65000, deals:12, meta:70000 },
        { month:"Nov/25", revenue:72000, deals:15, meta:70000 },
        { month:"Dez/25", revenue:58000, deals:11, meta:70000 },
        { month:"Jan/26", revenue:81000, deals:18, meta:80000 },
        { month:"Fev/26", revenue:76000, deals:16, meta:80000 },
        { month:"Mar/26", revenue:43000, deals:9,  meta:80000 }
      ],
      by_responsible:[
        { name:"Carlos Mendes", revenue:142000, deals:28 },
        { name:"Ana Lima",      revenue:128000, deals:24 },
        { name:"Roberto Santos",revenue:96000,  deals:18 },
        { name:"Juliana Costa", revenue:71000,  deals:14 }
      ]
    },

    sellers: [
      { name:"Carlos Mendes", open_deals:6, total_value:40700, won:8, lost:3, conversion:72.7, avg_ticket:6800, avg_days:22, activities:18, pipeline_trend:[32000,38000,40700] },
      { name:"Ana Lima",      open_deals:5, total_value:56700, won:7, lost:2, conversion:77.8, avg_ticket:9200, avg_days:18, activities:22, pipeline_trend:[48000,52000,56700] },
      { name:"Roberto Santos",open_deals:4, total_value:59100, won:5, lost:1, conversion:83.3, avg_ticket:11800,avg_days:25, activities:15, pipeline_trend:[55000,58000,59100] },
      { name:"Juliana Costa", open_deals:2, total_value:10700, won:3, lost:2, conversion:60.0, avg_ticket:5400, avg_days:15, activities:12, pipeline_trend:[8000,9500,10700] }
    ]
  }
};

function _qs(params) {
  const q = new URLSearchParams(params).toString();
  return q ? '?' + q : '';
}
