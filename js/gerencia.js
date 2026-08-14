document.addEventListener('DOMContentLoaded', () => {
    // 1. FATURAMENTO 
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const inputInicio = document.getElementById('data_inicio');
    const inputFim = document.getElementById('data_fim');
    if (inputInicio && inputFim) {
        inputInicio.value = primeiroDia.toISOString().split('T')[0];
        inputFim.value = hoje.toISOString().split('T')[0];
    }

    const formFaturamento = document.getElementById('form-faturamento');
    if (formFaturamento) {
        formFaturamento.addEventListener('submit', buscarFaturamento);
        buscarFaturamento(); 
    }

    // 2. GESTÃO DE ESTRUTURA (Carregamentos Iniciais)
    carregarTiposQuarto(); 
    carregarQuartosFisicos();
    carregarSalas();

    // Eventos dos Formulários
    const formTipoQuarto = document.getElementById('form-tipo-quarto');
    if (formTipoQuarto) formTipoQuarto.addEventListener('submit', salvarTipoQuarto);

    const formQuarto = document.getElementById('form-quarto');
    if (formQuarto) formQuarto.addEventListener('submit', salvarQuarto);

    const formSala = document.getElementById('form-sala-conferencia');
    if (formSala) formSala.addEventListener('submit', salvarSala);
});


// ==========================================
// FATURAMENTO
// ==========================================

async function buscarFaturamento(event) {
    if (event) event.preventDefault();

    const dataInicio = document.getElementById('data_inicio').value;
    const dataFim = document.getElementById('data_fim').value;

    try {
        const resposta = await fetch(`http://localhost:3000/api/v1/faturamento?data_inicio=${dataInicio}&data_fim=${dataFim}`);
        
        if (resposta.ok) {
            const json = await resposta.json();
            const relatorio = json.relatorio || {};

            document.getElementById('valor-hospedagem').textContent = `R$ ${parseFloat(relatorio.total_diarias || 0).toFixed(2)}`;
            document.getElementById('valor-salas').textContent = `R$ ${parseFloat(relatorio.total_consumo || 0).toFixed(2)}`;
            document.getElementById('valor-total').textContent = `R$ ${parseFloat(relatorio.faturamento_total || 0).toFixed(2)}`;
        }
    } catch (erro) {
        console.error("Erro ao buscar faturamento:", erro);
    }
}


// ==========================================
// TIPOS DE QUARTO (Categorias)
// ==========================================

async function carregarTiposQuarto() {
    try {
        const resposta = await fetch('http://localhost:3000/api/v1/tipos_quarto');
        if (resposta.ok) {
            const json = await resposta.json();
            const tipos = json.dados || []; // Extrai a array de dados
            const tbody = document.getElementById('tabela-tipos-quarto'); 
            
            if (tbody) {
                tbody.innerHTML = '';
                if (tipos.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="text-muted text-center">Nenhuma categoria encontrada.</td></tr>';
                } else {
                    tipos.forEach(t => {
                        const id = t.idTipo_Quarto || t.idTipoQuarto;
                        const dadosStr = encodeURIComponent(JSON.stringify(t)); 
                        tbody.innerHTML += `
                            <tr>
                                <td class="text-start fw-bold">${t.nome_tipoQuarto}</td>
                                <td>R$ ${parseFloat(t.valor_base || 0).toFixed(2)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary py-0" onclick="iniciarEdicaoTipo('${dadosStr}')">Editar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
            }

            // Atualiza o select de categorias no formulário do Quarto Físico
            atualizarSelectTipos(tipos);
        }
    } catch (erro) {
        console.error("Erro ao carregar tipos de quarto:", erro);
    }
}

function atualizarSelectTipos(tipos) {
    const select = document.getElementById('select_tipo_quarto');
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled selected>Selecione a categoria...</option>';
    tipos.forEach(t => {
        const id = t.idTipo_Quarto || t.idTipoQuarto;
        select.innerHTML += `<option value="${id}">${t.nome_tipoQuarto}</option>`;
    });
}

function iniciarEdicaoTipo(dadosCodificados) {
    const t = JSON.parse(decodeURIComponent(dadosCodificados));
    const id = t.idTipo_Quarto || t.idTipoQuarto;
    
    document.getElementById('id_tipo_quarto').value = id;
    document.getElementById('nome_tipo').value = t.nome_tipoQuarto;
    document.getElementById('preco_base').value = t.valor_base;
    document.getElementById('limite_adultos').value = t.limite_adultos;
    document.getElementById('limite_criancas').value = t.limite_criancas;

    document.getElementById('btn-salvar-tipo').textContent = 'Salvar Alterações';
    document.getElementById('btn-cancelar-tipo').classList.remove('d-none');
}

function cancelarEdicaoTipo() {
    document.getElementById('form-tipo-quarto').reset();
    document.getElementById('id_tipo_quarto').value = '';
    document.getElementById('btn-salvar-tipo').textContent = 'Adicionar Novo';
    document.getElementById('btn-cancelar-tipo').classList.add('d-none');
}

async function salvarTipoQuarto(event) {
    event.preventDefault();
    const alerta = document.getElementById('alerta-tipo-quarto');
    const id = document.getElementById('id_tipo_quarto').value;
    
    const dados = {
        nome_tipoQuarto: document.getElementById('nome_tipo').value,
        valor_base: parseFloat(document.getElementById('preco_base').value),
        limite_adultos: parseInt(document.getElementById('limite_adultos').value),
        limite_criancas: parseInt(document.getElementById('limite_criancas').value)
    };

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3000/api/v1/tipos_quarto/${id}` : 'http://localhost:3000/api/v1/tipos_quarto'; 

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alerta.className = 'alert alert-success small p-2 text-center mt-2';
            alerta.textContent = id ? 'Categoria atualizada com sucesso!' : 'Categoria criada!';
            alerta.classList.remove('d-none');
            cancelarEdicaoTipo();
            carregarTiposQuarto();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-2';
            alerta.textContent = 'Erro ao salvar categoria.';
            alerta.classList.remove('d-none');
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-2';
        alerta.textContent = 'Erro de conexão.';
        alerta.classList.remove('d-none');
    }
}


// ==========================================
// QUARTOS FÍSICOS
// ==========================================

async function carregarQuartosFisicos() {
    const tbody = document.getElementById('tabela-quartos');
    if (!tbody) return;

    try {
        const resposta = await fetch('http://localhost:3000/api/v1/quartos');
        
        if (resposta.ok) {
            const json = await resposta.json();
            const quartos = json.dados || [];
            
            tbody.innerHTML = '';
            if (quartos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-muted text-center">Nenhum quarto cadastrado.</td></tr>';
                return;
            }

            quartos.forEach(q => {
                const dadosStr = encodeURIComponent(JSON.stringify(q));
                const numQuarto = q.num_quarto || q.numero_quarto;
                const nomeCategoria = q.nome_tipoQuarto || ('Cat. ID: ' + (q.idTipoQuarto || q.idTipo_Quarto));

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">Nº ${numQuarto}</td>
                        <td>${nomeCategoria}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-info py-0" onclick="iniciarEdicaoQuarto('${dadosStr}')">Editar</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            console.error("Erro na resposta da API de quartos:", resposta.status);
            tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center">Erro no servidor (500). Verifique o app.py.</td></tr>';
        }
    } catch (erro) {
        console.error("Erro de conexão ao carregar quartos:", erro);
        tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center">Erro de conexão com o servidor.</td></tr>';
    }
}

function iniciarEdicaoQuarto(dadosCodificados) {
    const q = JSON.parse(decodeURIComponent(dadosCodificados));
    
    document.getElementById('id_quarto').value = q.idQuarto;
    document.getElementById('numero_quarto').value = q.num_quarto;
    document.getElementById('select_tipo_quarto').value = q.idTipoQuarto || q.idTipo_Quarto;

    document.getElementById('btn-salvar-quarto').textContent = 'Salvar';
    document.getElementById('btn-cancelar-quarto').classList.remove('d-none');
}

function cancelarEdicaoQuarto() {
    document.getElementById('form-quarto').reset();
    document.getElementById('id_quarto').value = '';
    document.getElementById('btn-salvar-quarto').textContent = 'Salvar';
    document.getElementById('btn-cancelar-quarto').classList.add('d-none');
}

async function salvarQuarto(event) {
    event.preventDefault();
    const alerta = document.getElementById('alerta-quarto');
    const id = document.getElementById('id_quarto').value;
    
    const dados = {
        num_quarto: parseInt(document.getElementById('numero_quarto').value),
        idTipoQuarto: parseInt(document.getElementById('select_tipo_quarto').value)
    };

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3000/api/v1/quartos/${id}` : 'http://localhost:3000/api/v1/quartos';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alerta.className = 'alert alert-success small p-2 text-center mt-2';
            alerta.textContent = id ? 'Quarto atualizado!' : 'Quarto criado!';
            alerta.classList.remove('d-none');
            cancelarEdicaoQuarto();
            carregarQuartosFisicos();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-2';
            alerta.textContent = 'Erro ao salvar quarto.';
            alerta.classList.remove('d-none');
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-2';
        alerta.textContent = 'Erro de conexão.';
        alerta.classList.remove('d-none');
    }
}


// ==========================================
// SALAS DE CONFERÊNCIA
// ==========================================

async function carregarSalas() {
    try {
        const resposta = await fetch('http://localhost:3000/api/v1/salas');
        if (resposta.ok) {
            const json = await resposta.json();
            const salas = json.dados || [];
            const tbody = document.getElementById('tabela-salas');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            if (salas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center">Nenhuma sala cadastrada.</td></tr>';
            } else {
                salas.forEach(s => {
                    const dadosStr = encodeURIComponent(JSON.stringify(s));
                    tbody.innerHTML += `
                        <tr>
                            <td class="text-start fw-bold">${s.nome_salaConferencia}</td>
                            <td>${s.capacidade_maxima} p.</td>
                            <td>R$ ${parseFloat(s.valor_turno || 0).toFixed(2)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-success py-0" onclick="iniciarEdicaoSala('${dadosStr}')">Editar</button>
                            </td>
                        </tr>
                    `;
                });
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar salas:", erro);
    }
}

function iniciarEdicaoSala(dadosCodificados) {
    const s = JSON.parse(decodeURIComponent(dadosCodificados));
    const id = s.idSala_Conferencia || s.idSala;
    
    document.getElementById('id_sala').value = id;
    document.getElementById('nome_sala').value = s.nome_salaConferencia;
    document.getElementById('capacidade_sala').value = s.capacidade_maxima;
    document.getElementById('preco_sala').value = s.valor_turno;

    document.getElementById('btn-salvar-sala').textContent = 'Salvar Alterações';
    document.getElementById('btn-cancelar-sala').classList.remove('d-none');
}

function cancelarEdicaoSala() {
    document.getElementById('form-sala-conferencia').reset();
    document.getElementById('id_sala').value = '';
    document.getElementById('btn-salvar-sala').textContent = 'Adicionar Nova';
    document.getElementById('btn-cancelar-sala').classList.add('d-none');
}

async function salvarSala(event) {
    event.preventDefault();
    const alerta = document.getElementById('alerta-sala');
    const id = document.getElementById('id_sala').value;
    
    const dados = {
        nome_salaConferencia: document.getElementById('nome_sala').value,
        capacidade_maxima: parseInt(document.getElementById('capacidade_sala').value),
        valor_turno: parseFloat(document.getElementById('preco_sala').value)
    };

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3000/api/v1/salas/${id}` : 'http://localhost:3000/api/v1/salas'; 

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alerta.className = 'alert alert-success small p-2 text-center mt-2';
            alerta.textContent = id ? 'Sala atualizada!' : 'Sala cadastrada!';
            alerta.classList.remove('d-none');
            cancelarEdicaoSala();
            carregarSalas();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-2';
            alerta.textContent = 'Erro ao salvar sala.';
            alerta.classList.remove('d-none');
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-2';
        alerta.textContent = 'Erro de conexão.';
        alerta.classList.remove('d-none');
    }
}