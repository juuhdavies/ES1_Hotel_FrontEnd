document.addEventListener('DOMContentLoaded', () => {
    carregarSelectCategorias();

    const formReserva = document.getElementById('form-reserva');
    if (formReserva) {
        formReserva.addEventListener('submit', enviarReserva);
    }
});

// Busca os tipos de quarto para preencher o select
async function carregarSelectCategorias() {
    const select = document.getElementById('tipo_quarto');
    if (!select) return;

    try {
        const resposta = await fetch('http://localhost:3000/api/v1/tipos_quarto');
        
        if (resposta.ok) {
            const json = await resposta.json();
            const tipos = json.dados || [];
            
            select.innerHTML = '<option value="" disabled selected>Selecione a categoria desejada...</option>';

            tipos.forEach(t => {
                const id = t.idTipo_Quarto || t.idTipoQuarto;
                const preco = parseFloat(t.valor_base || 0).toFixed(2);

                select.innerHTML += `<option value="${id}">${t.nome_tipoQuarto} - € ${preco} por noite</option>`;
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

    // 1. Recupera o cliente logado do localStorage
    const clienteLogado = JSON.parse(localStorage.getItem('cliente_logado') || '{}');
    const idCliente = clienteLogado.idCliente || clienteLogado.id;

    if (!idCliente) {
        alert("Você precisa estar logado como cliente para realizar uma reserva!");
        window.location.href = "login_cliente.html";
        return;
    }

    // CAPTURA OS VALORES DOS CAMPOS DO FORMULÁRIO
    const idTipoQuarto = document.getElementById('tipo_quarto')?.value;
    const dataCheckIn = document.getElementById('checkin')?.value;
    const dataCheckOut = document.getElementById('checkout')?.value;
    const qntAdultos = parseInt(document.getElementById('adultos')?.value || 1);
    const qntCriancas = parseInt(document.getElementById('criancas')?.value || 0);
    const cafeManha = document.getElementById('cafe_manha')?.checked || false;



    // Validação do Tipo de Quarto selecionado
    if (!idTipoQuarto || idTipoQuarto === "undefined") {
        alert("Por favor, selecione uma categoria de quarto válida.");
        return;
    }

    // Monta o objeto exatamente como a API espera
    const dadosReserva = {
        idCliente: idCliente,
        idTipoQuarto: parseInt(idTipoQuarto),
        data_checkin: dataCheckIn,
        data_checkout: dataCheckOut,
        qnt_adultos: qntAdultos,
        qnt_criancas: qntCriancas,
        cafe_manha: cafeManha ? 1 : 0
    };

        console.log("Dados que serão enviados para a API:", dadosReserva);

    try {
        const resposta = await fetch('http://localhost:3000/api/v1/reservas', {
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
            const erroJson = await resposta.json();
            alert(erroJson.mensagem || 'Não foi possível concluir a reserva. Verifique os dados e tente novamente.');
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert('Erro de conexão com o servidor ao tentar registrar a reserva.');
    }
}