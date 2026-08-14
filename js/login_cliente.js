document.addEventListener('DOMContentLoaded', function() {
    const formCliente = document.getElementById('form-login-cliente');
    
    if (formCliente) {
        formCliente.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const alertaErro = document.getElementById('alerta-erro-cliente');

            try {
                // Envia os dados para a API do Back-end
                const resposta = await fetch('http://localhost:3000/api/v1/login/cliente', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        senha: password
                    })
                });

                if (resposta.ok) {
                    const json = await resposta.json();
                    alertaErro.classList.add('d-none');
                    
                    // Salva a identificação do cliente
                    localStorage.setItem('cliente_logado', JSON.stringify(json.usuario || json.cliente));
                    window.location.href = 'index.html';
                } else {
                    alertaErro.classList.remove('d-none');
                    alertaErro.textContent = "E-mail ou senha incorretos.";
                }
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                alertaErro.textContent = "Falha na comunicação com o servidor.";
                alertaErro.classList.remove('d-none');
            }
        });
    }
});