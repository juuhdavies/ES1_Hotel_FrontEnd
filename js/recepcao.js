// Variável global para guardar os dados dos quartos carregados do mapa
let mapaQuartosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarMapa();

    document.getElementById('filtro-data-mapa').addEventListener('change', carregarMapa);

    const formCheckin = document.getElementById('form-checkin');
    if (formCheckin) formCheckin.addEventListener('submit', realizarCheckin);

    const formCheckout = document.getElementById('form-checkout');
    if (formCheckout) formCheckout.addEventListener('submit', realizarCheckout);

    // Evento para atualizar os valores visuais quando o recepcionista escolhe o quarto no checkout
    const selectCheckout = document.getElementById('quarto_checkout');
    if (selectCheckout) {
        selectCheckout.addEventListener('change', atualizarValoresCheckout);
    }
});

async function carregarMapa() {
    const dataFiltro = document.getElementById('filtro-data-mapa').value || new Date().toISOString().split('T')[0];
    
    try {
        const resposta = await fetch(`http://127.0.0.1:5000/api/v1/mapa?data_filtro=${dataFiltro}`);
        const quartos = await resposta.json();
        
        mapaQuartosCache = quartos; // Guarda no cache para consultar depois
        
        const tbody = document.getElementById('tabela-mapa');
        const selectCheckin = document.getElementById('quarto_alocado');
        const selectCheckout = document.getElementById('quarto_checkout');
        
        tbody.innerHTML = '';
        selectCheckin.innerHTML = '<option value="" disabled selected>Selecione um quarto livre...</option>';
        selectCheckout.innerHTML = '<option value="" disabled selected>Selecione um quarto ocupado...</option>';

        // Preenche a tabela e os selects com base no status dos quartos
        quartos.forEach(q => {
            let badgeClass = q.status === 'Livre' ? 'bg-success' : (q.status === 'Reservado' ? 'bg-warning text-dark' : 'bg-danger');
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${q.numero_quarto}</td>
                    <td><span class="badge ${badgeClass}">${q.status}</span></td>
                    <td>${q.nome_hospede || '-'}</td>
                    <td>${q.previsao_checkout || '-'}</td>
                </tr>
            `;

            if (q.status === 'Livre') {
                selectCheckin.innerHTML += `<option value="${q.numero_quarto}">Quarto ${q.numero_quarto}</option>`;
            }

            if (q.status === 'Ocupado') {
                // Passamos o ID ou número do quarto no value
                selectCheckout.innerHTML += `<option value="${q.numero_quarto}">Quarto ${q.numero_quarto} (${q.nome_hospede})</option>`;
            }
        });

        // Reseta os campos visuais de preço ao recarregar o mapa
        document.getElementById('info-consumo').textContent = 'R$ 0.00';
        document.getElementById('info-total').textContent = 'R$ 0.00';

    } catch (erro) {
        console.error("Erro ao carregar mapa:", erro);
    }
}

// Função executada quando o recepcionista escolhe um quarto no Check-out
function atualizarValoresCheckout() {
    const numeroQuartoSelecionado = parseInt(document.getElementById('quarto_checkout').value);
    
    // Procura o quarto correspondente nos dados que vieram do banco de dados
    const quartoEncontrado = mapaQuartosCache.find(q => q.numero_quarto === numeroQuartoSelecionado);

    if (quartoEncontrado) {
        // Assume que a API retorna os campos 'valor_consumo' e 'valor_total' (ou calcula na hora)
        // Valor consumo seria pra quando o hospede faz "compras" de itens não inclusos na hospedagem e é somado ao valor de consumo a cada "compra"
        const consumo = quartoEncontrado.valor_consumo || 0.0;
        const total = quartoEncontrado.valor_total || consumo; // Soma da hospedagem + consumo vinda do BD

        document.getElementById('info-consumo').textContent = `€ ${consumo.toFixed(2)}`;
        document.getElementById('info-total').textContent = `€ ${total.toFixed(2)}`;
    }
}

async function realizarCheckout(event) {
    event.preventDefault();
    const alerta = document.getElementById('alerta-checkout');

    const dados = {
        numero_quarto: parseInt(document.getElementById('quarto_checkout').value)
    };

    // Envia os dados para a API do Back-end para processar o check-out
    try {
        const resposta = await fetch('http://127.0.0.1:5000/api/v1/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        // Atualiza a interface com base na resposta da API
        if (resposta.ok) {
            alerta.className = 'alert alert-success small p-2 text-center mt-3';
            alerta.textContent = 'Check-out processado com sucesso!';
            document.getElementById('form-checkout').reset();
            document.getElementById('info-consumo').textContent = 'R$ 0.00';
            document.getElementById('info-total').textContent = 'R$ 0.00';
            carregarMapa(); 
        } else {
            alerta.className = 'alert alert-danger small p-2 text-center mt-3';
            alerta.textContent = 'Erro ao processar a saída.';
        }
    } catch (erro) {
        alerta.className = 'alert alert-danger small p-2 text-center mt-3';
        alerta.textContent = 'Erro de conexão com o servidor.';
    }
}