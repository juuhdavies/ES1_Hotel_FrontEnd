document.addEventListener('DOMContentLoaded', () => {
    const clienteLogadoJson = localStorage.getItem('cliente_logado');
    
    if (!clienteLogadoJson) {
        // Se não estiver logado, redireciona para a página de login
        window.location.href = 'login.html';
        return;
    }

    const cliente = JSON.parse(clienteLogadoJson);
    
    // 2. Carrega as reservas associadas a este cliente
    carregarReservasCliente(cliente.id_cliente || cliente.id);

    // 3. Botão de Terminar Sessão (Logout)
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('cliente_logado');
            window.location.href = 'login.html';
        });
    }
});

async function carregarReservasCliente(idCliente) {
    const tbody = document.getElementById('tabela-minhas-reservas');
    if (!tbody) return;

    try {
        // Requisição GET para a API passando o ID do cliente logado
        const resposta = await fetch(`http://127.0.0.1:5000/api/v1/clientes/${idCliente}/reservas`);
        
        if (resposta.ok) {
            const reservas = await resposta.json();
            tbody.innerHTML = '';

            if (reservas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Ainda não possui reservas registadas.</td></tr>';
                return;
            }

            reservas.forEach(r => {
                let badgeClass = 'bg-secondary';
                if (r.estado === 'Confirmada') badgeClass = 'bg-success';
                else if (r.estado === 'Concluída') badgeClass = 'bg-primary';
                else if (r.estado === 'Cancelada') badgeClass = 'bg-danger';

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-primary">#${r.idReserva || r.numero_reserva}</td>
                        <td>${r.nome_tipoQuarto || 'Acomodação Standard'}</td>
                        <td>${r.data_in}</td>
                        <td>${r.data_out}</td>
                        <td><span class="badge ${badgeClass}">${r.estado || 'Ativa'}</span></td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar o histórico de reservas.</td></tr>';
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Falha de comunicação com o servidor.</td></tr>';
    }
}