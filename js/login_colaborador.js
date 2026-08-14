document.addEventListener('DOMContentLoaded', function() {
    const formColaborador = document.getElementById('form-login-colaborador');
    
    if (formColaborador) {
        formColaborador.addEventListener('submit', async function(event) {
            event.preventDefault(); // Impede o recarregamento padrão da página

            const idDigitado = document.getElementById('id').value;
            const senhaDigitada = document.getElementById('senha').value;
            const alertaErro = document.getElementById('alerta-erro-colab');

            try {
                // Envia os dados para a API do Back-end
                const resposta = await fetch('http://localhost:3000/api/v1/login/colaborador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        login: idDigitado,     
                        senha: senhaDigitada    
                    })
                });

                if (resposta.ok) {
                    const dados = await resposta.json();
                    alertaErro.classList.add('d-none');
                    
                    // Salva os dados do funcionário na sessão do navegador
                    const funcionario = json.funcionario;
                    localStorage.setItem('colaborador_logado', JSON.stringify(funcionario));

                    if (funcionario && funcionario.FuncaoFuncionario === 'Gerente') {
                        window.location.href = 'painel_gerencia.html';
                    } else {
                        window.location.href = 'painel_recepcao.html';
                    }
                } else {
                    alertaErro.classList.remove('d-none');
                    alertaErro.textContent = "ID ou senha incorretos.";
                }
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                alertaErro.textContent = "Falha na comunicação com o servidor.";
                alertaErro.classList.remove('d-none');
            }
        });
    }
});