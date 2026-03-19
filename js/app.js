// ===== HELPERS =====
const fmt = {
  money: v => 'R$ ' + Number(v||0).toLocaleString('pt-BR', {minimumFractionDigits:2}),
  date: s => s ? new Date(s).toLocaleDateString('pt-BR') : '-',
  datetime: s => s ? new Date(s).toLocaleString('pt-BR') : '-',
  phone: s => s || '-'
};

const statusLeadLabel = { novo: 'Novo', qualificado: 'Qualificado', proposta: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
const statusOrcLabel = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', expirado: 'Expirado' };
const statusPropostaLabel = { enviado: 'Enviado', visualizado: 'Visualizado', aprovado: 'Aprovado', recusado: 'Recusado' };
const origemLabel = { indicacao: 'Indicação', google: 'Google', instagram: 'Instagram', facebook: 'Facebook', site: 'Site', telefone: 'Telefone', outro: 'Outro' };
const servicosOpcoes = ['Banner/Lona', 'Impressão Digital', 'Impressão Offset', 'Fachada', 'Placa', 'Adesivo/Recorte', 'Instalação', 'Plotagem', 'Cartão de Visita', 'Folder/Flyer', 'Letreiro', 'Outro'];

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function openModal(title, bodyHtml, onSave, large = false) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modal').className = 'modal' + (large ? ' modal-lg' : '');
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('modalSave').onclick = onSave;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function getVal(id) { return document.getElementById(id)?.value || ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }

// ===== HP SYNC STATE =====
let _hpClientes   = []; // Holdprint customers cached this session
let _hpOrcamentos = []; // Holdprint budgets cached this session

// ===== NAVIGATION =====
let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  const titles = { dashboard: 'Dashboard', leads: 'Leads & Prospects', clientes: 'Clientes', orcamentos: 'Orçamentos', propostas: 'Propostas', pipeline: 'Pipeline', jobs: 'Jobs de Produção', relatorios: 'Relatórios' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  const btnLabels = { leads: 'Novo Lead', clientes: 'Novo Cliente', orcamentos: 'Novo Orçamento' };
  const btn = document.getElementById('btnAddNew');
  btn.style.display = btnLabels[page] ? '' : 'none';
  if (btnLabels[page]) btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> ${btnLabels[page]}`;
  renderPage(page);
}

function renderPage(page) {
  const area = document.getElementById('contentArea');
  const renders = { dashboard: renderDashboard, leads: renderLeads, clientes: renderClientes, orcamentos: renderOrcamentos, propostas: renderPropostas, pipeline: renderPipeline, jobs: renderJobs, relatorios: renderRelatorios };
  if (renders[page]) renders[page](area);
}

// ===== DASHBOARD =====
function renderDashboard(area) {
  const s = DB.getStats();
  const leads = DB.getLeads().filter(l => l.status !== 'fechado' && l.status !== 'perdido').slice(0, 5);
  const orcamentos = DB.getOrcamentos().sort((a,b) => b.criadoEm?.localeCompare(a.criadoEm||'')).slice(0, 5);

  area.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card" onclick="navigate('leads')" style="cursor:pointer">
        <div class="kpi-icon" style="background:var(--primary-light)">🎯</div>
        <div class="kpi-label">Leads Ativos</div>
        <div class="kpi-value">${s.leadsAtivos}</div>
        <div class="kpi-sub"><span class="up">+${s.leadsNovos}</span> novos esta semana</div>
      </div>
      <div class="kpi-card" onclick="navigate('clientes')" style="cursor:pointer">
        <div class="kpi-icon" style="background:#e0f2fe">👥</div>
        <div class="kpi-label">Clientes</div>
        <div class="kpi-value">${s.totalClientes}</div>
        <div class="kpi-sub">${s.fechados} conversões no período</div>
      </div>
      <div class="kpi-card" onclick="navigate('orcamentos')" style="cursor:pointer">
        <div class="kpi-icon" style="background:#fef9c3">📋</div>
        <div class="kpi-label">Orçamentos</div>
        <div class="kpi-value">${s.totalOrcamentos}</div>
        <div class="kpi-sub">${fmt.money(s.valorOrcamentos)} em aberto</div>
      </div>
      <div class="kpi-card" onclick="navigate('propostas')" style="cursor:pointer">
        <div class="kpi-icon" style="background:var(--violet-light)">📤</div>
        <div class="kpi-label">Propostas Abertas</div>
        <div class="kpi-value">${s.propostasPendentes}</div>
        <div class="kpi-sub">aguardando resposta</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:var(--success-light)">📈</div>
        <div class="kpi-label">Taxa de Conversão</div>
        <div class="kpi-value" style="color:${s.taxaConversao>=30?'var(--success)':s.taxaConversao>=15?'var(--warning)':'var(--danger)'}">${s.taxaConversao}%</div>
        <div class="kpi-sub">${s.fechados} fechados / ${s.totalLeads} total</div>
      </div>
    </div>
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Leads em Andamento</span>
          <a href="#" class="btn btn-sm btn-secondary" onclick="navigate('leads');return false;">Ver todos</a>
        </div>
        <div class="card-body" style="padding:0">
          ${leads.length === 0 ? '<div class="empty-state"><div>Nenhum lead ativo</div></div>' : `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Nome</th><th>Empresa</th><th>Status</th><th>Interesse</th><th>Valor</th></tr></thead>
              <tbody>${leads.map(l => `
                <tr onclick="showLeadDetail('${l.id}')" style="cursor:pointer">
                  <td><strong>${l.nome}</strong></td>
                  <td>${l.empresa || '-'}</td>
                  <td><span class="badge badge-${l.status}">${statusLeadLabel[l.status]||l.status}</span></td>
                  <td>${l.interesse || '-'}</td>
                  <td>${l.valor ? fmt.money(l.valor) : '-'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Últimos Orçamentos</span>
          <a href="#" class="btn btn-sm btn-secondary" onclick="navigate('orcamentos');return false;">Ver todos</a>
        </div>
        <div class="card-body" style="padding:0">
          ${orcamentos.length === 0 ? '<div class="empty-state"><div>Nenhum orçamento</div></div>' : `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Nº</th><th>Cliente/Lead</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>${orcamentos.map(o => `
                <tr onclick="showOrcamentoDetail('${o.id}')" style="cursor:pointer">
                  <td><strong>${o.numero}</strong></td>
                  <td>${o.clienteNome || '-'}</td>
                  <td>${fmt.money(o.total)}</td>
                  <td><span class="badge badge-${o.status}">${statusOrcLabel[o.status]||o.status}</span></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>
    </div>`;
}

// ===== LEADS =====
function renderLeads(area) {
  const leads = DB.getLeads();
  area.innerHTML = `
    <div class="filter-bar">
      <input class="form-control search-input" id="searchLead" placeholder="Buscar lead..." oninput="filterLeads()">
      <select class="form-control" id="filterLeadStatus" onchange="filterLeads()">
        <option value="">Todos os status</option>
        ${Object.entries(statusLeadLabel).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
      <select class="form-control" id="filterLeadOrigem" onchange="filterLeads()">
        <option value="">Todas origens</option>
        ${Object.entries(origemLabel).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrapper" id="leadsTable">
          ${renderLeadsTable(leads)}
        </div>
      </div>
    </div>`;
}

function renderLeadsTable(leads) {
  if (leads.length === 0) return `<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">Nenhum lead encontrado</div></div>`;
  return `<table>
    <thead><tr><th>Nome</th><th>Empresa</th><th>Contato</th><th>Origem</th><th>Interesse</th><th>Valor</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
    <tbody>${leads.map(l => `
      <tr>
        <td><strong style="cursor:pointer;color:var(--primary)" onclick="showLeadDetail('${l.id}')">${l.nome}</strong></td>
        <td>${l.empresa || '-'}</td>
        <td><div>${l.email || '-'}</div><div style="color:var(--gray-500)">${l.telefone || '-'}</div></td>
        <td>${origemLabel[l.origem] || l.origem || '-'}</td>
        <td>${l.interesse || '-'}</td>
        <td>${l.valor ? fmt.money(l.valor) : '-'}</td>
        <td><span class="badge badge-${l.status}">${statusLeadLabel[l.status]||l.status}</span></td>
        <td>${fmt.date(l.criadoEm)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-secondary" onclick="openFormLead('${l.id}')">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="novoOrcamentoParaLead('${l.id}')">📋</button>
            <button class="btn btn-sm btn-danger" onclick="deleteLead('${l.id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function filterLeads() {
  const q = getVal('searchLead').toLowerCase();
  const st = getVal('filterLeadStatus');
  const or = getVal('filterLeadOrigem');
  let leads = DB.getLeads();
  if (q) leads = leads.filter(l => l.nome.toLowerCase().includes(q) || (l.empresa||'').toLowerCase().includes(q) || (l.email||'').toLowerCase().includes(q));
  if (st) leads = leads.filter(l => l.status === st);
  if (or) leads = leads.filter(l => l.origem === or);
  document.getElementById('leadsTable').innerHTML = renderLeadsTable(leads);
}

function openFormLead(id) {
  const l = id ? DB.getLeadById(id) : null;
  const html = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Nome *</label><input id="fNome" class="form-control" value="${l?.nome||''}"></div>
      <div class="form-group"><label class="form-label">Empresa</label><input id="fEmpresa" class="form-control" value="${l?.empresa||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label><input id="fEmail" class="form-control" type="email" value="${l?.email||''}"></div>
      <div class="form-group"><label class="form-label">Telefone</label><input id="fTelefone" class="form-control" value="${l?.telefone||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Origem</label>
        <select id="fOrigem" class="form-control">
          ${Object.entries(origemLabel).map(([v,la]) => `<option value="${v}" ${l?.origem===v?'selected':''}>${la}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select id="fStatus" class="form-control">
          ${Object.entries(statusLeadLabel).map(([v,la]) => `<option value="${v}" ${(l?.status||'novo')===v?'selected':''}>${la}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Interesse / Serviço</label>
        <select id="fInteresse" class="form-control">
          ${servicosOpcoes.map(s => `<option ${l?.interesse===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Valor Estimado (R$)</label><input id="fValor" class="form-control" type="number" value="${l?.valor||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Observações</label><textarea id="fObs" class="form-control">${l?.observacoes||''}</textarea></div>`;
  openModal(id ? 'Editar Lead' : 'Novo Lead', html, () => {
    const nome = getVal('fNome').trim();
    if (!nome) { showToast('Nome é obrigatório', 'error'); return; }
    const data = { id: l?.id, nome, empresa: getVal('fEmpresa'), email: getVal('fEmail'), telefone: getVal('fTelefone'), origem: getVal('fOrigem'), status: getVal('fStatus'), interesse: getVal('fInteresse'), valor: parseFloat(getVal('fValor'))||0, observacoes: getVal('fObs'), historico: l?.historico||[], criadoEm: l?.criadoEm };
    DB.saveLead(data);
    closeModal();
    showToast(id ? 'Lead atualizado!' : 'Lead criado!', 'success');
    renderPage(currentPage);
  });
}

function deleteLead(id) {
  if (!confirm('Excluir este lead?')) return;
  DB.deleteLead(id);
  showToast('Lead excluído', 'warning');
  renderPage(currentPage);
}

function showLeadDetail(id) {
  const l = DB.getLeadById(id);
  if (!l) return;
  const html = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Nome</div><div class="detail-value">${l.nome}</div></div>
      <div class="detail-item"><div class="detail-label">Empresa</div><div class="detail-value">${l.empresa||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${l.email||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Telefone</div><div class="detail-value">${l.telefone||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Origem</div><div class="detail-value">${origemLabel[l.origem]||l.origem||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="badge badge-${l.status}">${statusLeadLabel[l.status]||l.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Interesse</div><div class="detail-value">${l.interesse||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Valor Estimado</div><div class="detail-value">${l.valor ? fmt.money(l.valor) : '-'}</div></div>
    </div>
    ${l.observacoes ? `<div class="form-group"><div class="detail-label">Observações</div><div class="detail-value">${l.observacoes}</div></div>` : ''}
    <div style="margin-top:20px">
      <div style="font-weight:600;margin-bottom:10px">Adicionar Anotação</div>
      <div style="display:flex;gap:8px">
        <input id="histTexto" class="form-control" placeholder="Registrar interação, retorno, etc...">
        <button class="btn btn-primary" onclick="addHistLead('${l.id}')">Salvar</button>
      </div>
    </div>
    ${(l.historico||[]).length > 0 ? `
    <div style="margin-top:20px">
      <div style="font-weight:600;margin-bottom:10px">Histórico</div>
      <div class="timeline">
        ${[...(l.historico||[])].reverse().map(h => `
          <div class="timeline-item">
            <div class="timeline-time">${fmt.datetime(h.data)}</div>
            <div class="timeline-text">${h.texto}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}`;
  const modal = document.getElementById('modal');
  modal.className = 'modal modal-lg';
  document.getElementById('modalTitle').textContent = `Lead: ${l.nome}`;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('modalSave').textContent = 'Editar Lead';
  document.getElementById('modalSave').onclick = () => { closeModal(); openFormLead(id); };
}

function addHistLead(id) {
  const txt = getVal('histTexto').trim();
  if (!txt) return;
  DB.addHistoricoLead(id, txt);
  showToast('Anotação salva!', 'success');
  showLeadDetail(id);
}

function novoOrcamentoParaLead(leadId) {
  closeModal();
  navigate('orcamentos');
  setTimeout(() => openFormOrcamento(null, leadId), 100);
}

// ===== CLIENTES =====
async function renderClientes(area) {
  const clientes = DB.getClientes();
  area.innerHTML = `
    <div class="filter-bar">
      <input class="form-control search-input" id="searchCliente" placeholder="Buscar cliente..." oninput="filterClientes()">
      <div id="clienteErpBanner" style="font-size:12px;color:var(--gray-400);display:flex;align-items:center;gap:6px;white-space:nowrap">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--primary);opacity:.6">⟳</span> Sincronizando ERP...
      </div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrapper" id="clientesTable">
          ${renderClientesTable(clientes)}
        </div>
      </div>
    </div>`;
  try {
    const hpList = await HOLDPRINT.getCustomers(1);
    if (!document.getElementById('clientesTable')) return; // page changed
    const existingEmails = new Set(DB.getClientes().map(c => (c.email||'').toLowerCase()).filter(Boolean));
    _hpClientes = hpList
      .filter(c => !existingEmails.has((c.email||'').toLowerCase()))
      .map(c => ({...c, _source:'holdprint'}));
    const banner = document.getElementById('clienteErpBanner');
    if (banner) banner.innerHTML = `<span style="color:var(--success)">✓ ${hpList.length} clientes do Holdprint ERP${_hpClientes.length > 0 ? ` · <strong>${_hpClientes.length} novos</strong>` : ''}</span>`;
    document.getElementById('clientesTable').innerHTML = renderClientesTable([...DB.getClientes(), ..._hpClientes]);
  } catch {
    const banner = document.getElementById('clienteErpBanner');
    if (banner) banner.remove();
  }
}

function renderClientesTable(clientes) {
  if (clientes.length === 0) return `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhum cliente cadastrado</div></div>`;
  return `<table>
    <thead><tr><th>Nome/Empresa</th><th>CNPJ/CPF</th><th>Email</th><th>Telefone</th><th>Cidade/UF</th><th>Segmento</th><th>Fonte</th><th>Ações</th></tr></thead>
    <tbody>${clientes.map(c => `
      <tr>
        <td><strong>${c.nome}</strong></td>
        <td>${c.cnpj||'-'}</td>
        <td>${c.email||'-'}</td>
        <td>${c.telefone||'-'}</td>
        <td>${c.cidade||'-'}${c.estado?'/'+c.estado:''}</td>
        <td>${c.segmento||c.tipo||'-'}</td>
        <td>${c._source==='holdprint'
          ? '<span class="badge" style="background:#dbeafe;color:#1d4ed8;font-size:10px;padding:2px 6px;border-radius:4px">ERP</span>'
          : '<span style="font-size:10px;color:var(--gray-400)">CRM</span>'}</td>
        <td>
          <div class="table-actions">
            ${c._source==='holdprint'
              ? `<span style="font-size:11px;color:var(--gray-400)">Holdprint</span>`
              : `<button class="btn btn-sm btn-secondary" onclick="openFormCliente('${c.id}')">✏️</button>
                 <button class="btn btn-sm btn-secondary" onclick="novoOrcParaCliente('${c.id}')">📋</button>
                 <button class="btn btn-sm btn-danger" onclick="deleteCliente('${c.id}')">🗑️</button>`}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function filterClientes() {
  const q = getVal('searchCliente').toLowerCase();
  let list = [...DB.getClientes(), ..._hpClientes];
  if (q) list = list.filter(c => c.nome.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.cnpj||'').includes(q));
  document.getElementById('clientesTable').innerHTML = renderClientesTable(list);
}

function openFormCliente(id) {
  const c = id ? DB.getClienteById(id) : null;
  const html = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Nome / Razão Social *</label><input id="fcNome" class="form-control" value="${c?.nome||''}"></div>
      <div class="form-group"><label class="form-label">CNPJ / CPF</label><input id="fcCnpj" class="form-control" value="${c?.cnpj||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Email</label><input id="fcEmail" class="form-control" type="email" value="${c?.email||''}"></div>
      <div class="form-group"><label class="form-label">Telefone</label><input id="fcTelefone" class="form-control" value="${c?.telefone||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Cidade</label><input id="fcCidade" class="form-control" value="${c?.cidade||''}"></div>
      <div class="form-group"><label class="form-label">Estado</label><input id="fcEstado" class="form-control" value="${c?.estado||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Segmento</label>
        <select id="fcSegmento" class="form-control">
          <option value="">Selecione...</option>
          ${['Varejo','Alimentação','Saúde','Construção','Serviços','Indústria','Educação','Outro'].map(s => `<option ${c?.segmento===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Responsável</label><input id="fcResponsavel" class="form-control" value="${c?.responsavel||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Endereço</label><input id="fcEndereco" class="form-control" value="${c?.endereco||''}"></div>`;
  openModal(id ? 'Editar Cliente' : 'Novo Cliente', html, () => {
    const nome = getVal('fcNome').trim();
    if (!nome) { showToast('Nome é obrigatório', 'error'); return; }
    DB.saveCliente({ id: c?.id, nome, cnpj: getVal('fcCnpj'), email: getVal('fcEmail'), telefone: getVal('fcTelefone'), cidade: getVal('fcCidade'), estado: getVal('fcEstado'), segmento: getVal('fcSegmento'), responsavel: getVal('fcResponsavel'), endereco: getVal('fcEndereco'), criadoEm: c?.criadoEm });
    closeModal();
    showToast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
    renderPage(currentPage);
  });
}

function deleteCliente(id) {
  if (!confirm('Excluir este cliente?')) return;
  DB.deleteCliente(id);
  showToast('Cliente excluído', 'warning');
  renderPage(currentPage);
}

function novoOrcParaCliente(clienteId) {
  navigate('orcamentos');
  setTimeout(() => openFormOrcamento(null, null, clienteId), 100);
}

// ===== ORÇAMENTOS =====
async function renderOrcamentos(area) {
  const orcs = DB.getOrcamentos().sort((a,b) => (b.criadoEm||'').localeCompare(a.criadoEm||''));
  area.innerHTML = `
    <div class="filter-bar">
      <input class="form-control search-input" id="searchOrc" placeholder="Buscar orçamento..." oninput="filterOrcamentos()">
      <select class="form-control" id="filterOrcStatus" onchange="filterOrcamentos()">
        <option value="">Todos os status</option>
        ${Object.entries(statusOrcLabel).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
      <div id="orcErpBanner" style="font-size:12px;color:var(--gray-400);white-space:nowrap">⟳ Sincronizando ERP...</div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrapper" id="orcsTable">${renderOrcsTable(orcs)}</div>
      </div>
    </div>`;
  try {
    const hpBudgets = await HOLDPRINT.getBudgets(1);
    if (!document.getElementById('orcsTable')) return;
    _hpOrcamentos = hpBudgets.map(b => ({...b, _source:'holdprint'}));
    const banner = document.getElementById('orcErpBanner');
    if (banner) banner.innerHTML = `<span style="color:var(--success)">✓ ${hpBudgets.length} orçamentos do Holdprint ERP</span>`;
    document.getElementById('orcsTable').innerHTML = renderOrcsTable([...orcs, ..._hpOrcamentos]);
  } catch {
    const banner = document.getElementById('orcErpBanner');
    if (banner) banner.remove();
  }
}

function renderOrcsTable(orcs) {
  if (orcs.length === 0) return `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Nenhum orçamento encontrado</div></div>`;
  return `<table>
    <thead><tr><th>Nº</th><th>Cliente/Lead</th><th>Serviços/Título</th><th>Total</th><th>Validade</th><th>Status</th><th>Fonte</th><th>Data</th><th>Ações</th></tr></thead>
    <tbody>${orcs.map(o => {
      const num    = o.numero || o.id || '-';
      const client = o.clienteNome || o.company || '-';
      const desc   = o._source==='holdprint' ? (o.title||'') : ((o.itens||[]).map(i=>i.servico).join(', ')||'-');
      const total  = o.total ?? o.value ?? 0;
      const status = o.status || 'pendente';
      const date   = o.criadoEm || o.created_at || '';
      return `
      <tr>
        <td><strong style="cursor:pointer;color:var(--primary)" onclick="${o._source==='holdprint' ? '' : `showOrcamentoDetail('${o.id}')`}">${num}</strong></td>
        <td>${client}</td>
        <td>${desc}</td>
        <td><strong>${fmt.money(total)}</strong></td>
        <td>${fmt.date(o.validade||'-')}</td>
        <td><span class="badge badge-${status}">${statusOrcLabel[status]||status}</span></td>
        <td>${o._source==='holdprint'
          ? '<span class="badge" style="background:#dbeafe;color:#1d4ed8;font-size:10px;padding:2px 6px;border-radius:4px">ERP</span>'
          : '<span style="font-size:10px;color:var(--gray-400)">CRM</span>'}</td>
        <td>${fmt.date(date)}</td>
        <td>
          <div class="table-actions">
            ${o._source==='holdprint'
              ? `<span style="font-size:11px;color:var(--gray-400)">Holdprint</span>`
              : `<button class="btn btn-sm btn-secondary" onclick="showOrcamentoDetail('${o.id}')">👁️</button>
                 <button class="btn btn-sm btn-secondary" onclick="openFormOrcamento('${o.id}')">✏️</button>
                 <button class="btn btn-sm btn-success" onclick="gerarProposta('${o.id}')">📤</button>
                 <button class="btn btn-sm btn-danger" onclick="deleteOrcamento('${o.id}')">🗑️</button>`}
          </div>
        </td>
      </tr>`;}).join('')}
    </tbody>
  </table>`;
}

function filterOrcamentos() {
  const q = getVal('searchOrc').toLowerCase();
  const st = getVal('filterOrcStatus');
  let list = [...DB.getOrcamentos().sort((a,b) => (b.criadoEm||'').localeCompare(a.criadoEm||'')), ..._hpOrcamentos];
  if (q) list = list.filter(o => (o.numero||o.id||'').toLowerCase().includes(q) || (o.clienteNome||o.company||'').toLowerCase().includes(q));
  if (st) list = list.filter(o => o.status === st);
  document.getElementById('orcsTable').innerHTML = renderOrcsTable(list);
}

function openFormOrcamento(id, leadId, clienteId) {
  const o = id ? DB.getOrcamentoById(id) : null;
  const lead = leadId ? DB.getLeadById(leadId) : null;
  const cliente = clienteId ? DB.getClienteById(clienteId) : null;
  const defaultNome = lead?.nome || cliente?.nome || o?.clienteNome || '';

  const html = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Cliente / Lead *</label><input id="foClienteNome" class="form-control" value="${defaultNome}" placeholder="Nome do cliente ou empresa"></div>
      <div class="form-group"><label class="form-label">Contato</label><input id="foContato" class="form-control" value="${lead?.email || cliente?.email || o?.contato || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Validade</label><input id="foValidade" class="form-control" type="date" value="${o?.validade||''}"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select id="foStatus" class="form-control">
          ${Object.entries(statusOrcLabel).map(([v,l]) => `<option value="${v}" ${(o?.status||'pendente')===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Itens do Orçamento</label>
      <div id="orcItens">
        ${(o?.itens||[{servico:'',descricao:'',qtd:1,valorUnit:0}]).map((it,i) => renderItemOrc(it,i)).join('')}
      </div>
      <button type="button" class="btn btn-secondary btn-sm" onclick="addItemOrc()" style="margin-top:8px">+ Adicionar Item</button>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Desconto (R$)</label><input id="foDesconto" class="form-control" type="number" value="${o?.desconto||0}" oninput="calcTotalOrc()"></div>
      <div class="form-group"><label class="form-label">Total</label><input id="foTotal" class="form-control" readonly value="${o?.total||0}"></div>
    </div>
    <div class="form-group"><label class="form-label">Observações</label><textarea id="foObs" class="form-control">${o?.observacoes||''}</textarea></div>`;
  openModal(id ? 'Editar Orçamento' : 'Novo Orçamento', html, () => {
    const nome = getVal('foClienteNome').trim();
    if (!nome) { showToast('Cliente é obrigatório', 'error'); return; }
    const itens = coletarItensOrc();
    const desconto = parseFloat(getVal('foDesconto'))||0;
    const subtotal = itens.reduce((s,i) => s + i.total, 0);
    const total = Math.max(0, subtotal - desconto);
    const data = { id: o?.id, clienteNome: nome, contato: getVal('foContato'), validade: getVal('foValidade'), status: getVal('foStatus'), itens, desconto, subtotal, total, observacoes: getVal('foObs'), criadoEm: o?.criadoEm, numero: o?.numero };
    DB.saveOrcamento(data);
    closeModal();
    showToast(id ? 'Orçamento atualizado!' : 'Orçamento criado!', 'success');
    renderPage(currentPage);
  }, true);
  setTimeout(calcTotalOrc, 100);
}

function renderItemOrc(it, i) {
  return `<div class="form-row-3" style="margin-bottom:8px;align-items:end" id="orcItem${i}">
    <div>
      <label class="form-label" style="font-size:11px">Serviço</label>
      <select class="form-control orc-servico" data-i="${i}" onchange="calcTotalOrc()">
        ${servicosOpcoes.map(s => `<option ${it.servico===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
      <div>
        <label class="form-label" style="font-size:11px">Qtd</label>
        <input class="form-control orc-qtd" data-i="${i}" type="number" min="1" value="${it.qtd||1}" oninput="calcTotalOrc()">
      </div>
      <div>
        <label class="form-label" style="font-size:11px">Valor Unit.</label>
        <input class="form-control orc-valor" data-i="${i}" type="number" min="0" value="${it.valorUnit||0}" oninput="calcTotalOrc()">
      </div>
      <div>
        <label class="form-label" style="font-size:11px">Total</label>
        <input class="form-control orc-total-item" data-i="${i}" readonly value="${it.total||0}">
      </div>
    </div>
    <div><button type="button" class="btn btn-danger btn-sm" onclick="removeItemOrc(${i})">−</button></div>
  </div>`;
}

let orcItemCount = 1;
function addItemOrc() {
  const div = document.getElementById('orcItens');
  const i = Date.now();
  const el = document.createElement('div');
  el.innerHTML = renderItemOrc({servico:'',qtd:1,valorUnit:0,total:0}, i);
  div.appendChild(el.firstElementChild);
}

function removeItemOrc(i) {
  const el = document.getElementById('orcItem' + i);
  if (el) el.remove();
  calcTotalOrc();
}

function calcTotalOrc() {
  document.querySelectorAll('.orc-qtd').forEach(qtdEl => {
    const i = qtdEl.dataset.i;
    const qtd = parseFloat(qtdEl.value)||0;
    const val = parseFloat(document.querySelector(`.orc-valor[data-i="${i}"]`)?.value)||0;
    const total = qtd * val;
    const tEl = document.querySelector(`.orc-total-item[data-i="${i}"]`);
    if (tEl) tEl.value = total.toFixed(2);
  });
  const subtotal = Array.from(document.querySelectorAll('.orc-total-item')).reduce((s,e) => s + (parseFloat(e.value)||0), 0);
  const desc = parseFloat(getVal('foDesconto'))||0;
  const total = Math.max(0, subtotal - desc);
  setVal('foTotal', total.toFixed(2));
}

function coletarItensOrc() {
  const itens = [];
  document.querySelectorAll('.orc-qtd').forEach(qtdEl => {
    const i = qtdEl.dataset.i;
    const servico = document.querySelector(`.orc-servico[data-i="${i}"]`)?.value || '';
    const qtd = parseFloat(qtdEl.value)||0;
    const valorUnit = parseFloat(document.querySelector(`.orc-valor[data-i="${i}"]`)?.value)||0;
    const total = qtd * valorUnit;
    itens.push({ servico, qtd, valorUnit, total });
  });
  return itens;
}

function showOrcamentoDetail(id) {
  const o = DB.getOrcamentoById(id);
  if (!o) return;
  const html = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Número</div><div class="detail-value">${o.numero}</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="badge badge-${o.status}">${statusOrcLabel[o.status]||o.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Cliente</div><div class="detail-value">${o.clienteNome||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Contato</div><div class="detail-value">${o.contato||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Data</div><div class="detail-value">${fmt.date(o.criadoEm)}</div></div>
      <div class="detail-item"><div class="detail-label">Validade</div><div class="detail-value">${fmt.date(o.validade)}</div></div>
    </div>
    <table class="orc-items">
      <thead><tr><th>Serviço</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr></thead>
      <tbody>${(o.itens||[]).map(it => `<tr><td>${it.servico}</td><td>${it.qtd}</td><td>${fmt.money(it.valorUnit)}</td><td>${fmt.money(it.total)}</td></tr>`).join('')}</tbody>
    </table>
    <table class="orc-totals" style="width:300px;margin-left:auto">
      <tr><td>Subtotal:</td><td><strong>${fmt.money(o.subtotal||o.total)}</strong></td></tr>
      ${o.desconto ? `<tr><td>Desconto:</td><td style="color:var(--danger)">- ${fmt.money(o.desconto)}</td></tr>` : ''}
      <tr><td class="orc-total-final">TOTAL:</td><td class="orc-total-final">${fmt.money(o.total)}</td></tr>
    </table>
    ${o.observacoes ? `<div style="margin-top:16px"><div class="detail-label">Observações</div><div class="detail-value">${o.observacoes}</div></div>` : ''}
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-success" onclick="gerarProposta('${o.id}')">📤 Gerar Proposta</button>
      <button class="btn btn-secondary" onclick="atualizarStatusOrc('${o.id}')">Atualizar Status</button>
    </div>`;
  document.getElementById('modalTitle').textContent = `Orçamento ${o.numero}`;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').className = 'modal modal-lg';
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('modalSave').textContent = 'Editar';
  document.getElementById('modalSave').onclick = () => { closeModal(); openFormOrcamento(id); };
}

function atualizarStatusOrc(id) {
  const o = DB.getOrcamentoById(id);
  if (!o) return;
  const html = `<div class="form-group"><label class="form-label">Novo Status</label>
    <select id="novoStatusOrc" class="form-control">
      ${Object.entries(statusOrcLabel).map(([v,l]) => `<option value="${v}" ${o.status===v?'selected':''}>${l}</option>`).join('')}
    </select>
  </div>`;
  openModal('Atualizar Status', html, () => {
    o.status = getVal('novoStatusOrc');
    DB.saveOrcamento(o);
    closeModal();
    showToast('Status atualizado!', 'success');
    renderPage(currentPage);
  });
}

function deleteOrcamento(id) {
  if (!confirm('Excluir este orçamento?')) return;
  DB.deleteOrcamento(id);
  showToast('Orçamento excluído', 'warning');
  renderPage(currentPage);
}

// ===== PROPOSTAS =====
function gerarProposta(orcId) {
  const o = DB.getOrcamentoById(orcId);
  if (!o) return;
  closeModal();
  const html = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Destinatário *</label><input id="fpDestinatario" class="form-control" value="${o.clienteNome||''}"></div>
      <div class="form-group"><label class="form-label">Email</label><input id="fpEmail" class="form-control" type="email" value="${o.contato||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Orçamento vinculado</label><input class="form-control" readonly value="${o.numero} - ${fmt.money(o.total)}"></div>
    <div class="form-group"><label class="form-label">Mensagem da Proposta</label>
      <textarea id="fpMensagem" class="form-control" style="min-height:120px">Prezado(a) ${o.clienteNome},

Segue nossa proposta para os serviços solicitados:

${(o.itens||[]).map(i => `• ${i.servico}: ${i.qtd}x ${fmt.money(i.valorUnit)} = ${fmt.money(i.total)}`).join('\n')}

${o.desconto ? `Desconto: -${fmt.money(o.desconto)}\n` : ''}TOTAL: ${fmt.money(o.total)}

Validade: ${fmt.date(o.validade) !== '-' ? fmt.date(o.validade) : '30 dias'}

${o.observacoes ? 'Observações: ' + o.observacoes + '\n' : ''}
Aguardamos seu retorno.
Atenciosamente,
Equipe de Comunicação Visual</textarea>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status Inicial</label>
        <select id="fpStatus" class="form-control">
          <option value="enviado">Enviado</option>
          <option value="pendente">Pendente (rascunho)</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Validade da Proposta</label><input id="fpValidade" class="form-control" type="date" value="${o.validade||''}"></div>
    </div>`;
  openModal('Gerar Proposta', html, () => {
    const dest = getVal('fpDestinatario').trim();
    if (!dest) { showToast('Destinatário é obrigatório', 'error'); return; }
    DB.saveProposta({ destinatario: dest, email: getVal('fpEmail'), orcamentoId: orcId, orcamentoNumero: o.numero, total: o.total, mensagem: getVal('fpMensagem'), status: getVal('fpStatus'), validade: getVal('fpValidade') });
    showToast('Proposta gerada!', 'success');
    closeModal();
    navigate('propostas');
  }, true);
}

function renderPropostas(area) {
  const props = DB.getPropostas().sort((a,b) => (b.criadoEm||'').localeCompare(a.criadoEm||''));
  area.innerHTML = `
    <div class="filter-bar">
      <input class="form-control search-input" id="searchProp" placeholder="Buscar proposta..." oninput="filterPropostas()">
      <select class="form-control" id="filterPropStatus" onchange="filterPropostas()">
        <option value="">Todos os status</option>
        ${Object.entries(statusPropostaLabel).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrapper" id="propsTable">${renderPropsTable(props)}</div>
      </div>
    </div>`;
}

function renderPropsTable(props) {
  if (props.length === 0) return `<div class="empty-state"><div class="empty-state-icon">📤</div><div class="empty-state-text">Nenhuma proposta encontrada</div></div>`;
  return `<table>
    <thead><tr><th>Destinatário</th><th>Email</th><th>Orçamento</th><th>Total</th><th>Status</th><th>Validade</th><th>Data Envio</th><th>Ações</th></tr></thead>
    <tbody>${props.map(p => `
      <tr>
        <td><strong>${p.destinatario}</strong></td>
        <td>${p.email||'-'}</td>
        <td>${p.orcamentoNumero||'-'}</td>
        <td><strong>${fmt.money(p.total)}</strong></td>
        <td><span class="badge badge-${p.status}">${statusPropostaLabel[p.status]||p.status}</span></td>
        <td>${fmt.date(p.validade)}</td>
        <td>${fmt.date(p.criadoEm)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-secondary" onclick="showPropostaDetail('${p.id}')">👁️</button>
            <button class="btn btn-sm btn-secondary" onclick="atualizarStatusProposta('${p.id}')">↕️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProposta('${p.id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function filterPropostas() {
  const q = getVal('searchProp').toLowerCase();
  const st = getVal('filterPropStatus');
  let list = DB.getPropostas();
  if (q) list = list.filter(p => p.destinatario.toLowerCase().includes(q) || (p.orcamentoNumero||'').toLowerCase().includes(q));
  if (st) list = list.filter(p => p.status === st);
  document.getElementById('propsTable').innerHTML = renderPropsTable(list);
}

function showPropostaDetail(id) {
  const p = DB.getPropostaById(id);
  if (!p) return;
  const html = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Destinatário</div><div class="detail-value">${p.destinatario}</div></div>
      <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${p.email||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Orçamento</div><div class="detail-value">${p.orcamentoNumero||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Total</div><div class="detail-value"><strong>${fmt.money(p.total)}</strong></div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="badge badge-${p.status}">${statusPropostaLabel[p.status]||p.status}</span></div></div>
      <div class="detail-item"><div class="detail-label">Validade</div><div class="detail-value">${fmt.date(p.validade)}</div></div>
    </div>
    <div class="form-group">
      <div class="detail-label">Mensagem</div>
      <pre style="background:var(--gray-50);padding:16px;border-radius:8px;font-family:inherit;font-size:13px;white-space:pre-wrap;border:1px solid var(--gray-200)">${p.mensagem||''}</pre>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-primary" onclick="atualizarStatusProposta('${p.id}')">Atualizar Status</button>
    </div>`;
  document.getElementById('modalTitle').textContent = `Proposta - ${p.destinatario}`;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').className = 'modal modal-lg';
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('modalSave').style.display = 'none';
  document.getElementById('modalCancel').textContent = 'Fechar';
}

function atualizarStatusProposta(id) {
  const p = DB.getPropostaById(id);
  if (!p) return;
  const html = `<div class="form-group"><label class="form-label">Novo Status</label>
    <select id="novoStatusProp" class="form-control">
      ${Object.entries(statusPropostaLabel).map(([v,l]) => `<option value="${v}" ${p.status===v?'selected':''}>${l}</option>`).join('')}
    </select>
  </div>`;
  openModal('Atualizar Status da Proposta', html, () => {
    p.status = getVal('novoStatusProp');
    DB.saveProposta(p);
    closeModal();
    showToast('Status atualizado!', 'success');
    renderPage(currentPage);
  });
}

function deleteProposta(id) {
  if (!confirm('Excluir esta proposta?')) return;
  DB.deleteProposta(id);
  showToast('Proposta excluída', 'warning');
  renderPage(currentPage);
}

// HP budgetState → CRM pipeline column key
const _hpStageMap = { prospecção:'novo', qualificação:'qualificado', proposta:'proposta', negociação:'negociacao', fechamento:'negociacao', ganho:'fechado', perdido:'perdido' };

// ===== PIPELINE =====
async function renderPipeline(area) {
  const leads = DB.getLeads();
  _renderPipelineBoard(area, leads, []);
  try {
    const hpBudgets = await HOLDPRINT.getBudgets(1);
    if (!document.querySelector('.pipeline-board')) return;
    _renderPipelineBoard(area, leads, hpBudgets);
  } catch { /* keep board as-is */ }
}

function _renderPipelineBoard(area, leads, hpBudgets) {
  const cols = Object.entries(statusLeadLabel);
  const totalLeads = leads.reduce((s,l) => s + (l.valor||0), 0);
  const totalHP    = hpBudgets.reduce((s,b) => s + (b.value||0), 0);
  area.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="font-size:13px;color:var(--gray-500)">Total no funil: <strong style="color:var(--gray-900);font-size:15px">${fmt.money(totalLeads + totalHP)}</strong></div>
        <div style="font-size:13px;color:var(--gray-500)">Leads ativos: <strong style="color:var(--primary)">${leads.filter(l=>!['fechado','perdido'].includes(l.status)).length}</strong></div>
        ${hpBudgets.length > 0 ? `<div style="font-size:13px;color:var(--gray-500)">ERP: <strong style="color:#1d4ed8">${hpBudgets.length} orçamentos</strong></div>` : ''}
      </div>
    </div>
    <div class="pipeline-board">
      ${cols.map(([status, label]) => {
        const leadCards = leads.filter(l => l.status === status);
        const hpCards   = hpBudgets.filter(b => (_hpStageMap[b.stage]||b.stage) === status);
        const total = leadCards.reduce((s,l) => s + (l.valor||0), 0) + hpCards.reduce((s,b) => s + (b.value||0), 0);
        const count = leadCards.length + hpCards.length;
        const colIcons = { novo:'🔵', qualificado:'🟦', proposta:'🟡', negociacao:'🟣', fechado:'🟢', perdido:'🔴' };
        return `
          <div class="pipeline-column col-${status}">
            <div class="pipeline-col-header">
              <span style="display:flex;align-items:center;gap:6px">${colIcons[status]||''} ${label}</span>
              <span style="font-size:11px;font-weight:700;opacity:.8">${count}</span>
            </div>
            <div class="pipeline-cards">
              ${leadCards.map(l => `
                <div class="pipeline-card" onclick="showLeadDetail('${l.id}')">
                  <div class="pipeline-card-name">${l.nome}</div>
                  <div class="pipeline-card-info">${l.empresa||'–'}${l.interesse ? ' · ' + l.interesse : ''}</div>
                  ${l.valor ? `<div class="pipeline-card-value">${fmt.money(l.valor)}</div>` : ''}
                  <div class="pipeline-card-date">${fmt.date(l.criadoEm)}</div>
                </div>`).join('')}
              ${hpCards.map(b => `
                <div class="pipeline-card" style="border-left:3px solid #3b82f6">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div class="pipeline-card-name">${b.title||b.id}</div>
                    <span style="font-size:9px;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:3px;white-space:nowrap">ERP</span>
                  </div>
                  <div class="pipeline-card-info">${b.company||'–'}</div>
                  ${b.value ? `<div class="pipeline-card-value">${fmt.money(b.value)}</div>` : ''}
                  <div class="pipeline-card-date">${fmt.date(b.created_at||'')}</div>
                </div>`).join('')}
              ${count === 0 ? `
                <div style="text-align:center;padding:28px 12px;color:var(--gray-400);font-size:12px">
                  <div style="font-size:24px;margin-bottom:8px;opacity:.4">○</div>
                  Sem leads
                </div>` : ''}
            </div>
            ${total > 0 ? `<div style="padding:8px 10px;background:rgba(255,255,255,.6);border-radius:6px;margin-top:8px;font-size:11px;font-weight:700;text-align:center;color:var(--gray-600)">${fmt.money(total)}</div>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

// ===== JOBS → delegado para jobs.js =====
function renderJobs(area) {
  if (window.JobsModule) window.JobsModule.render(area);
}

// ===== RELATÓRIOS → delegado para relatorios.js =====
function renderRelatorios(area) {
  if (window.RelatoriosModule) window.RelatoriosModule.render(area);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Navegação
  document.querySelectorAll('.nav-item').forEach(n => {
    n.addEventListener('click', e => { e.preventDefault(); navigate(n.dataset.page); });
  });

  // Botão Novo
  document.getElementById('btnAddNew').addEventListener('click', () => {
    const actions = { leads: () => openFormLead(), clientes: () => openFormCliente(), orcamentos: () => openFormOrcamento(), propostas: () => showToast('Crie uma proposta a partir de um orçamento', 'warning') };
    if (actions[currentPage]) actions[currentPage]();
  });

  // Modal fechar
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === document.getElementById('modalOverlay')) closeModal(); });

  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Seletor de região Holdprint
  const regionSel = document.getElementById('regionSelect');
  if (regionSel) {
    regionSel.value = localStorage.getItem('hp_region') || 'sp';
    regionSel.addEventListener('change', () => {
      HOLDPRINT.setRegion(regionSel.value);
      showToast('Região alterada para ' + regionSel.value.toUpperCase(), 'success');
      renderPage(currentPage);
    });
  }

  // Modal save reset on open
  const origModalSave = document.getElementById('modalSave');
  origModalSave.style.display = '';
  document.getElementById('modalCancel').textContent = 'Cancelar';

  navigate('dashboard');

  // Probe real Holdprint API to update status indicator
  if (Auth.isAuthenticated()) HOLDPRINT.probe();
});
