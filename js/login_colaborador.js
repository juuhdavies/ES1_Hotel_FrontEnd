document.addEventListener('DOMContentLoaded', function() {
    const formColaborador = document.getElementById('form-login-colaborador');
    
    if (formColaborador) {
        formColaborador.addEventListener('submit', async function(event) {
            event.preventDefault();

            const idDigitado = document.getElementById('id').value;
            const senhaDigitada = document.getElementById('senha').value;
            const alertaErro = document.getElementById('alerta-erro-colab');

            try {
                // Envia as credenciais para a API Flask
                const resposta = await fetch('http://localhost:3000/api/v1/login/colaborador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        login: idDigitado,     
                        senha: senhaDigitada    
                    })
                });

                if (resposta.ok) {
                    const json = await resposta.json(); // Corrigido de 'dados' para 'json'
                    alertaErro.classList.add('d-none');
                    
                    // Salva os dados do funcionário no localStorage
                    const funcionario = json.funcionario;
                    localStorage.setItem('colaborador_logado', JSON.stringify(funcionario));

                    // Redireciona com base na função do colaborador
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