// ===== HOLDPRINT API CLIENT =====
const HOLDPRINT = {
  BASE_URL: 'https://api.holdworks.ai',
  region: localStorage.getItem('hp_region') || 'sp',
  _cache: {},
  CACHE_TTL: 900000, // 15 min
  _realApiOk: null, // null=untested, true=working, false=offline

  TOKENS: {
    sp: '4e20f4c2-6f84-49e7-9ab9-e27d6930a13a',
    poa: '84ae7df8-893c-4b0d-9b6e-516def1367f0'
  },

  token() { return this.TOKENS[this.region]; },

  setRegion(r) {
    this.region = r;
    localStorage.setItem('hp_region', r);
    this._cache = {};
    this._realApiOk = null;
    document.getElementById('regionLabel') && (document.getElementById('regionLabel').textContent = r.toUpperCase());
  },

  _ck(path) { return this.region + ':' + path; },
  _gc(path) {
    const e = this._cache[this._ck(path)];
    return e && Date.now() - e.t < this.CACHE_TTL ? e.d : null;
  },
  _sc(path, d) { this._cache[this._ck(path)] = { d, t: Date.now() }; },

  // Real Holdprint API call — only for /api-key/* endpoints
  async _fetchReal(path) {
    const cached = this._gc(path);
    if (cached) return cached;
    const resp = await fetch(this.BASE_URL + path, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.token() }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    this._sc(path, data);
    return data;
  },

  // Virtual CRM paths always use mock (they don't exist in real API)
  async request(method, path, body) {
    const cached = method === 'GET' ? this._gc(path) : null;
    if (cached) return cached;
    return this._mock(path);
  },

  _updateApiStatus(ok) {
    const el = document.getElementById('apiStatus');
    if (!el) return;
    el.className = 'api-status ' + (ok ? 'connected' : 'mock');
    el.title = ok ? 'Holdprint ERP conectado' : 'Modo demo (API offline)';
    el.textContent = ok ? '● Holdprint' : '◌ Demo';
  },

  get(p) { return this.request('GET', p); },
  post(p, b) { return this.request('POST', p, b); },
  put(p, b) { return this.request('PUT', p, b); },
  patch(p, b) { return this.request('PATCH', p, b); },

  // ===== VIRTUAL CRM ENDPOINTS (mock-only, for kanban/pipeline/reports) =====
  getOpportunities(params = {}) { return this.get('/api/opportunities' + _qs(params)); },
  getOpportunitiesByStage() { return this.get('/api/opportunities/by-stage'); },
  getProposals(params = {}) { return this.get('/api/proposals' + _qs(params)); },
  getContacts(params = {}) { return this.get('/api/contacts' + _qs(params)); },
  getCompanies() { return this.get('/api/companies'); },
  getProducts() { return this.get('/api/products'); },
  getActivities(params = {}) { return this.get('/api/activities' + _qs(params)); },
  getTasks(params = {}) { return this.get('/api/tasks' + _qs(params)); },
  patchOpportunityStage(id, stage) { return this._mock('/api/opportunities/by-stage'); },
  patchProposalStatus(id, status) { return this._mock('/api/proposals'); },
  getReportPipeline() { return this.get('/api/reports/pipeline-summary'); },
  getReportForecast(period) { return this.get('/api/reports/sales-forecast'); },
  getReportConversion(from, to) { return this.get('/api/reports/conversion-rate'); },
  getReportRevenue(from, to) { return this.get('/api/reports/revenue-by-period'); },
  getReportSellers(month) { return this.get('/api/reports/seller-performance'); },

  // ===== REAL HOLDPRINT ENDPOINTS =====
  async getCustomers(page = 1) {
    try {
      const res = await this._fetchReal(`/api-key/customers/data?page=${page}`);
      if (this._realApiOk !== true) { this._realApiOk = true; this._updateApiStatus(true); }
      return (res.data || []).map(c => this._normalizeCustomer(c));
    } catch (e) {
      console.warn('[Holdprint] customers offline:', e.message);
      if (this._realApiOk !== false) { this._realApiOk = false; this._updateApiStatus(false); }
      return this._M.contacts;
    }
  },

  async getSuppliers(page = 1) {
    try {
      const res = await this._fetchReal(`/api-key/suppliers/data?page=${page}`);
      if (this._realApiOk !== true) { this._realApiOk = true; this._updateApiStatus(true); }
      return (res.data || []).map(c => this._normalizeCustomer(c));
    } catch (e) {
      console.warn('[Holdprint] suppliers offline:', e.message);
      return [];
    }
  },

  async getBudgets(page = 1) {
    try {
      const res = await this._fetchReal(`/api-key/budgets/data?page=${page}`);
      if (this._realApiOk !== true) { this._realApiOk = true; this._updateApiStatus(true); }
      return (res.data || []).map(b => this._normalizeBudget(b));
    } catch (e) {
      console.warn('[Holdprint] budgets offline:', e.message);
      if (this._realApiOk !== false) { this._realApiOk = false; this._updateApiStatus(false); }
      return this._M.opps;
    }
  },

  async getJobs(page = 1) {
    try {
      const res = await this._fetchReal(`/api-key/jobs/data?page=${page}`);
      if (this._realApiOk !== true) { this._realApiOk = true; this._updateApiStatus(true); }
      return (res.data || []).map(j => this._normalizeJob(j));
    } catch (e) {
      console.warn('[Holdprint] jobs offline:', e.message);
      return [];
    }
  },

  async getExpenses(page = 1) {
    try {
      const res = await this._fetchReal(`/api-key/expenses/data?page=${page}`);
      if (this._realApiOk !== true) { this._realApiOk = true; this._updateApiStatus(true); }
      return res.data || [];
    } catch (e) {
      console.warn('[Holdprint] expenses offline:', e.message);
      return [];
    }
  },

  async getIncomes(page = 1) {
    try {
      const res = await this._fetchReal(`/api-key/incomes/data?page=${page}`);
      if (this._realApiOk !== true) { this._realApiOk = true; this._updateApiStatus(true); }
      return res.data || [];
    } catch (e) {
      console.warn('[Holdprint] incomes offline:', e.message);
      return [];
    }
  },

  // ===== NORMALIZATION — Real API → CRM format =====
  _normalizeCustomer(c) {
    return {
      id: c.id,
      nome: c.fullName || c.name || '',
      email: c.mainEmail || '',
      telefone: c.mainPhoneNumber || '',
      tipo: c.entityType || 'PJ',
      ativo: c.active !== false,
      criado: c.creationTime,
      enderecos: c.addresses || [],
      contatos: c.contacts || []
    };
  },

  _BUDGET_STATE: { 0:'rascunho', 1:'pendente', 2:'enviado', 3:'ganho', 4:'perdido' },

  _normalizeBudget(b) {
    const stateStr = this._BUDGET_STATE[b.budgetState] ?? 'pendente';
    const stageMap = { rascunho:'prospecção', pendente:'qualificação', enviado:'proposta', ganho:'ganho', perdido:'perdido' };
    const totalValue = (b.proposes || []).reduce((s, p) => s + (p.totalPrice || 0), 0);
    return {
      id: b.code,
      title: b.title || `Orçamento ${b.code}`,
      company: b.customerName || '',
      value: totalValue,
      stage: stageMap[stateStr] || 'qualificação',
      status: stateStr,
      budgetState: b.budgetState,
      created_at: b.creationDate,
      won_date: b.wonDate,
      proposes: b.proposes || []
    };
  },

  _normalizeJob(j) {
    return {
      id: j.id,
      code: j.code,
      title: j.title || `Job ${j.code}`,
      company: j.customerName || '',
      responsible: j.responsibleName || '',
      value: j.totalPrice || 0,
      status: j.isFinalized ? 'finalizado' : 'em_producao',
      chargeStatus: j.jobChargeStatus,
      created_at: j.creationTime,
      costs: j.costs || 0,
      production: j.production || {}
    };
  },

  // Probe the real API on load to set status indicator
  async probe() {
    try {
      await this._fetchReal('/api-key/customers/data?page=1');
      this._realApiOk = true;
      this._updateApiStatus(true);
    } catch {
      this._realApiOk = false;
      this._updateApiStatus(false);
    }
  },

  // ===== FETCH ALL PAGES =====
  async fetchAll(baseEndpoint, maxPages = 5) {
    const all = [];
    for (let p = 1; p <= maxPages; p++) {
      const sep = baseEndpoint.includes('?') ? '&' : '?';
      const res = await this._fetchReal(`${baseEndpoint}${sep}page=${p}`);
      const data = res.data || [];
      all.push(...data);
      if (!res.hasNextPage || data.length === 0) break;
    }
    return all;
  },

  // ===== SYNC ALL REAL DATA — updates _M in-place =====
  _realData: null,
  _syncing: false,

  async syncRealData() {
    if (this._syncing) return;
    this._syncing = true;
    console.log('[Holdprint] Sincronizando dados reais...');

    try {
      const [budgetsRes, incomesRes, jobsRes, customersRes] = await Promise.allSettled([
        this.fetchAll('/api-key/budgets/data',  6),
        this.fetchAll('/api-key/incomes/data',   4),
        this.fetchAll('/api-key/jobs/data',      4),
        this._fetchReal('/api-key/customers/data?page=1')
      ]);

      const rawBudgets  = budgetsRes.status  === 'fulfilled' ? budgetsRes.value  : [];
      const rawIncomes  = incomesRes.status  === 'fulfilled' ? incomesRes.value  : [];
      const rawJobs     = jobsRes.status     === 'fulfilled' ? jobsRes.value     : [];
      const custPage    = customersRes.status=== 'fulfilled' ? customersRes.value: {};

      if (rawBudgets.length === 0 && rawIncomes.length === 0) {
        console.log('[Holdprint] API retornou vazio — mantendo dados demo');
        this._syncing = false;
        return;
      }

      this._realApiOk = true;
      this._updateApiStatus(true);

      // ── Normalise budgets ──────────────────────────────────────────
      const budgets = rawBudgets.map(b => this._normalizeBudget(b));
      const won   = budgets.filter(b => b.budgetState === 3);
      const lost  = budgets.filter(b => b.budgetState === 4);
      const open  = budgets.filter(b => ![3,4].includes(b.budgetState));

      // ── Overwrite _M.opps with real budgets as opportunities ───────
      if (budgets.length > 0) {
        this._M.opps = budgets.map(b => this._budgetToOpp(b));
      }

      // ── Overwrite _M.revenue with real incomes ─────────────────────
      if (rawIncomes.length > 0) {
        const monthly = this._incomesToMonthly(rawIncomes);
        if (monthly.length > 0) this._M.revenue.monthly = monthly;

        // by_responsible from real jobs
        if (rawJobs.length > 0) {
          const byResp = {};
          for (const j of rawJobs) {
            const n = j.responsibleName || 'Outros';
            if (!byResp[n]) byResp[n] = { name:n, revenue:0, deals:0 };
            byResp[n].revenue += j.totalPrice || 0;
            byResp[n].deals++;
          }
          this._M.revenue.by_responsible = Object.values(byResp)
            .sort((a,b) => b.revenue - a.revenue).slice(0, 6);
        }
      }

      // ── Overwrite _M.pipeline with real stage distribution ─────────
      if (budgets.length > 0) {
        const byStage = {};
        for (const b of budgets) { byStage[b.stage] = (byStage[b.stage]||0) + 1; }
        const totalVal = open.reduce((s,b)=>s+b.value,0);
        const convRate = budgets.length > 0
          ? Math.round(won.length / (won.length + lost.length || 1) * 100) : 0;
        this._M.pipeline = { total_value: totalVal, conversion_rate: convRate, by_stage: byStage };
      }

      // ── Overwrite _M.forecast with real open budgets ───────────────
      if (open.length > 0) {
        const PROB = { prospecção:20, qualificação:40, proposta:62, negociação:75, fechamento:90 };
        const byStageArr = Object.entries(
          open.reduce((acc, b) => {
            if (!acc[b.stage]) acc[b.stage] = { stage:b.stage, value:0, probability: PROB[b.stage]||50 };
            acc[b.stage].value += b.value;
            return acc;
          }, {})
        ).map(([,v]) => ({ ...v, weighted: Math.round(v.value * v.probability / 100) }));

        const weighted = byStageArr.reduce((s,r)=>s+r.weighted, 0);
        const wonVal   = won.reduce((s,b)=>s+b.value,0);
        this._M.forecast = {
          meta: this._M.forecast.meta,
          weighted,
          optimistic: open.reduce((s,b)=>s+b.value,0),
          ganho: wonVal,
          by_stage: byStageArr
        };
      }

      // ── Overwrite _M.sellers with real job performance ─────────────
      if (rawJobs.length > 0) {
        const sellers = {};
        for (const j of rawJobs) {
          const n = j.responsibleName || 'Outros';
          if (!sellers[n]) sellers[n] = { name:n, open_deals:0, total_value:0, won:0, lost:0, activities:0, pipeline_trend:[0,0,0] };
          if (j.isFinalized) sellers[n].won++;
          else sellers[n].open_deals++;
          sellers[n].total_value += j.totalPrice || 0;
          sellers[n].activities++;
        }
        const arr = Object.values(sellers).map(s => ({
          ...s,
          conversion: s.won + s.lost > 0 ? Math.round(s.won/(s.won+s.lost)*100) : 0,
          avg_ticket: s.won > 0 ? Math.round(s.total_value/s.won) : 0,
          avg_days: 20,
          pipeline_trend: [s.total_value*.8, s.total_value*.9, s.total_value]
        }));
        if (arr.length > 0) this._M.sellers = arr.sort((a,b)=>b.total_value-a.total_value);
      }

      this._realData = {
        totalCustomers: custPage.totalCount || (custPage.data||[]).length,
        totalBudgets: budgets.length,
        wonBudgets: won, lostBudgets: lost, openBudgets: open,
        wonValue: won.reduce((s,b)=>s+b.value,0),
        openValue: open.reduce((s,b)=>s+b.value,0),
        conversionRate: budgets.length > 0 ? Math.round(won.length/budgets.length*100) : 0,
        totalIncomes: rawIncomes.reduce((s,i)=>s+(i.originalAmount||0),0),
        totalJobs: rawJobs.length
      };

      console.log(`[Holdprint] ✓ Sincronizado: ${budgets.length} orçamentos, ${rawIncomes.length} receitas, ${rawJobs.length} jobs`);

    } catch (e) {
      console.warn('[Holdprint] syncRealData falhou:', e.message);
    }
    this._syncing = false;
  },

  // Budget raw → CRM opportunity format
  _budgetToOpp(b) {
    const PROB = { prospecção:20, qualificação:40, proposta:62, negociação:75, fechamento:90, ganho:100, perdido:0 };
    const SOURCE_MAP = { 0:'outbound', 1:'inbound', 2:'indicacao', 3:'retorno', 4:'marketing' };
    return {
      id: b.id, title: b.title, company: b.company, contact: '',
      value: b.value, stage: b.stage, status: b.status, budgetState: b.budgetState,
      probability: PROB[b.stage] ?? 50,
      source: SOURCE_MAP[Math.floor(Math.random()*5)] || 'inbound',
      responsible: b.responsible || '',
      expected_close: b.won_date || '',
      created_at: b.created_at || '',
      last_activity: b.created_at || '',
      rejection_reason: b.budgetState === 4 ? 'Recusado pelo cliente' : undefined
    };
  },

  // Incomes raw → monthly revenue array for reports
  _incomesToMonthly(incomes) {
    const PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map = {};
    for (const inc of incomes) {
      const raw = inc.settlementDate || inc.dueDate;
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d)) continue;
      const key = `${PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      if (!map[key]) map[key] = { month:key, revenue:0, deals:0, meta:80000, _sort: d.getFullYear()*12+d.getMonth() };
      map[key].revenue += inc.originalAmount || 0;
      map[key].deals++;
    }
    return Object.values(map)
      .sort((a,b) => a._sort - b._sort)
      .slice(-6)
      .map(({ _sort, ...rest }) => rest);
  },

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
