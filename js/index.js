document.addEventListener('DOMContentLoaded', () => {
    carregarVitrineQuartos();
});

async function carregarVitrineQuartos() {
    const container = document.getElementById('lista-quartos');
    if (!container) return;

    try {
        // Chamada GET para buscar os quartos ou tipos de quarto disponíveis
        const resposta = await fetch('http://localhost:3000/api/v1/quartos');
        
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
                container.innerHTML += `
                    <div class="col-md-4">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body d-flex flex-column">
                                <h5 class="fw-bold text-dark">Quarto ${q.num_quarto || q.numero_quarto}</h5>
                                <p class="text-muted small mb-2">Categoria: ${q.nome_tipoQuarto || 'Standard'}</p>
                                <p class="text-primary fw-bold fs-5 mb-4">€ ${q.valor_base ? q.valor_base.toFixed(2) : '100.00'} <span class="small text-muted fw-normal">/ noite</span></p>
                                <div class="mt-auto">
                                    <a href="reservas.html" class="btn btn-outline-primary w-100 btn-sm">Reservar Este</a>
                                </div>
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