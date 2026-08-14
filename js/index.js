document.addEventListener('DOMContentLoaded', () => {
    carregarVitrineQuartos();
});

async function carregarVitrineQuartos() {
    const container = document.getElementById('lista-quartos');
    if (!container) return;

    try {
        // Chamada GET para buscar os quartos ou tipos de quarto disponíveis
        const resposta = await fetch('http://localhost:3000/api/v1/tipos_quarto');
        
        if (resposta.ok) {
            const json = await resposta.json();
            const quartos = json.dados || []; // Caso a API retorne um objeto com a chave "dados", usamos isso, senão assumimos que é uma lista direta
            container.innerHTML = '';

            if (quartos.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted"><p>Nenhum quarto disponível no momento.</p></div>';
                return;
            }

            quartos.forEach(q => {
                // Cria um card para cada acomodação
                const preco = parseFloat(q.valor_base || 0).toFixed(2);
                container.innerHTML += `
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body d-flex flex-column">
                                <h5 class="fw-bold text-dark">${q.nome_tipoQuarto}</h5>
                                <p class="text-muted small mb-2">
                                    Capacidade: até ${q.limite_adultos} adulto(s) e ${q.limite_criancas} criança(s)
                                </p>
                                <p class="text-primary fw-bold fs-5 mb-4">
                                    $ ${preco} <span class="small text-muted fw-normal">/ noite</span>
                                </p>
                                <a href="reservas.html" class="btn btn-outline-primary w-100 btn-sm">
                                    Fazer Reserva
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<div class="col-12 text-center text-danger"><p>Erro ao carregar as acomodações do servidor.</p></div>';
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
        container.innerHTML = '<div class="col-12 text-center text-danger"><p>Falha na comunicação com o servidor.</p></div>';
    }
}