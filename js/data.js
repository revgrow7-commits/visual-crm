// ===== DATA MANAGEMENT =====
const DB = {
  _store(key, data) { localStorage.setItem('crm_' + key, JSON.stringify(data)); },
  _load(key, def = []) {
    try { const d = localStorage.getItem('crm_' + key); return d ? JSON.parse(d) : def; }
    catch { return def; }
  },

  // --- CLIENTES ---
  getClientes() { return this._load('clientes'); },
  saveCliente(c) {
    const list = this.getClientes();
    if (c.id) {
      const i = list.findIndex(x => x.id === c.id);
      if (i >= 0) list[i] = c; else list.push(c);
    } else {
      c.id = 'CLI' + Date.now();
      c.criadoEm = new Date().toISOString();
      list.push(c);
    }
    this._store('clientes', list);
    return c;
  },
  deleteCliente(id) {
    this._store('clientes', this.getClientes().filter(x => x.id !== id));
  },
  getClienteById(id) { return this.getClientes().find(x => x.id === id); },

  // --- LEADS ---
  getLeads() { return this._load('leads'); },
  saveLead(l) {
    const list = this.getLeads();
    if (l.id) {
      const i = list.findIndex(x => x.id === l.id);
      if (i >= 0) list[i] = l; else list.push(l);
    } else {
      l.id = 'LEA' + Date.now();
      l.criadoEm = new Date().toISOString();
      l.status = l.status || 'novo';
      l.historico = [];
      list.push(l);
    }
    this._store('leads', list);
    return l;
  },
  deleteLead(id) {
    this._store('leads', this.getLeads().filter(x => x.id !== id));
  },
  getLeadById(id) { return this.getLeads().find(x => x.id === id); },
  addHistoricoLead(leadId, texto) {
    const list = this.getLeads();
    const lead = list.find(x => x.id === leadId);
    if (lead) {
      if (!lead.historico) lead.historico = [];
      lead.historico.push({ data: new Date().toISOString(), texto });
      this._store('leads', list);
    }
  },

  // --- ORCAMENTOS ---
  getOrcamentos() { return this._load('orcamentos'); },
  saveOrcamento(o) {
    const list = this.getOrcamentos();
    if (o.id) {
      const i = list.findIndex(x => x.id === o.id);
      if (i >= 0) list[i] = o; else list.push(o);
    } else {
      o.id = 'ORC' + Date.now();
      o.numero = this.getProximoNumeroOrcamento();
      o.criadoEm = new Date().toISOString();
      o.status = o.status || 'pendente';
      list.push(o);
    }
    this._store('orcamentos', list);
    return o;
  },
  deleteOrcamento(id) {
    this._store('orcamentos', this.getOrcamentos().filter(x => x.id !== id));
  },
  getOrcamentoById(id) { return this.getOrcamentos().find(x => x.id === id); },
  getProximoNumeroOrcamento() {
    const list = this.getOrcamentos();
    const ano = new Date().getFullYear();
    const count = list.filter(o => o.numero && o.numero.includes(String(ano))).length + 1;
    return `${ano}-${String(count).padStart(4, '0')}`;
  },

  // --- PROPOSTAS ---
  getPropostas() { return this._load('propostas'); },
  saveProposta(p) {
    const list = this.getPropostas();
    if (p.id) {
      const i = list.findIndex(x => x.id === p.id);
      if (i >= 0) list[i] = p; else list.push(p);
    } else {
      p.id = 'PRO' + Date.now();
      p.criadoEm = new Date().toISOString();
      p.status = p.status || 'enviado';
      list.push(p);
    }
    this._store('propostas', list);
    return p;
  },
  deleteProposta(id) {
    this._store('propostas', this.getPropostas().filter(x => x.id !== id));
  },
  getPropostaById(id) { return this.getPropostas().find(x => x.id === id); },

  // --- STATS ---
  getStats() {
    const leads = this.getLeads();
    const orcamentos = this.getOrcamentos();
    const propostas = this.getPropostas();
    const clientes = this.getClientes();
    const totalOrc = orcamentos.reduce((s, o) => s + (o.total || 0), 0);
    const fechados = leads.filter(l => l.status === 'fechado').length;
    const perdidos = leads.filter(l => l.status === 'perdido').length;
    const totalLeads = leads.length;
    const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;
    return {
      totalLeads,
      leadsNovos: leads.filter(l => l.status === 'novo').length,
      leadsAtivos: leads.filter(l => !['fechado','perdido'].includes(l.status)).length,
      totalClientes: clientes.length,
      totalOrcamentos: orcamentos.length,
      totalPropostas: propostas.length,
      valorOrcamentos: totalOrc,
      fechados,
      perdidos,
      taxaConversao,
      propostasPendentes: propostas.filter(p => p.status === 'enviado' || p.status === 'visualizado').length
    };
  }
};

// Seed com dados de exemplo se vazio
(function seed() {
  if (DB.getClientes().length === 0) {
    const clientes = [
      { nome: 'Supermercado Bom Preço', cnpj: '12.345.678/0001-90', email: 'contato@bompreco.com', telefone: '(11) 99999-1111', cidade: 'São Paulo', estado: 'SP', segmento: 'Varejo' },
      { nome: 'Academia Fitness Plus', cnpj: '98.765.432/0001-10', email: 'admin@fitnessplus.com', telefone: '(11) 98888-2222', cidade: 'São Paulo', estado: 'SP', segmento: 'Saúde' },
      { nome: 'Construtora Horizonte', cnpj: '11.222.333/0001-44', email: 'obras@horizonte.com', telefone: '(11) 97777-3333', cidade: 'Guarulhos', estado: 'SP', segmento: 'Construção' }
    ];
    clientes.forEach(c => DB.saveCliente(c));
  }
  if (DB.getLeads().length === 0) {
    const leads = [
      { nome: 'João Silva', empresa: 'Loja do João', email: 'joao@loja.com', telefone: '(11) 96666-4444', status: 'novo', origem: 'indicacao', interesse: 'Banner/Lona', valor: 800, observacoes: 'Quer banner para fachada' },
      { nome: 'Maria Santos', empresa: 'Restaurante Sabor', email: 'maria@sabor.com', telefone: '(11) 95555-5555', status: 'qualificado', origem: 'instagram', interesse: 'Fachada', valor: 3500, observacoes: 'Reforma completa da fachada' },
      { nome: 'Carlos Ferreira', empresa: 'Auto Peças CF', email: 'carlos@autopecas.com', telefone: '(11) 94444-6666', status: 'proposta', origem: 'google', interesse: 'Adesivos/Recorte', valor: 1200, observacoes: 'Adesivos para veículos da frota' },
      { nome: 'Ana Costa', empresa: 'Boutique Ana', email: 'ana@boutique.com', telefone: '(11) 93333-7777', status: 'negociacao', origem: 'facebook', interesse: 'Impressão Digital', valor: 2100, observacoes: 'Material para evento' },
      { nome: 'Paulo Oliveira', empresa: 'Padaria Pão de Ouro', email: 'paulo@padaria.com', telefone: '(11) 92222-8888', status: 'fechado', origem: 'indicacao', interesse: 'Placa/Fachada', valor: 4800, observacoes: 'Inauguração nova unidade' }
    ];
    leads.forEach(l => DB.saveLead(l));
  }
})();
