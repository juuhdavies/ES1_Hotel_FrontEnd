// Variáveis globais
let mapaQuartosCache = [];
let reservaAtual = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarMapa();

    const inputFiltro = document.getElementById('filtro-data-mapa');
    if (inputFiltro) inputFiltro.addEventListener('change', carregarMapa);

    // MUDANÇA AQUI: 'input' faz a busca instantaneamente enquanto o usuário digita
    const inputReserva = document.getElementById('id_reserva');
    if (inputReserva) inputReserva.addEventListener('input', buscarDetalhesReserva);

    const formCheckin = document.getElementById('form-checkin');
    if (formCheckin) formCheckin.addEventListener('submit', realizarCheckin);

    const formCheckout = document.getElementById('form-checkout');
    if (formCheckout) formCheckout.addEventListener('submit', realizarCheckout);

    const selectCheckout = document.getElementById('quarto_checkout');
    if (selectCheckout) selectCheckout.addEventListener('change', atualizarValoresCheckout);
});

// Busca a categoria selecionada pelo cliente na reserva
async function buscarDetalhesReserva(event) {
    const idReserva = event.target.value.trim();
    
    // Se o campo estiver vazio, limpa a reserva e renderiza a lista normal
    if (!idReserva) {
        reservaAtual = null;
        renderizarSelectCheckin();
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/api/v1/reservas/${idReserva}`);
        if (resposta.ok) {
            const json = await resposta.json();
            reservaAtual = json.sucesso ? json.reserva : null;
        } else {
            reservaAtual = null;
        }
        renderizarSelectCheckin(); // Atualiza o select de quartos com a prioridade
    } catch (erro) {
        console.error("Erro ao buscar reserva:", erro);
        reservaAtual = null;
        renderizarSelectCheckin();
    }
}

// Renderiza o select do check-in priorizando a categoria da reserva
function renderizarSelectCheckin() {
    const selectCheckin = document.getElementById('quarto_alocado');
    if (!selectCheckin) return;

    selectCheckin.innerHTML = '<option value="" disabled selected>Selecione um quarto livre...</option>';

    // Filtra apenas os quartos livres do mapa
    const quartosLivres = mapaQuartosCache.filter(q => {
        const statusOriginal = (q.statusQuarto || q.status || 'DISPONIVEL').toUpperCase();
        const isOcupado = (statusOriginal === 'OCUPADO' || q.statusReserva === 'HOSPEDADO');
        const isReservado = (statusOriginal === 'RESERVADO'); // Opcional: dependendo da sua regra, se o quarto físico for atrelado antes
        return !isOcupado; // Mostra quartos que não estão ocupados
    });

    if (quartosLivres.length === 0) {
        selectCheckin.innerHTML = '<option value="" disabled>Nenhum quarto livre disponível</option>';
        return;
    }

    // Se houver uma reserva identificada, separa os quartos
    if (reservaAtual && reservaAtual.idTipoQuarto) {
        const idTipo = reservaAtual.idTipoQuarto;
        
        const compativeis = quartosLivres.filter(q => (q.idTipoQuarto || q.idTipo_Quarto) == idTipo);
        const outros = quartosLivres.filter(q => (q.idTipoQuarto || q.idTipo_Quarto) != idTipo);

        // Grupo 1: Quartos Prioritários (Mesmo tipo da reserva)
        if (compativeis.length > 0) {
            let htmlCompativeis = `<optgroup label="⭐ Categoria Reservada (${reservaAtual.nome_tipoQuarto})">`;
            compativeis.forEach(q => {
                const numQuarto = q.num_quarto || q.numero_quarto;
                htmlCompativeis += `<option value="${q.idQuarto}">Quarto ${numQuarto} - ${q.nome_tipoQuarto}</option>`;
            });
            htmlCompativeis += `</optgroup>`;
            selectCheckin.innerHTML += htmlCompativeis;
        }

        // Grupo 2: Outros quartos
        if (outros.length > 0) {
            let htmlOutros = `<optgroup label="Outras Categorias Disponíveis">`;
            outros.forEach(q => {
                const numQuarto = q.num_quarto || q.numero_quarto;
                htmlOutros += `<option value="${q.idQuarto}">Quarto ${numQuarto} - ${q.nome_tipoQuarto}</option>`;
            });
            htmlOutros += `</optgroup>`;
            selectCheckin.innerHTML += htmlOutros;
        }
    } else {
        // Se nenhuma reserva foi digitada ou encontrada, lista todos sem prioridade
        quartosLivres.forEach(q => {
            const numQuarto = q.num_quarto || q.numero_quarto;
            selectCheckin.innerHTML += `<option value="${q.idQuarto}">Quarto ${numQuarto} - ${q.nome_tipoQuarto}</option>`;
        });
    }
}

async function carregarMapa() {
    const inputFiltro = document.getElementById('filtro-data-mapa');
    const dataFiltro = (inputFiltro && inputFiltro.value) ? inputFiltro.value : new Date().toISOString().split('T')[0];

    try {
        const resposta = await fetch(`http://localhost:3000/api/v1/mapa?data_filtro=${dataFiltro}`);
        
        if (resposta.ok) {
            const json = await resposta.json();
            const quartos = json.mapa || json.quartos || [];
            mapaQuartosCache = quartos;

            const tbody = document.getElementById('tabela-mapa');
            const selectCheckout = document.getElementById('quarto_checkout');

            if (tbody) tbody.innerHTML = '';
            if (selectCheckout) selectCheckout.innerHTML = '<option value="" disabled selected>Selecione um quarto ocupado...</option>';

            quartos.forEach(q => {
                const numQuarto = q.num_quarto || q.numero_quarto;
                const statusOriginal = (q.statusQuarto || q.status || 'DISPONIVEL').toUpperCase();
                
                let statusExibicao = 'Livre';
                let badgeClass = 'bg-success';

                if (statusOriginal === 'OCUPADO' || q.statusReserva === 'HOSPEDADO') {
                    statusExibicao = 'Ocupado';
                    badgeClass = 'bg-danger';
                } else if (statusOriginal === 'RESERVADO') {
                    statusExibicao = 'Reservado';
                    badgeClass = 'bg-warning text-dark';
                }

                if (tbody) {
                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold">Quarto ${numQuarto}</td>
                            <td><span class="badge ${badgeClass}">${statusExibicao}</span></td>
                            <td>${q.nome_hospede || '-'}</td>
                            <td>${q.previsao_checkout || '-'}</td>
                        </tr>
                    `;
                }

                if (statusExibicao === 'Ocupado' && selectCheckout) {
                    selectCheckout.innerHTML += `<option value="${q.idReserva_Hospedagem}">Quarto ${numQuarto} (${q.nome_hospede || 'Hóspede'})</option>`;
                }
            });

            const elemConsumo = document.getElementById('info-consumo');
            const elemTotal = document.getElementById('info-total');
            if (elemConsumo) elemConsumo.textContent = 'R$ 0.00';
            if (elemTotal) elemTotal.textContent = 'R$ 0.00';
            
            // Renderiza a lista de check-in assim que o mapa é carregado
            renderizarSelectCheckin();
        }
    } catch (erro) {
        console.error("Erro ao carregar mapa:", erro);
    }
}

async function realizarCheckin(event) {
    event.preventDefault();
    const alerta = document.getElementById('alerta-checkin');

    const idReserva = parseInt(document.getElementById('id_reserva').value);
    const idQuarto = parseInt(document.getElementById('quarto_alocado').value);

    try {
        const resposta = await fetch('http://localhost:3000/api/v1/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idReserva, idQuarto })
        });

        const json = await resposta.json();

        if (resposta.ok && json.sucesso) {
            alerta.className = 'alert alert-success small p-2 text-center mt-3';
            alerta.textContent = 'Check-in realizado com sucesso!';
            document.getElementById('form-checkin').reset();
            reservaAtual = null; // Limpa a reserva logada
            carregarMapa(); // Recarrega o mapa atualizando os status
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-3';
            alerta.textContent = json.mensagem || 'Erro ao realizar check-in.';
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-3';
        alerta.textContent = 'Erro de conexão com o servidor.';
    }
}

function atualizarValoresCheckout() {
    const idReservaSelecionada = parseInt(document.getElementById('quarto_checkout').value);
    const quartoEncontrado = mapaQuartosCache.find(q => q.idReserva_Hospedagem == idReservaSelecionada);

    if (quartoEncontrado) {
        const consumo = parseFloat(quartoEncontrado.valor_Consumacao || 0.0);
        const total = parseFloat(quartoEncontrado.valor_Reserva || 0.0) + consumo;

        const elemConsumo = document.getElementById('info-consumo');
        const elemTotal = document.getElementById('info-total');

        if (elemConsumo) elemConsumo.textContent = `R$ ${consumo.toFixed(2)}`;
        if (elemTotal) elemTotal.textContent = `R$ ${total.toFixed(2)}`;
    }
}

async function realizarCheckout(event) {
    event.preventDefault();
    const alerta = document.getElementById('alerta-checkout');
    const idReserva = parseInt(document.getElementById('quarto_checkout').value);

    try {
        const resposta = await fetch('http://localhost:3000/api/v1/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idReserva })
        });

        const json = await resposta.json();

        if (resposta.ok && json.sucesso) {
            alerta.className = 'alert alert-success small p-2 text-center mt-3';
            alerta.textContent = 'Check-out processado com sucesso!';
            carregarMapa();
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-3';
            alerta.textContent = json.mensagem || 'Erro ao processar saída.';
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-3';
        alerta.textContent = 'Erro de conexão com o servidor.';
    }
}