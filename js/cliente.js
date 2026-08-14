document.addEventListener('DOMContentLoaded', () => {
    const clienteLogadoJson = localStorage.getItem('cliente_logado');
    
    if (!clienteLogadoJson) {
        // Se não estiver logado, redireciona para a página de login
        // (Certifique-se de que o nome é 'login.html' ou 'login_cliente.html')
        window.location.href = 'login.html';
        return;
    }

    // 1. Carrega as reservas associadas a este cliente (resgate automático no localStorage)
    carregarReservasCliente();

    // 2. Botão de Terminar Sessão (Logout)
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('cliente_logado');
            window.location.href = 'login.html';
        });
    }
});

async function carregarReservasCliente(idClienteParam) {
    const tbody = document.getElementById('tabela-minhas-reservas');
    if (!tbody) return;

    let idCliente = idClienteParam;
    if (!idCliente) {
        const clienteLogado = JSON.parse(localStorage.getItem('cliente_logado') || '{}');
        idCliente = clienteLogado.idCliente || clienteLogado.id || clienteLogado.id_cliente;
    }

    if (!idCliente) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">Sessão expirada. Faça login para visualizar suas reservas.</td></tr>';
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/api/v1/clientes/${idCliente}/reservas`);
        
        if (resposta.ok) {
            const json = await resposta.json();
            const reservas = json.dados || json;

            if (!Array.isArray(reservas) || reservas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Ainda não possui reservas registradas.</td></tr>';
                return;
            }

            let htmlLinhas = '';

            reservas.forEach(r => {
                const idReserva = r.idReserva_Hospedagem || r.idReserva || r.numero_reserva || '---';
                const tipoQuarto = r.nome_tipoQuarto || 'Acomodação Standard';
                const status = r.status || r.estado || 'RESERVADO';

                const formatarData = (dataStr) => {
                    if (!dataStr) return '---';
                    const dataLimpa = String(dataStr).split('T')[0];
                    const partes = dataLimpa.split('-');
                    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
                };

                let badgeClass = 'bg-secondary';
                const stUpper = String(status).toUpperCase();

                if (['RESERVADO', 'CONFIRMADA', 'CONFIRMADO'].includes(stUpper)) {
                    badgeClass = 'bg-success';
                } else if (['HOSPEDADO', 'EM ANDAMENTO'].includes(stUpper)) {
                    badgeClass = 'bg-info text-dark';
                } else if (['FINALIZADO', 'CONCLUÍDA', 'CONCLUIDO'].includes(stUpper)) {
                    badgeClass = 'bg-primary';
                } else if (['CANCELADO', 'CANCELADA'].includes(stUpper)) {
                    badgeClass = 'bg-danger';
                }

                // Cria o botão de cancelar apenas se a reserva puder ser cancelada
                let botaoAcao = '<span class="text-muted small">-</span>';
                if (['RESERVADO', 'CONFIRMADA', 'CONFIRMADO'].includes(stUpper)) {
                    botaoAcao = `
                        <button class="btn btn-sm btn-outline-danger" onclick="cancelarReserva(${idReserva})">
                            Cancelar
                        </button>
                    `;
                }

                htmlLinhas += `
                    <tr>
                        <td class="fw-bold text-primary">#${idReserva}</td>
                        <td>${tipoQuarto}</td>
                        <td>${formatarData(r.data_CheckIn)}</td>
                        <td>${formatarData(r.data_CheckOut)}</td>
                        <td><span class="badge ${badgeClass}">${status}</span></td>
                        <td>${botaoAcao}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = htmlLinhas;

        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar o histórico de reservas.</td></tr>';
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Falha de comunicação com o servidor.</td></tr>';
    }
}

async function cancelarReserva(idReserva) {
    if (!confirm(`Tem certeza de que deseja cancelar a reserva #${idReserva}?`)) {
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/api/v1/reservas/${idReserva}/cancelar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            alert("Reserva cancelada com sucesso!");
            carregarReservasCliente(); // Recarrega a lista para atualizar a tela
        } else {
            alert(resultado.mensagem || resultado.erro || "Não foi possível cancelar a reserva.");
        }
    } catch (erro) {
        console.error("Erro ao cancelar reserva:", erro);
        alert("Falha de conexão com o servidor ao tentar cancelar.");
    }
}