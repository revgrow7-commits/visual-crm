// ===== JOBS MODULE =====
window.JobsModule = {

  JOB_STAGES: [
    'Revisão Comercial','Aprovação Financeira','Programação','Compras',
    'Arte Final','Impressão','Acabamento','Serralheria','Montagem',
    'Expedição','Instalação','Entrega','Faturamento','Finalizado'
  ],

  STAGE_COLORS: {
    'Revisão Comercial':'#f59e0b','Aprovação Financeira':'#f97316',
    'Programação':'#8b5cf6','Compras':'#06b6d4','Arte Final':'#ec4899',
    'Impressão':'#3b82f6','Acabamento':'#10b981','Serralheria':'#6366f1',
    'Montagem':'#14b8a6','Expedição':'#84cc16','Instalação':'#22c55e',
    'Entrega':'#0ea5e9','Faturamento':'#a855f7','Finalizado':'#6b7280'
  },

  _jobs: [],
  _filtered: [],
  _currentJob: null,
  _activeTab: 'geral',

  // ===== MOCK DATA =====
  MOCK: [
    {
      id:'J1475', title:'PROVA DE MATERIAL',
      company:'ASSAI ATACADISTA(SC)', responsible:'Valdir Oliveira SP',
      commercialResponsible:'Valdir Pires de Oliveira',
      stage:'Revisão Comercial', value:0.02, chargeStatus:'Não faturado', isFinalized:false,
      created_at:'2026-03-02T17:07:00Z', createdBy:'Valdir Oliveira SP',
      contact:'', deliveryNeed:'2026-03-02T17:07:00Z', estimatedDelivery:null, progress:0,
      paymentOption:'À Vista', paymentCondition:'À Vista', paymentMethod:'Dinheiro',
      notes:'', files:[],
      items:[{ number:1, productName:'Adesivo Branco Impresso',
        description:'IMPRESSÃO UV 4X0 EM ADESIVO IMPRIMAX VERMELHO TOMATE CORTE RETO',
        quantity:1, unit:'Unidades', copies:1, width:0.10, height:0.10,
        unitValue:0.02, subtotal:0.02, stageStatus:'Revisão Comercial', hoursPercent:0 }],
      financial:{ totalValue:0.02, openValue:0.02, billedValue:0, receivableSum:0, paidValue:0, paid:false }
    },
    {
      id:'J1421', title:'FACHADA ACM LOJA MATRIZ',
      company:'MODA FASHION SP', responsible:'Carlos Mendes',
      commercialResponsible:'Carlos Mendes',
      stage:'Arte Final', value:8500, chargeStatus:'Parcial', isFinalized:false,
      created_at:'2026-02-15T09:30:00Z', createdBy:'Carlos Mendes',
      contact:'Pedro Alves', deliveryNeed:'2026-03-20T18:00:00Z',
      estimatedDelivery:'2026-03-19', progress:35,
      paymentOption:'Parcelado', paymentCondition:'30/60 dias', paymentMethod:'Transferência',
      notes:'', files:[],
      items:[
        { number:1, productName:'Chapa PS com Impressão Direta',
          description:'IMPRESSÃO DIGITAL ALTA RESOLUÇÃO 4X0 — APROVAÇÃO CLIENTE PENDENTE',
          quantity:4, unit:'Unidades', copies:1, width:2.40, height:1.20,
          unitValue:1200, subtotal:4800, stageStatus:'Arte Final', hoursPercent:40 },
        { number:2, productName:'Serviços - Instalação',
          description:'INSTALAÇÃO DE FACHADA ACM COM ILUMINAÇÃO LED',
          quantity:1, unit:'Unidades', copies:1, width:0, height:0,
          unitValue:3700, subtotal:3700, stageStatus:'Programação', hoursPercent:0 }
      ],
      financial:{ totalValue:8500, openValue:5000, billedValue:3500, receivableSum:3500, paidValue:0, paid:false }
    },
    {
      id:'J1389', title:'PLOTAGEM FROTA VEICULAR 5 VEÍCs',
      company:'TRANSPORTES VELOZ', responsible:'Ana Lima',
      commercialResponsible:'Ana Lima',
      stage:'Impressão', value:6200, chargeStatus:'Não faturado', isFinalized:false,
      created_at:'2026-02-01T10:00:00Z', createdBy:'Ana Lima',
      contact:'Sandra Lima', deliveryNeed:'2026-03-25T17:00:00Z',
      estimatedDelivery:'2026-03-24', progress:55,
      paymentOption:'À Vista', paymentCondition:'À Vista', paymentMethod:'PIX',
      notes:'', files:[],
      items:[
        { number:1, productName:'Adesivo Branco Impresso',
          description:'PLOTAGEM VINIL ADESIVO 3M — FRENTE, LATERAL E TRASEIRA — 5 CAMINHÕES',
          quantity:5, unit:'Unidades', copies:1, width:6.0, height:2.2,
          unitValue:1240, subtotal:6200, stageStatus:'Impressão', hoursPercent:55 }
      ],
      financial:{ totalValue:6200, openValue:6200, billedValue:0, receivableSum:0, paidValue:0, paid:false }
    },
    {
      id:'J1350', title:'LETREIRO LUMINOSO FARMÁCIA',
      company:'FARMÁCIA SAÚDE TOTAL', responsible:'Roberto Santos',
      commercialResponsible:'Ana Lima',
      stage:'Acabamento', value:12000, chargeStatus:'Parcial', isFinalized:false,
      created_at:'2026-01-20T08:00:00Z', createdBy:'Roberto Santos',
      contact:'Dr. Marcus Rocha', deliveryNeed:'2026-03-22T16:00:00Z',
      estimatedDelivery:'2026-03-21', progress:72,
      paymentOption:'Parcelado', paymentCondition:'50%+50%', paymentMethod:'Boleto',
      notes:'', files:[],
      items:[
        { number:1, productName:'Letra Caixa plana em PVC Expandido',
          description:'LETREIRO LUMINOSO LED PERFIL CAIXA — LETRA "FARMÁCIA" EM PVC 15MM',
          quantity:8, unit:'Unidades', copies:1, width:0.80, height:0.60,
          unitValue:1000, subtotal:8000, stageStatus:'Acabamento', hoursPercent:80 },
        { number:2, productName:'Serviços - Instalação',
          description:'INSTALAÇÃO DE LETREIRO E FIAÇÃO ELÉTRICA',
          quantity:1, unit:'Unidades', copies:1, width:0, height:0,
          unitValue:4000, subtotal:4000, stageStatus:'Programação', hoursPercent:0 }
      ],
      financial:{ totalValue:12000, openValue:6000, billedValue:6000, receivableSum:6000, paidValue:6000, paid:false }
    },
    {
      id:'J1312', title:'BANNER OUTDOOR REDE DE LOJAS',
      company:'LOJAS GAÚCHAS S.A.', responsible:'Roberto Santos',
      commercialResponsible:'Roberto Santos',
      stage:'Faturamento', value:31000, chargeStatus:'Faturado', isFinalized:true,
      created_at:'2026-01-10T08:00:00Z', createdBy:'Roberto Santos',
      contact:'Diretora Maria Clara', deliveryNeed:'2026-03-01T17:00:00Z',
      estimatedDelivery:'2026-02-28', progress:100,
      paymentOption:'Parcelado', paymentCondition:'30/60/90 dias', paymentMethod:'Boleto',
      notes:'', files:[],
      items:[
        { number:1, productName:'Lona Front Light com Impressão Digital',
          description:'BANNER 6x4m IMPRESSÃO DIGITAL ALTA RESOLUÇÃO — CAMPANHA VERÃO 2026',
          quantity:12, unit:'Unidades', copies:1, width:6.0, height:4.0,
          unitValue:1800, subtotal:21600, stageStatus:'Finalizado', hoursPercent:100 },
        { number:2, productName:'Serviços - Instalação',
          description:'INSTALAÇÃO EM 12 PONTOS ESTRATÉGICOS — GRANDE FLORIANÓPOLIS',
          quantity:12, unit:'Unidades', copies:1, width:0, height:0,
          unitValue:783.33, subtotal:9400, stageStatus:'Finalizado', hoursPercent:100 }
      ],
      financial:{ totalValue:31000, openValue:0, billedValue:31000, receivableSum:31000, paidValue:20000, paid:false }
    },
    {
      id:'J1280', title:'SINALIZAÇÃO INTERNA — HOSPITAL',
      company:'HOSPITAL SÃO LUCAS POA', responsible:'Juliana Costa',
      commercialResponsible:'Juliana Costa',
      stage:'Serralheria', value:18000, chargeStatus:'Não faturado', isFinalized:false,
      created_at:'2026-01-05T08:00:00Z', createdBy:'Juliana Costa',
      contact:'Dra. Cristina Borges', deliveryNeed:'2026-04-10T17:00:00Z',
      estimatedDelivery:'2026-04-08', progress:60,
      paymentOption:'Parcelado', paymentCondition:'30/60 dias', paymentMethod:'Boleto',
      notes:'', files:[],
      items:[
        { number:1, productName:'Placa em ACM',
          description:'PLACAS INDICATIVAS CORTE RETO E FORMATO ESPECIAL — LAYOUT APROVADO',
          quantity:24, unit:'Unidades', copies:1, width:0.60, height:0.40,
          unitValue:500, subtotal:12000, stageStatus:'Serralheria', hoursPercent:65 },
        { number:2, productName:'Adesivo Branco Impresso',
          description:'ADESIVOS DE SINALIZAÇÃO — PISOS E PAREDES',
          quantity:80, unit:'Unidades', copies:1, width:0.30, height:0.30,
          unitValue:75, subtotal:6000, stageStatus:'Impressão', hoursPercent:100 }
      ],
      financial:{ totalValue:18000, openValue:18000, billedValue:0, receivableSum:0, paidValue:0, paid:false }
    }
  ],

  // ===== RENDER LIST =====
  async render(area) {
    area.innerHTML = `
      <div class="filter-bar">
        <input class="form-control search-input" id="searchJob" placeholder="Buscar por ID, cliente ou título..." oninput="JobsModule.filter()">
        <select class="form-control" id="filterJobStage" onchange="JobsModule.filter()">
          <option value="">Todas as etapas</option>
          ${this.JOB_STAGES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select class="form-control" id="filterJobStatus" onchange="JobsModule.filter()">
          <option value="">Todos</option>
          <option value="active">Em andamento</option>
          <option value="done">Finalizados</option>
        </select>
        <div id="jobSyncBanner" style="font-size:12px;color:var(--gray-400);white-space:nowrap">⟳ Carregando...</div>
      </div>
      <div id="jobsWrap">
        <div class="empty-state"><div class="empty-state-icon">🏭</div><div class="empty-state-text">Carregando jobs...</div></div>
      </div>`;

    try {
      const apiJobs = await HOLDPRINT.getJobs(1);
      this._jobs = apiJobs.length > 0 ? apiJobs : this.MOCK;
      const banner = document.getElementById('jobSyncBanner');
      if (banner) banner.innerHTML = apiJobs.length > 0
        ? `<span style="color:var(--success)">✓ ${apiJobs.length} jobs do Holdprint ERP</span>`
        : `<span style="color:var(--gray-400)">◌ Dados demo</span>`;
    } catch {
      this._jobs = this.MOCK;
      const banner = document.getElementById('jobSyncBanner');
      if (banner) banner.innerHTML = `<span style="color:var(--gray-400)">◌ Dados demo</span>`;
    }

    // Apply saved overrides from localStorage
    const overrides = JSON.parse(localStorage.getItem('job_overrides') || '{}');
    this._jobs = this._jobs.map(j => {
      const id = j.id || j.code;
      return overrides[id] ? {...j, ...overrides[id]} : j;
    });

    this._filtered = [...this._jobs];
    this._renderTable();
  },

  filter() {
    const q = (document.getElementById('searchJob')?.value || '').toLowerCase();
    const stage = document.getElementById('filterJobStage')?.value || '';
    const status = document.getElementById('filterJobStatus')?.value || '';
    this._filtered = this._jobs.filter(j => {
      const id = j.id || j.code || '';
      const matchQ = !q || id.toLowerCase().includes(q)
        || (j.company||j.customerName||'').toLowerCase().includes(q)
        || (j.title||'').toLowerCase().includes(q);
      const matchStage  = !stage || j.stage === stage;
      const matchStatus = !status
        || (status === 'done' ? j.isFinalized : !j.isFinalized);
      return matchQ && matchStage && matchStatus;
    });
    this._renderTable();
  },

  _renderTable() {
    const wrap = document.getElementById('jobsWrap');
    if (!wrap) return;
    if (this._filtered.length === 0) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏭</div><div class="empty-state-text">Nenhum job encontrado</div></div>`;
      return;
    }
    const totais = {
      valor: this._filtered.reduce((s,j)=>s+(j.value||j.totalPrice||0),0),
      ativos: this._filtered.filter(j=>!j.isFinalized).length,
      finalizados: this._filtered.filter(j=>j.isFinalized).length
    };
    wrap.innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
        <div class="kpi-card" style="cursor:default">
          <div class="kpi-icon" style="background:#dbeafe">🏭</div>
          <div class="kpi-label">Total de Jobs</div>
          <div class="kpi-value">${this._filtered.length}</div>
          <div class="kpi-sub">${totais.ativos} ativos · ${totais.finalizados} finalizados</div>
        </div>
        <div class="kpi-card" style="cursor:default">
          <div class="kpi-icon" style="background:var(--warning-light)">⚙️</div>
          <div class="kpi-label">Em Produção</div>
          <div class="kpi-value" style="color:var(--warning)">${totais.ativos}</div>
          <div class="kpi-sub">jobs em andamento</div>
        </div>
        <div class="kpi-card" style="cursor:default">
          <div class="kpi-icon" style="background:var(--success-light)">✅</div>
          <div class="kpi-label">Finalizados</div>
          <div class="kpi-value" style="color:var(--success)">${totais.finalizados}</div>
          <div class="kpi-sub">jobs concluídos</div>
        </div>
        <div class="kpi-card" style="cursor:default">
          <div class="kpi-icon" style="background:var(--violet-light)">💰</div>
          <div class="kpi-label">Volume Total</div>
          <div class="kpi-value" style="font-size:16px;color:var(--violet)">${fmt.money(totais.valor)}</div>
          <div class="kpi-sub">em jobs filtrados</div>
        </div>
      </div>
      <div class="card">
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Job</th><th>Cliente</th><th>Título</th><th>Etapa</th>
                  <th>Responsável</th><th>Valor</th><th>Progresso</th>
                  <th>Status</th><th>Criação</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${this._filtered.map(j => {
                  const id = j.id || j.code;
                  const col = this.STAGE_COLORS[j.stage] || '#6b7280';
                  const prog = j.progress || 0;
                  return `
                    <tr>
                      <td><strong style="color:var(--primary);cursor:pointer" onclick="JobsModule.showDetail('${id}')">${id}</strong></td>
                      <td>${j.company||j.customerName||'-'}</td>
                      <td style="max-width:180px;font-size:12px">${j.title||'-'}</td>
                      <td><span class="job-stage-badge" style="background:${col}1a;color:${col};border:1px solid ${col}40">${j.stage||'-'}</span></td>
                      <td style="font-size:12px">${j.responsible||j.responsibleName||'-'}</td>
                      <td><strong>${fmt.money(j.value||j.totalPrice||0)}</strong></td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;min-width:90px">
                          <div style="flex:1;background:var(--gray-100);border-radius:99px;height:6px">
                            <div style="width:${prog}%;background:${prog>=100?'var(--success)':prog>=50?'var(--primary)':'var(--warning)'};height:6px;border-radius:99px"></div>
                          </div>
                          <span style="font-size:11px;color:var(--gray-500)">${prog}%</span>
                        </div>
                      </td>
                      <td><span class="badge badge-${j.isFinalized?'fechado':'novo'}">${j.isFinalized?'Finalizado':'Em andamento'}</span></td>
                      <td style="font-size:12px">${fmt.date(j.created_at||j.creationTime||'')}</td>
                      <td>
                        <button class="btn btn-sm btn-primary" onclick="JobsModule.showDetail('${id}')" style="white-space:nowrap">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          Detalhes
                        </button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  // ===== DETAIL MODAL =====
  showDetail(jobId) {
    const job = this._jobs.find(j => (j.id||j.code) === jobId);
    if (!job) return;
    this._currentJob = job;
    this._activeTab = 'geral';
    // Load persisted notes and files
    const savedNotes = localStorage.getItem('job_notes_' + jobId);
    if (savedNotes !== null) job.notes = savedNotes;
    job.files = JSON.parse(localStorage.getItem('job_files_' + jobId) || '[]');
    this._openPanel(job);
  },

  _openPanel(job) {
    document.getElementById('jobDetailOverlay')?.remove();
    const col = this.STAGE_COLORS[job.stage] || '#6b7280';
    const prog = job.progress || 0;
    const el = document.createElement('div');
    el.id = 'jobDetailOverlay';
    el.className = 'job-detail-overlay';
    el.innerHTML = `
      <div class="job-detail-panel" id="jobDetailPanel">
        <div class="job-detail-header">
          <div class="job-detail-header-left">
            <div class="job-detail-id">
              <span style="font-size:20px;font-weight:800;color:var(--gray-900)">${job.id||job.code}</span>
              <span style="color:var(--gray-300);margin:0 10px">|</span>
              <span class="job-stage-badge" style="background:${col}1a;color:${col};border:1px solid ${col}40;font-size:12px">${job.stage}</span>
            </div>
            <div style="font-size:13px;color:var(--gray-500);margin-top:4px">
              ${job.company||job.customerName||''}
              <span style="margin:0 6px">·</span>
              ${fmt.money(job.value||job.totalPrice||0)}
              ${prog > 0 ? `<span style="margin:0 6px">·</span><span style="color:${prog>=100?'var(--success)':prog>=50?'var(--primary)':'var(--warning)'}">${prog}% concluído</span>` : ''}
            </div>
          </div>
          <div class="job-detail-header-right">
            <button class="btn btn-secondary btn-sm" onclick="JobsModule.printJob('${job.id||job.code}')">🖨️ Imprimir</button>
            <button class="btn btn-primary btn-sm" onclick="JobsModule.generateFinancial('${job.id||job.code}')">💰 Financeiro</button>
            <button class="job-detail-close" onclick="JobsModule.closeDetail()">×</button>
          </div>
        </div>
        <div class="job-tabs">
          ${[['geral','Informações Gerais'],['producao','Produção'],['faturamento','Faturamento'],['estatisticas','Estatísticas'],['acompanhamento','Acompanhamento']].map(([id,label]) =>
            `<button class="job-tab ${id==='geral'?'active':''}" id="tab-btn-${id}" onclick="JobsModule.switchTab('${id}')">${label}</button>`
          ).join('')}
        </div>
        <div class="job-tab-content" id="jobTabContent">
          ${this._tabGeral(job)}
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) this.closeDetail(); });
    document.body.style.overflow = 'hidden';
  },

  closeDetail() {
    document.getElementById('jobDetailOverlay')?.remove();
    document.body.style.overflow = '';
  },

  switchTab(tabId) {
    this._activeTab = tabId;
    document.querySelectorAll('.job-tab').forEach(b => b.classList.toggle('active', b.id === 'tab-btn-' + tabId));
    const content = document.getElementById('jobTabContent');
    if (!content || !this._currentJob) return;
    const map = {
      geral:         () => this._tabGeral(this._currentJob),
      producao:      () => this._tabProducao(this._currentJob),
      faturamento:   () => this._tabFaturamento(this._currentJob),
      estatisticas:  () => this._tabEstatisticas(this._currentJob),
      acompanhamento:() => this._tabAcompanhamento(this._currentJob)
    };
    content.innerHTML = map[tabId] ? map[tabId]() : '';
  },

  // ===== TAB: GERAL =====
  _tabGeral(job) {
    const col = this.STAGE_COLORS[job.stage] || '#6b7280';
    const prog = job.progress || 0;
    return `
      <div class="job-geral-grid">
        <div class="job-section">
          <div class="job-section-title">Informações do Job</div>
          <div class="detail-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="detail-item"><div class="detail-label">ID do Job</div><div class="detail-value"><strong>${job.id||job.code}</strong></div></div>
            <div class="detail-item"><div class="detail-label">Etapa Atual</div><div class="detail-value"><span class="job-stage-badge" style="background:${col}1a;color:${col};border:1px solid ${col}40">${job.stage||'-'}</span></div></div>
            <div class="detail-item"><div class="detail-label">Valor Total</div><div class="detail-value"><strong style="color:var(--success);font-size:15px">${fmt.money(job.value||job.totalPrice||0)}</strong></div></div>
            <div class="detail-item"><div class="detail-label">Cliente</div><div class="detail-value">${job.company||job.customerName||'-'}</div></div>
            <div class="detail-item"><div class="detail-label">Status Faturamento</div><div class="detail-value"><span class="badge badge-${job.chargeStatus==='Faturado'?'fechado':job.chargeStatus==='Parcial'?'proposta':'pendente'}">${job.chargeStatus||'Não faturado'}</span></div></div>
            <div class="detail-item"><div class="detail-label">Finalizado</div><div class="detail-value"><span class="badge badge-${job.isFinalized?'fechado':'novo'}">${job.isFinalized?'Sim':'Não'}</span></div></div>
            <div class="detail-item"><div class="detail-label">Data de Criação</div><div class="detail-value">${fmt.datetime(job.created_at||job.creationTime||'')}${job.createdBy?`<br><span style="font-size:11px;color:var(--gray-400)">por ${job.createdBy}</span>`:''}</div></div>
            <div class="detail-item"><div class="detail-label">Necessidade de Entrega</div><div class="detail-value">${fmt.datetime(job.deliveryNeed||'')}</div></div>
            <div class="detail-item"><div class="detail-label">Entrega Prevista</div><div class="detail-value">${job.estimatedDelivery?fmt.date(job.estimatedDelivery):'<span style="color:var(--gray-400)">Não calculado</span>'}</div></div>
            <div class="detail-item"><div class="detail-label">Responsável</div><div class="detail-value">${job.responsible||job.responsibleName||'-'}</div></div>
            <div class="detail-item"><div class="detail-label">Responsável Comercial</div><div class="detail-value">${job.commercialResponsible||'-'}</div></div>
            <div class="detail-item"><div class="detail-label">Contato</div><div class="detail-value">
              <input class="form-control" style="font-size:13px" value="${job.contact||''}" placeholder="Adicionar contato..."
                onblur="JobsModule.saveField('${job.id||job.code}','contact',this.value)">
            </div></div>
          </div>
          <div style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:12px;font-weight:600;color:var(--gray-600)">Progresso Geral</span>
              <span style="font-size:12px;font-weight:700;color:var(--primary)">${prog}%</span>
            </div>
            <div style="background:var(--gray-100);border-radius:99px;height:10px">
              <div style="width:${prog}%;background:linear-gradient(90deg,var(--primary),var(--violet));height:10px;border-radius:99px;transition:width .5s"></div>
            </div>
          </div>
        </div>

        <div class="job-section">
          <div class="job-section-title">Itens do Job</div>
          ${this._renderItems(job)}
        </div>

        <div class="job-section">
          <div class="job-section-title">Condições de Pagamento</div>
          <div class="detail-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="form-group"><label class="form-label">Opção de Pagamento</label>
              <select class="form-control" onchange="JobsModule.saveField('${job.id||job.code}','paymentOption',this.value)">
                ${['À Vista','Parcelado','30 dias','30/60 dias','30/60/90 dias'].map(o=>`<option ${job.paymentOption===o?'selected':''}>${o}</option>`).join('')}
              </select></div>
            <div class="form-group"><label class="form-label">Condição de Pagamento</label>
              <select class="form-control" onchange="JobsModule.saveField('${job.id||job.code}','paymentCondition',this.value)">
                ${['À Vista','30 dias','30/60 dias','50%+50%','30/60/90 dias'].map(o=>`<option ${job.paymentCondition===o?'selected':''}>${o}</option>`).join('')}
              </select></div>
            <div class="form-group"><label class="form-label">Forma de Pagamento</label>
              <select class="form-control" onchange="JobsModule.saveField('${job.id||job.code}','paymentMethod',this.value)">
                ${['Dinheiro','PIX','Boleto','Cartão de Crédito','Transferência'].map(o=>`<option ${job.paymentMethod===o?'selected':''}>${o}</option>`).join('')}
              </select></div>
            <div class="form-group"><label class="form-label">Comissões</label><input class="form-control" disabled placeholder="Em breve"></div>
            <div class="form-group"><label class="form-label">Detalhes Especiais</label><input class="form-control" disabled placeholder="Em breve"></div>
            <div class="form-group"><label class="form-label">Seguidores</label><input class="form-control" disabled placeholder="Em breve"></div>
          </div>
        </div>

        <div class="job-section">
          <div class="job-section-title">Anotações</div>
          ${this._renderRTE(job)}
        </div>

        <div class="job-section">
          <div class="job-section-title">Arquivos / Anexos</div>
          ${this._renderDropzone(job)}
        </div>

        <div class="job-section">
          <div class="job-section-title">Resumo Financeiro</div>
          ${this._renderFinancial(job)}
        </div>

        <div class="job-section">
          <div class="job-section-title">Ações</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="JobsModule.generateFinancial('${job.id||job.code}')">💰 Gerar Financeiro</button>
            <button class="btn btn-secondary" onclick="JobsModule.generateAdvance('${job.id||job.code}')">💳 Gerar Adiantamento</button>
            <button class="btn btn-secondary" onclick="JobsModule.viewOrcamento('${job.id||job.code}')">📋 Visualizar Orçamento</button>
            <button class="btn btn-secondary" onclick="JobsModule.printJob('${job.id||job.code}')">🖨️ Imprimir Pedido</button>
            <button class="btn btn-secondary" onclick="JobsModule.techSheet('${job.id||job.code}')">📄 Ficha Técnica</button>
          </div>
        </div>
      </div>`;
  },

  // ===== TAB: PRODUÇÃO =====
  _tabProducao(job) {
    const stageIdx = this.JOB_STAGES.indexOf(job.stage);
    return `
      <div class="job-section">
        <div class="job-section-title">Fluxo de Produção — 14 Etapas</div>
        <div class="job-flow">
          ${this.JOB_STAGES.map((stage, i) => {
            const done = i < stageIdx;
            const current = i === stageIdx;
            const col = this.STAGE_COLORS[stage] || '#6b7280';
            return `
              <div class="job-flow-step ${done?'flow-done':''} ${current?'flow-current':''}">
                <div class="job-flow-dot" style="${current?`background:${col};box-shadow:0 0 0 5px ${col}25`:done?'background:var(--success)':'background:var(--gray-200)'}">
                  ${done ? '✓' : i+1}
                </div>
                <div class="job-flow-label" style="${current?`color:${col};font-weight:700`:''}">
                  ${stage}
                </div>
              </div>
              ${i < this.JOB_STAGES.length-1 ? `<div class="job-flow-connector ${done?'flow-done':''}"></div>` : ''}`;
          }).join('')}
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="JobsModule.advanceStage('${job.id||job.code}')">▶ Avançar Produção</button>
          <button class="btn btn-secondary" onclick="JobsModule.regressStage('${job.id||job.code}')">◀ Retroceder</button>
          <button class="btn btn-secondary" onclick="JobsModule.launchSchedule('${job.id||job.code}')">📅 Lançar Previsto/Realizado</button>
          <button class="btn btn-secondary" onclick="JobsModule.changeFlow('${job.id||job.code}')">🔀 Alterar Fluxo</button>
        </div>
      </div>
      <div class="job-section">
        <div class="job-section-title">Itens em Produção</div>
        ${this._renderItems(job)}
      </div>`;
  },

  // ===== TAB: FATURAMENTO =====
  _tabFaturamento(job) {
    return `
      <div class="job-section">
        <div class="job-section-title">Resumo Financeiro</div>
        ${this._renderFinancial(job)}
      </div>
      <div class="job-section">
        <div class="job-section-title">Condições</div>
        <div class="detail-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="detail-item"><div class="detail-label">Opção de Pagamento</div><div class="detail-value">${job.paymentOption||'-'}</div></div>
          <div class="detail-item"><div class="detail-label">Condição</div><div class="detail-value">${job.paymentCondition||'-'}</div></div>
          <div class="detail-item"><div class="detail-label">Forma</div><div class="detail-value">${job.paymentMethod||'-'}</div></div>
        </div>
      </div>
      <div class="job-section">
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="JobsModule.generateFinancial('${job.id||job.code}')">💰 Gerar Financeiro</button>
          <button class="btn btn-secondary" onclick="JobsModule.generateAdvance('${job.id||job.code}')">💳 Gerar Adiantamento</button>
        </div>
      </div>`;
  },

  // ===== TAB: ESTATÍSTICAS =====
  _tabEstatisticas(job) {
    const stageIdx = this.JOB_STAGES.indexOf(job.stage);
    const daysTotal = job.created_at
      ? Math.floor((Date.now() - new Date(job.created_at||job.creationTime).getTime()) / 86400000)
      : 0;
    const fin = job.financial || {};
    const total = fin.totalValue ?? job.value ?? 0;
    return `
      <div class="job-section">
        <div class="job-section-title">KPIs do Job</div>
        <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
          <div class="kpi-card" style="cursor:default">
            <div class="kpi-label">Progresso</div>
            <div class="kpi-value" style="color:var(--primary)">${job.progress||0}%</div>
            <div class="kpi-sub">etapa ${stageIdx+1} de ${this.JOB_STAGES.length}</div>
          </div>
          <div class="kpi-card" style="cursor:default">
            <div class="kpi-label">Dias no Sistema</div>
            <div class="kpi-value">${daysTotal}</div>
            <div class="kpi-sub">desde a criação</div>
          </div>
          <div class="kpi-card" style="cursor:default">
            <div class="kpi-label">Valor Total</div>
            <div class="kpi-value" style="font-size:15px;color:var(--success)">${fmt.money(total)}</div>
            <div class="kpi-sub">bruto do job</div>
          </div>
          <div class="kpi-card" style="cursor:default">
            <div class="kpi-label">Em Aberto</div>
            <div class="kpi-value" style="font-size:15px;color:var(--warning)">${fmt.money(fin.openValue??total)}</div>
            <div class="kpi-sub">a receber</div>
          </div>
        </div>
      </div>
      <div class="job-section">
        <div class="job-section-title">Progresso por Etapa</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
          ${this.JOB_STAGES.map((stage, i) => {
            const pct = i < stageIdx ? 100 : i === stageIdx ? (job.progress||0) : 0;
            const col = this.STAGE_COLORS[stage] || '#6b7280';
            return `
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:155px;font-size:11px;color:var(--gray-600);text-align:right">${stage}</div>
                <div style="flex:1;background:var(--gray-100);border-radius:99px;height:7px">
                  <div style="width:${pct}%;background:${col};height:7px;border-radius:99px;transition:width .5s"></div>
                </div>
                <div style="width:34px;font-size:11px;font-weight:600;color:var(--gray-500)">${pct}%</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  },

  // ===== TAB: ACOMPANHAMENTO =====
  _tabAcompanhamento(job) {
    const jobId = job.id||job.code;
    const history = JSON.parse(localStorage.getItem('job_history_' + jobId) || '[]');
    return `
      <div class="job-section">
        <div class="job-section-title">Registrar Acompanhamento</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="trackText" class="form-control" style="flex:1;min-width:200px" placeholder="Descreva a atualização, decisão ou interação...">
          <select id="trackType" class="form-control" style="width:160px">
            <option value="update">📝 Atualização</option>
            <option value="call">📞 Ligação</option>
            <option value="meeting">👥 Reunião</option>
            <option value="email">📧 E-mail</option>
            <option value="production">🏭 Produção</option>
            <option value="delivery">📦 Entrega</option>
          </select>
          <button class="btn btn-primary" onclick="JobsModule.addTracking('${jobId}')">Salvar</button>
        </div>
      </div>
      <div class="job-section">
        <div class="job-section-title">Histórico (${history.length} registro${history.length!==1?'s':''})</div>
        ${history.length === 0
          ? `<div class="empty-state" style="padding:30px"><div class="empty-state-text">Nenhum acompanhamento registrado</div></div>`
          : `<div class="timeline" style="max-height:450px;overflow-y:auto;padding-right:4px">
              ${[...history].reverse().map(h => {
                const icons = {update:'📝',call:'📞',meeting:'👥',email:'📧',production:'🏭',delivery:'📦'};
                return `<div class="timeline-item">
                  <div class="timeline-time">${icons[h.type]||'📝'} ${fmt.datetime(h.date)} · <strong>${h.user||'Usuário'}</strong></div>
                  <div class="timeline-text">${h.text}</div>
                </div>`;
              }).join('')}
            </div>`}
      </div>`;
  },

  // ===== ITEMS TABLE =====
  _renderItems(job) {
    const items = job.items || [];
    if (!items.length) return `<div style="color:var(--gray-400);font-size:13px;padding:12px">Nenhum item cadastrado</div>`;
    const totalItems = items.reduce((s,it)=>s+(it.subtotal||0),0);
    return `
      <div class="table-wrapper" style="overflow-x:auto">
        <table style="min-width:950px;font-size:12px">
          <thead>
            <tr>
              <th style="width:36px;text-align:center">Nº</th>
              <th>Produto/Serviço</th>
              <th>Descrição</th>
              <th style="width:62px;text-align:center">Quant.</th>
              <th style="width:72px;text-align:center">Unid.</th>
              <th style="width:54px;text-align:center">Cóp.</th>
              <th style="width:96px;text-align:right">Valor Unit.</th>
              <th style="width:96px;text-align:right">Subtotal</th>
              <th style="width:96px;text-align:center">Medidas (m)</th>
              <th style="width:130px">Etapa</th>
              <th style="width:80px;text-align:center">% Horas</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => {
              const col = this.STAGE_COLORS[it.stageStatus] || '#6b7280';
              return `
                <tr>
                  <td style="text-align:center;font-weight:700">${it.number}</td>
                  <td><strong style="font-size:12px">${it.productName||'-'}</strong></td>
                  <td style="color:var(--gray-500);max-width:180px;font-size:11px">${it.description||'-'}</td>
                  <td style="text-align:center">${it.quantity||'-'}</td>
                  <td style="text-align:center">${it.unit||'-'}</td>
                  <td style="text-align:center">${it.copies||1}</td>
                  <td style="text-align:right">${fmt.money(it.unitValue||0)}</td>
                  <td style="text-align:right"><strong>${fmt.money(it.subtotal||0)}</strong></td>
                  <td style="text-align:center;color:var(--gray-500)">${it.width>0||it.height>0?`${it.width}×${it.height}`:'-'}</td>
                  <td><span class="job-stage-badge" style="background:${col}1a;color:${col};border:1px solid ${col}40;font-size:10px">${it.stageStatus||'-'}</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:4px">
                      <div style="flex:1;background:var(--gray-100);border-radius:99px;height:5px">
                        <div style="width:${it.hoursPercent||0}%;background:var(--primary);height:5px;border-radius:99px"></div>
                      </div>
                      <span style="font-size:10px;color:var(--gray-500)">${it.hoursPercent||0}%</span>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background:var(--gray-50)">
              <td colspan="7" style="text-align:right;font-weight:700;padding:10px 8px">Total dos Itens:</td>
              <td style="text-align:right;font-weight:800;color:var(--success);padding:10px 8px">${fmt.money(totalItems)}</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  },

  // ===== RICH TEXT EDITOR =====
  _renderRTE(job) {
    return `
      <div class="rte-wrapper">
        <div class="rte-toolbar">
          <button type="button" class="rte-btn" onclick="JobsModule.rte('bold')" title="Negrito (Ctrl+B)"><b>B</b></button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('italic')" title="Itálico (Ctrl+I)"><i>I</i></button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('underline')" title="Sublinhado (Ctrl+U)"><u>U</u></button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('strikeThrough')" title="Tachado"><s>S</s></button>
          <span class="rte-sep"></span>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('justifyLeft')" title="Esquerda">⬅</button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('justifyCenter')" title="Centro">☰</button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('justifyRight')" title="Direita">➡</button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('justifyFull')" title="Justificar">≡</button>
          <span class="rte-sep"></span>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('insertUnorderedList')" title="Lista com marcador">•≡</button>
          <button type="button" class="rte-btn" onclick="JobsModule.rte('insertOrderedList')" title="Lista numerada">1≡</button>
          <span class="rte-sep"></span>
          <select class="rte-select" title="Tamanho da fonte" onchange="JobsModule.rte('fontSize',this.value);this.value=''">
            <option value="">Tamanho</option>
            ${[1,2,3,4,5,6].map((s,i)=>`<option value="${s}">${['8','10','12','14','18','24'][i]}px</option>`).join('')}
          </select>
          <span class="rte-sep"></span>
          <button type="button" class="rte-btn" onclick="JobsModule.rteLink()" title="Inserir link">🔗</button>
          <button type="button" class="rte-btn" style="background:var(--primary);color:#fff;padding:4px 12px;border-radius:6px;margin-left:auto;width:auto"
            onclick="JobsModule.saveNote('${job.id||job.code}')">💾 Salvar</button>
        </div>
        <div id="rteEditor" class="rte-editor" contenteditable="true">${job.notes || '<span style="color:var(--gray-300)">Clique aqui para adicionar anotações...</span>'}</div>
      </div>`;
  },

  rte(cmd, val) {
    document.getElementById('rteEditor')?.focus();
    document.execCommand(cmd, false, val || null);
  },

  rteLink() {
    const url = prompt('URL do link (ex: https://exemplo.com):');
    if (url) { document.getElementById('rteEditor')?.focus(); document.execCommand('createLink', false, url); }
  },

  saveNote(jobId) {
    const ed = document.getElementById('rteEditor');
    if (!ed) return;
    const content = ed.innerHTML;
    localStorage.setItem('job_notes_' + jobId, content);
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (job) job.notes = content;
    showToast('Anotação salva!', 'success');
  },

  // ===== DROPZONE =====
  _renderDropzone(job) {
    const jobId = job.id||job.code;
    const files = job.files || [];
    return `
      <div class="job-dropzone" id="dropzone-${jobId}"
        ondrop="JobsModule.handleDrop(event,'${jobId}')"
        ondragover="JobsModule.handleDragOver(event)"
        ondragleave="this.classList.remove('drag-over')"
        onclick="document.getElementById('fileInput-${jobId}').click()">
        <div style="font-size:30px;margin-bottom:8px">📁</div>
        <div style="font-size:14px;font-weight:600;color:var(--gray-600)">Arraste os arquivos ou clique aqui</div>
        <div style="font-size:12px;color:var(--gray-400);margin-top:4px">Máximo 15MB por arquivo</div>
        <input type="file" id="fileInput-${jobId}" multiple style="display:none"
          onchange="JobsModule.handleFileSelect(event,'${jobId}')">
      </div>
      <div id="fileList-${jobId}" style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${files.map(f=>this._fileItem(f,jobId)).join('')}
      </div>`;
  },

  _fileItem(f, jobId) {
    const icons = {pdf:'📄',doc:'📝',docx:'📝',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',xls:'📊',xlsx:'📊',zip:'🗜️',rar:'🗜️'};
    const ext = (f.name||'').split('.').pop().toLowerCase();
    const sz = f.size < 1048576 ? (f.size/1024).toFixed(1)+' KB' : (f.size/1048576).toFixed(1)+' MB';
    return `
      <div class="job-file-item" id="file-${f.id}">
        <span style="font-size:18px">${icons[ext]||'📎'}</span>
        <span style="flex:1;font-size:13px;font-weight:500;word-break:break-all">${f.name}</span>
        <span style="font-size:11px;color:var(--gray-400);white-space:nowrap">${sz}</span>
        <button class="btn btn-sm btn-danger" style="padding:2px 8px" onclick="JobsModule.removeFile('${jobId}','${f.id}')">×</button>
      </div>`;
  },

  handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); },
  handleDrop(e, jobId) { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); this._addFiles(Array.from(e.dataTransfer.files), jobId); },
  handleFileSelect(e, jobId) { this._addFiles(Array.from(e.target.files), jobId); e.target.value = ''; },

  _addFiles(fileList, jobId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    const MAX = 15 * 1024 * 1024;
    let added = 0;
    for (const f of fileList) {
      if (f.size > MAX) { showToast(`${f.name} excede 15MB`, 'error'); continue; }
      if (!job.files) job.files = [];
      job.files.push({ id: Date.now()+Math.random(), name:f.name, size:f.size, date:new Date().toISOString() });
      added++;
    }
    if (added > 0) {
      localStorage.setItem('job_files_' + jobId, JSON.stringify(job.files));
      const list = document.getElementById('fileList-' + jobId);
      if (list) list.innerHTML = job.files.map(f=>this._fileItem(f,jobId)).join('');
      showToast(`${added} arquivo(s) adicionado(s)`, 'success');
    }
  },

  removeFile(jobId, fileId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    job.files = (job.files||[]).filter(f=>String(f.id)!==String(fileId));
    localStorage.setItem('job_files_' + jobId, JSON.stringify(job.files));
    document.getElementById('file-'+fileId)?.remove();
    showToast('Arquivo removido', 'warning');
  },

  // ===== FINANCIAL SUMMARY =====
  _renderFinancial(job) {
    const fin = job.financial || {};
    const total = fin.totalValue ?? job.value ?? 0;
    const open  = fin.openValue  ?? total;
    const billed = fin.billedValue ?? 0;
    const receivable = fin.receivableSum ?? 0;
    const paid = fin.paidValue ?? 0;
    const statusLabel = billed >= total && total > 0 ? 'Faturado' : billed > 0 ? 'Parcial' : 'Não faturado';
    const statusBadge = billed >= total && total > 0 ? 'fechado' : billed > 0 ? 'proposta' : 'pendente';
    return `
      <div class="job-fin-summary">
        <div class="job-fin-row job-fin-total"><span>Valor Total</span><span>${fmt.money(total)}</span></div>
        <div class="job-fin-row"><span>Opção de Pagamento</span><span>${job.paymentOption||'À Vista'}</span></div>
        <div class="job-fin-row" style="color:var(--warning)"><span>Valor em Aberto</span><span><strong>${fmt.money(open)}</strong></span></div>
        <div class="job-fin-row"><span>Status</span><span><span class="badge badge-${statusBadge}">${statusLabel}</span></span></div>
        <div class="job-fin-row"><span>Valor Faturado</span><span>${fmt.money(billed)}</span></div>
        <div class="job-fin-row"><span>Soma das C/Receber</span><span>${fmt.money(receivable)}</span></div>
        <div class="job-fin-row" style="color:var(--success)"><span>Valor Pago</span><span><strong>${fmt.money(paid)}</strong></span></div>
        <div class="job-fin-row"><span>Pago</span><span><span class="badge badge-${fin.paid?'fechado':'pendente'}">${fin.paid?'Sim':'Não'}</span></span></div>
      </div>`;
  },

  // ===== ACTIONS =====
  saveField(jobId, field, value) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (job) job[field] = value;
    const overrides = JSON.parse(localStorage.getItem('job_overrides') || '{}');
    if (!overrides[jobId]) overrides[jobId] = {};
    overrides[jobId][field] = value;
    localStorage.setItem('job_overrides', JSON.stringify(overrides));
  },

  addTracking(jobId) {
    const text = document.getElementById('trackText')?.value?.trim();
    const type = document.getElementById('trackType')?.value || 'update';
    if (!text) { showToast('Descrição obrigatória', 'error'); return; }
    this._addTrackingEntry(jobId, text, type);
    showToast('Acompanhamento salvo!', 'success');
    this.switchTab('acompanhamento');
  },

  _addTrackingEntry(jobId, text, type = 'update') {
    const history = JSON.parse(localStorage.getItem('job_history_' + jobId) || '[]');
    history.push({ text, type, date: new Date().toISOString(), user: (typeof Auth !== 'undefined' ? Auth.getUser()?.name : null) || 'Usuário' });
    localStorage.setItem('job_history_' + jobId, JSON.stringify(history));
  },

  advanceStage(jobId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    const idx = this.JOB_STAGES.indexOf(job.stage);
    if (idx < this.JOB_STAGES.length - 1) {
      job.stage = this.JOB_STAGES[idx+1];
      job.progress = Math.round(((idx+1)/(this.JOB_STAGES.length-1))*100);
      this.saveField(jobId, 'stage', job.stage);
      this.saveField(jobId, 'progress', job.progress);
      this._addTrackingEntry(jobId, `Avançou para etapa: ${job.stage}`, 'production');
      showToast(`Avançou para: ${job.stage}`, 'success');
      if (this._currentJob && (this._currentJob.id||this._currentJob.code) === jobId) {
        this._currentJob = job;
        this.switchTab('producao');
      }
    } else {
      showToast('Job já está na etapa final', 'warning');
    }
  },

  regressStage(jobId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    const idx = this.JOB_STAGES.indexOf(job.stage);
    if (idx > 0) {
      job.stage = this.JOB_STAGES[idx-1];
      job.progress = Math.round(((idx-1)/(this.JOB_STAGES.length-1))*100);
      this.saveField(jobId, 'stage', job.stage);
      this.saveField(jobId, 'progress', job.progress);
      this._addTrackingEntry(jobId, `Retrocedeu para etapa: ${job.stage}`, 'production');
      showToast(`Retrocedeu para: ${job.stage}`, 'warning');
      if (this._currentJob && (this._currentJob.id||this._currentJob.code) === jobId) {
        this._currentJob = job;
        this.switchTab('producao');
      }
    } else {
      showToast('Job já está na primeira etapa', 'warning');
    }
  },

  launchSchedule(jobId) {
    const today = new Date().toISOString().slice(0,10);
    openModal('Lançar Previsto / Realizado', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data Prevista</label><input type="date" id="schedPrev" class="form-control" value="${today}"></div>
        <div class="form-group"><label class="form-label">Data Realizada</label><input type="date" id="schedReal" class="form-control"></div>
      </div>
      <div class="form-group"><label class="form-label">Observação</label><textarea id="schedObs" class="form-control" placeholder="Detalhes do agendamento..."></textarea></div>`,
      () => {
        const prev = document.getElementById('schedPrev')?.value;
        const real = document.getElementById('schedReal')?.value;
        const obs  = document.getElementById('schedObs')?.value;
        this._addTrackingEntry(jobId, `Previsto: ${fmt.date(prev)||'–'} | Realizado: ${real?fmt.date(real):'Pendente'}${obs?' | '+obs:''}`, 'production');
        closeModal();
        showToast('Agendamento lançado!', 'success');
        if (this._activeTab === 'acompanhamento') this.switchTab('acompanhamento');
      });
  },

  changeFlow(jobId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    const opts = this.JOB_STAGES.map((s,i)=>`<option value="${s}" ${job.stage===s?'selected':''}>${i+1}. ${s}</option>`).join('');
    openModal('Alterar Etapa do Fluxo', `
      <div class="form-group"><label class="form-label">Mover para a etapa:</label>
        <select id="newStage" class="form-control">${opts}</select>
      </div>
      <div class="form-group"><label class="form-label">Motivo</label>
        <textarea id="changeReason" class="form-control" placeholder="Justifique a alteração do fluxo..."></textarea>
      </div>`,
      () => {
        const newStage = document.getElementById('newStage')?.value;
        const reason   = document.getElementById('changeReason')?.value || '';
        const newIdx   = this.JOB_STAGES.indexOf(newStage);
        job.stage = newStage;
        job.progress = Math.round((newIdx/(this.JOB_STAGES.length-1))*100);
        this.saveField(jobId, 'stage', newStage);
        this.saveField(jobId, 'progress', job.progress);
        this._addTrackingEntry(jobId, `Fluxo alterado para: ${newStage}${reason?' — '+reason:''}`, 'production');
        closeModal();
        showToast(`Etapa alterada para: ${newStage}`, 'success');
        if (this._currentJob && (this._currentJob.id||this._currentJob.code) === jobId) {
          this._currentJob = job;
          this.switchTab('producao');
        }
      });
  },

  generateFinancial(jobId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    openModal('Gerar Financeiro', `
      <div class="form-group" style="background:var(--success-light);border-radius:8px;padding:10px;color:var(--success);font-weight:600;margin-bottom:12px">
        Job ${jobId} — ${job.company||job.customerName}
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tipo</label>
          <select class="form-control" id="finType"><option>Conta a Receber</option><option>Conta a Pagar</option></select></div>
        <div class="form-group"><label class="form-label">Valor (R$)</label>
          <input type="number" class="form-control" id="finVal" value="${job.value||job.totalPrice||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Vencimento</label>
          <input type="date" class="form-control" id="finDue" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="form-group"><label class="form-label">Forma de Pagamento</label>
          <select class="form-control" id="finPay">
            ${['Dinheiro','PIX','Boleto','Cartão de Crédito','Transferência'].map(o=>`<option>${o}</option>`).join('')}
          </select></div>
      </div>`,
      () => {
        const val = parseFloat(document.getElementById('finVal')?.value)||0;
        const due = document.getElementById('finDue')?.value;
        const type = document.getElementById('finType')?.value;
        this._addTrackingEntry(jobId, `${type} gerado: ${fmt.money(val)} · Venc: ${fmt.date(due)}`, 'update');
        closeModal();
        showToast('Financeiro gerado com sucesso!', 'success');
      });
  },

  generateAdvance(jobId) { showToast('Geração de adiantamento em breve', 'warning'); },
  viewOrcamento(jobId)   { showToast(`Orçamento vinculado ao job ${jobId}`, 'warning'); },
  techSheet(jobId)       { showToast('Ficha técnica em breve', 'warning'); },

  printJob(jobId) {
    const job = this._jobs.find(j=>(j.id||j.code)===jobId);
    if (!job) return;
    const w = window.open('', '_blank');
    const items = (job.items||[]).map(it=>`<tr><td>${it.number}</td><td>${it.productName}</td><td style="font-size:11px">${it.description}</td><td>${it.quantity} ${it.unit}</td><td>R$ ${(it.unitValue||0).toFixed(2)}</td><td>R$ ${(it.subtotal||0).toFixed(2)}</td></tr>`).join('');
    const total = (job.items||[]).reduce((s,it)=>s+(it.subtotal||0),0);
    w.document.write(`<!DOCTYPE html><html><head><title>Job ${jobId}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin-bottom:4px}p{font-size:13px;margin:4px 0;color:#555}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{border:1px solid #ddd;padding:7px 10px}th{background:#f5f5f5;font-weight:700}
      .total{text-align:right;font-size:15px;font-weight:700;margin-top:12px}@media print{button{display:none}}</style></head><body>
      <h1>Job ${jobId} — ${job.title}</h1>
      <p><strong>Cliente:</strong> ${job.company||job.customerName} &nbsp;|&nbsp; <strong>Etapa:</strong> ${job.stage} &nbsp;|&nbsp; <strong>Responsável:</strong> ${job.responsible||job.responsibleName}</p>
      <p><strong>Criado:</strong> ${new Date(job.created_at||job.creationTime).toLocaleString('pt-BR')} &nbsp;|&nbsp; <strong>Valor:</strong> R$ ${(job.value||job.totalPrice||0).toFixed(2)}</p>
      <table><thead><tr><th>Nº</th><th>Produto</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th><th>Subtotal</th></tr></thead>
      <tbody>${items}</tbody></table>
      <p class="total">TOTAL: R$ ${total.toFixed(2)}</p>
      <script>window.print();window.close();<\/script></body></html>`);
    w.document.close();
  }
};
