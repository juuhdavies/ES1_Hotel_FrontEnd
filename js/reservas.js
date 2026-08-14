document.addEventListener('DOMContentLoaded', () => {
    carregarSelectCategorias();

    const formReserva = document.getElementById('form-reserva');
    if (formReserva) {
        formReserva.addEventListener('submit', enviarReserva);
    }
});

// Busca os tipos de quarto para preencher o forms
async function carregarSelectCategorias() {
    const select = document.getElementById('tipo_quarto');
    if (!select) return;

    try {
        const resposta = await fetch('http://127.0.0.1:5000/api/v1/tipos_quarto');
        
        if (resposta.ok) {
            const tipos = await resposta.json();
            select.innerHTML = '<option value="" disabled selected>Selecione a categoria desejada...</option>';

            tipos.forEach(t => {
                select.innerHTML += `<option value="${t.idTipoQuarto}">${t.nome_tipoQuarto} - € ${t.valor_base.toFixed(2)} por noite</option>`;
            });
        } else {
            select.innerHTML = '<option value="" disabled selected>Erro ao carregar categorias</option>';
        }
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
        select.innerHTML = '<option value="" disabled selected>Erro de conexão com o servidor</option>';
    }
}

// Envia a transação POST para o back-end
async function enviarReserva(event) {
    event.preventDefault();

    // Cria o objeto JSON com os dados preenchidos pelo cliente
    const dadosReserva = {
        nome_cliente: document.getElementById('nome_cliente').value,
        idTipoQuarto: parseInt(document.getElementById('tipo_quarto').value),
        data_in: document.getElementById('data_in').value,
        data_out: document.getElementById('data_out').value,
        adultos: parseInt(document.getElementById('adultos').value),
        criancas: parseInt(document.getElementById('criancas').value),
        com_cafe: document.getElementById('com_cafe').checked
    };

    try {
        const resposta = await fetch('http://127.0.0.1:5000/api/v1/reservas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosReserva)
        });

        if (resposta.ok) {
            alert('Reserva realizada com sucesso!');
            document.getElementById('form-reserva').reset();
            window.location.href = 'index.html';
        } else {
            alert('Não foi possível concluir a reserva. Verifique os dados e tente novamente.');
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert('Erro de conexão com o servidor ao tentar registrar a reserva.');
    }
}