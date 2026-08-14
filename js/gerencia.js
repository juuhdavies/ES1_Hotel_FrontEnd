document.addEventListener('DOMContentLoaded', () => {
    // FATURAMENTO 
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
        buscarFaturamento(); // Carrega o faturamento ao abrir a página
    }

    // GESTÃO DE ESTRUTURA 
    carregarTiposQuarto(); 
    carregarQuartosFisicos();
    carregarSalas();

    const formTipoQuarto = document.getElementById('form-tipo-quarto');
    if (formTipoQuarto) formTipoQuarto.addEventListener('submit', salvarTipoQuarto);

    const formQuarto = document.getElementById('form-quarto');
    if (formQuarto) formQuarto.addEventListener('submit', salvarQuarto);

    const formSala = document.getElementById('form-sala-conferencia');
    if (formSala) formSala.addEventListener('submit', salvarSala);
});


// FATURAMENTO

async function buscarFaturamento(event) {
    if (event) event.preventDefault();

    const dataInicio = document.getElementById('data_inicio').value;
    const dataFim = document.getElementById('data_fim').value;

    try {
        const resposta = await fetch(`http://localhost:3000/api/v1/faturamento?data_inicio=${dataInicio}&data_fim=${dataFim}`); // Pega os dados de faturamento do back-end com base nas datas fornecidas
        
        if (resposta.ok) {
            const json = await resposta.json();
            const relatorio = json.relatorio;

            // Atualiza os elementos visuais com os valores retornados pela API
            document.getElementById('valor-hospedagem').textContent = `R$ ${parseFloat(relatorio.total_diarias).toFixed(2)}`;
            document.getElementById('valor-salas').textContent = `R$ ${parseFloat(relatorio.total_consumo).toFixed(2)}`;
            document.getElementById('valor-total').textContent = `R$ ${parseFloat(relatorio.faturamento_total).toFixed(2)}`;
        } else {
            console.error("Erro ao buscar dados de faturamento");
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}


// TIPOS DE QUARTO

async function carregarTiposQuarto() {
    try {
        const resposta = await fetch('http://localhost:3000/api/v1/tipos_quarto'); // Pega os tipos de quarto do back-end
        const tipos = await resposta.json();
        const tbody = document.getElementById('tabela-tipos-quarto'); 
        if (!tbody) return;
        
        tbody.innerHTML = '';

        // Preenche a tabela de tipos de quarto com os dados retornados pela API
        tipos.forEach(t => {
            const dadosStr = encodeURIComponent(JSON.stringify(t)); 
            tbody.innerHTML += `
                <tr>
                    <td class="text-start fw-bold">${t.nome_tipoQuarto}</td>
                    <td>€ ${t.valor_base.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary py-0" onclick="iniciarEdicaoTipo('${dadosStr}')">Editar</button>
                    </td>
                </tr>
            `;
        });

        // Atualiza a caixa de seleção na aba de Quartos 
        atualizarSelectTipos(tipos);
    } catch (erro) {
        console.error("Erro ao carregar tipos de quarto", erro);
    }
}

function atualizarSelectTipos(tipos) {
    const select = document.getElementById('select_tipo_quarto');
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled selected>Selecione a categoria...</option>';
    tipos.forEach(t => {
        select.innerHTML += `<option value="${t.idTipoQuarto}">${t.nome_tipoQuarto}</option>`;
    });
}

function iniciarEdicaoTipo(dadosCodificados) {
    const t = JSON.parse(decodeURIComponent(dadosCodificados));
    
    // Preenche o formulário com os dados do tipo de quarto selecionado para edição
    document.getElementById('id_tipo_quarto').value = t.idTipoQuarto;
    document.getElementById('nome_tipo').value = t.nome_tipoQuarto;
    document.getElementById('preco_base').value = t.valor_base;
    document.getElementById('limite_adultos').value = t.limite_adultos;
    document.getElementById('limite_criancas').value = t.limite_criancas;

    document.getElementById('btn-salvar-tipo').textContent = 'Salvar';
    document.getElementById('btn-cancelar-tipo').classList.remove('d-none');
}

function cancelarEdicaoTipo() {
    document.getElementById('form-tipo-quarto').reset();
    document.getElementById('id_tipo_quarto').value = '';
    document.getElementById('btn-salvar-tipo').textContent = 'Salvar';
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

    const metodo = id ? 'PUT' : 'POST'; // se id existe, é uma atualização , caso contrário, é uma criação 
    const url = id ? `http://localhost:3000/api/v1/tipos_quarto/${id}` : 'http://localhost:3000/api/v1/tipos_quarto'; 

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alerta.className = 'alert alert-success small p-2 text-center mt-2';
            alerta.textContent = id ? 'Categoria atualizada!' : 'Categoria criada!';
            cancelarEdicaoTipo();
            carregarTiposQuarto();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-2';
            alerta.textContent = 'Erro ao salvar.';
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-2';
        alerta.textContent = 'Erro de conexão.';
    }
}


// QUARTOS 

async function carregarQuartosFisicos() {
    try {
        const resposta = await fetch('http://localhost:3000/api/v1/quartos');
        const quartos = await resposta.json();
        const tbody = document.getElementById('tabela-quartos');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        quartos.forEach(q => {
            const dadosStr = encodeURIComponent(JSON.stringify(q));
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${q.num_quarto}</td>
                    <td>${q.nome_tipoQuarto || 'Cat. ' + q.idTipoQuarto}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info py-0" onclick="iniciarEdicaoQuarto('${dadosStr}')">Editar</button>
                    </td>
                </tr>
            `;
        });
    } catch (erro) {
        console.error("Erro ao carregar quartos físicos", erro);
    }
}

function iniciarEdicaoQuarto(dadosCodificados) {
    const q = JSON.parse(decodeURIComponent(dadosCodificados));
    
    document.getElementById('id_quarto').value = q.idQuarto;
    document.getElementById('numero_quarto').value = q.num_quarto;
    document.getElementById('select_tipo_quarto').value = q.idTipoQuarto;

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

    const metodo = id ? 'PUT' : 'POST'; // se id existe, é uma atualização , caso contrário, é uma criação
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
            cancelarEdicaoQuarto();
            carregarQuartosFisicos();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-2';
            alerta.textContent = 'Erro ao salvar.';
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-2';
        alerta.textContent = 'Erro de conexão.';
    }
}


// SALAS DE CONFERÊNCIA

async function carregarSalas() {
    try {
        const resposta = await fetch('http://localhost:3000/api/v1/salas');
        const salas = await resposta.json();
        const tbody = document.getElementById('tabela-salas');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        salas.forEach(s => {
            const dadosStr = encodeURIComponent(JSON.stringify(s));
            tbody.innerHTML += `
                <tr>
                    <td class="text-start fw-bold">${s.nome_salaConferencia}</td>
                    <td>${s.capacidade_maxima}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success py-0" onclick="iniciarEdicaoSala('${dadosStr}')">Editar</button>
                    </td>
                </tr>
            `;
        });
    } catch (erro) {
        console.error("Erro ao carregar salas", erro);
    }
}

function iniciarEdicaoSala(dadosCodificados) {
    const s = JSON.parse(decodeURIComponent(dadosCodificados));
    
    document.getElementById('id_sala').value = s.idSala_Conferencia;
    document.getElementById('nome_sala').value = s.nome_salaConferencia;
    document.getElementById('capacidade_sala').value = s.capacidade_maxima;
    document.getElementById('preco_sala').value = s.valor_turno;

    document.getElementById('btn-salvar-sala').textContent = 'Salvar';
    document.getElementById('btn-cancelar-sala').classList.remove('d-none');
}

function cancelarEdicaoSala() {
    document.getElementById('form-sala-conferencia').reset();
    document.getElementById('id_sala').value = '';
    document.getElementById('btn-salvar-sala').textContent = 'Salvar';
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

    const metodo = id ? 'PUT' : 'POST'; // se id existe, é uma atualização , caso contrário, é uma criação
    const url = id ? `http://localhost:3000/api/v1/salas/${id}` : 'http://localhost:3000/api/v1/salas'; 

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            alerta.className = 'alert alert-success small p-2 text-center mt-2';
            alerta.textContent = id ? 'Sala atualizada!' : 'Sala criada!';
            cancelarEdicaoSala();
            carregarSalas();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-2';
            alerta.textContent = 'Erro ao salvar.';
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-2';
        alerta.textContent = 'Erro de conexão.';
    }
}