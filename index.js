const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true })); // Middleware para processar dados de formulário

app.get('/', (req, res) => {
  fs.readFile('vacilos.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo JSON:', err);
      return res.status(500).send('Erro ao ler o arquivo JSON');
    }

    try {
      const vacilos = JSON.parse(data);

      let dropdownOptions = '<select id="motivo" name="motivo">';
      dropdownOptions += '<option value="" selected disabled>Escolha o motivo da devolução</option>';

      vacilos.vacilos.forEach((vacilo) => {
        dropdownOptions += `<option value="${vacilo.tipo}">${vacilo.descricao}</option>`;
      });
      dropdownOptions += '</select>';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Devolução imotivada AOF</title>
          <style>
            /* Estilos para a página principal */
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1, h2 {
              text-align: center;
            }
            form {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            select {
              margin-bottom: 10px;
              padding: 5px;
              width: 300px;
            }
            input {
              margin-bottom: 10px;
              padding: 5px;
              width: 200px;
            }
            textarea {
              margin-bottom: 10px;
              padding: 5px;
              width: 500px;
            }
            button {
              padding: 10px 20px;
              background-color: #007bff;
              color: white;
              border: none;
              cursor: pointer;
              border-radius: 5px;
            }
            button:hover {
              background-color: #0056b3;
            }
            .result-container {
              margin-top: 30px;
              border: 1px solid #ccc;
              padding: 20px;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <h1>AOF - Devoluções imotivadas</h1>
          <h2>Gerador de respostas</h2>
          <form action="/enviar" method="post">
            ${dropdownOptions}
            <div id="numeroAOF" style="display: none;">
              <label for="numero_aof">Número AOF:</label>
              <input style="min-width=15%" type="text" id="numero_aof" name="numero_aof" pattern="[0-9]{4}/[0-9]{9}" placeholder="0000/000000000">
            </div>
            <div id="justificativa" style="display: none;">
              <label for="justificativa_pso">Justificativa da PSO/CENOP:</label><br/>
              <textarea style="min-width: 50%" id="justificativa_pso" name="justificativa_pso"></textarea>
              
            </div>
            <div id="botao_enviar" style="display: none;">
              <button type="submit">Enviar</button>
            </div>
            
          </form>
          <div class="result-container"></div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const dropdown = document.getElementById('motivo');
              const numeroAOF = document.getElementById('numeroAOF');
              const justificativa = document.getElementById('justificativa');

              dropdown.addEventListener('change', function() {
                if (dropdown.value !== '') {
                  numeroAOF.style.display = (dropdown.value !== '') ? 'block' : 'none';
                  justificativa.style.display = (dropdown.value !== '') ? 'block' : 'none';
                  botao_enviar.style.display = (dropdown.value !== '') ? 'block' : 'none';
                }
              });
            });

            function copyToClipboard() {
              const resultContainer = document.querySelector('.result-container');
              const range = document.createRange();
              range.selectNode(resultContainer.lastChild);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(range);
              document.execCommand('copy');
              window.getSelection().removeAllRanges();
              alert('Texto copiado para a área de transferência!');
            }
          </script>
        </body>
        </html>
      `;

      res.send(htmlContent);
    } catch (error) {
      console.error('Erro ao processar o arquivo JSON:', error);
      res.status(500).send('Erro ao processar o arquivo JSON');
    }
  });
});

app.post('/enviar', (req, res) => {
  const motivoSelecionado = req.body.motivo;
  const numeroAOF = req.body.numero_aof;
  const justificativa = req.body.justificativa_pso;

  fs.readFile('vacilos.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo JSON:', err);
      return res.status(500).send('Erro ao ler o arquivo JSON');
    }

    try {
      const vacilos = JSON.parse(data);
      let textoEquivalente = '';

      vacilos.vacilos.forEach((vacilo) => {
        if (vacilo.tipo === motivoSelecionado) {
          textoEquivalente = vacilo.texto;
        }
      });

      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
          <meta charset="UTF-8">
          <title>Resultado</title>
          <style>
            /* Estilos para a página de resultado */
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1, h2 {
              text-align: center;
            }
            .result-container {
              margin-top: 30px;
              border: 1px solid #ccc;
              padding: 20px;
              border-radius: 5px;
            }
            .copy-button {
              padding: 10px 20px;
              background-color: #007bff;
              color: white;
              border: none;
              cursor: pointer;
              border-radius: 5px;
              margin-top: 10px;
            }
            .copy-button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <h1>Resultado</h1>
          <div class="result-container">
            <p>O AOF ${numeroAOF} foi devolvido sob a seguinte justificativa:</p>
            <p>Justificativa da PSO/CENOP:<br/><i>${justificativa}</i></p>
            <p id="resultText">${textoEquivalente}</p>
            <button class="copy-button" onclick="copyToClipboard()">Copiar Texto</button>
          </div>
          <script>
          function copyToClipboard() {
            const resultContainer = document.querySelector('.result-container');
            const range = document.createRange();
          
            // Selecionar o texto dentro da div .result-container
            range.selectNodeContents(resultContainer);
          
            // Obter um array com os nós de texto no elemento selecionado
            const childNodes = Array.from(resultContainer.childNodes);
          
            // Remover o primeiro nó (representando a primeira linha)
            if (childNodes.length > 0) {
              range.setStartAfter(childNodes[0]);
            }
          
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            alert('Texto copiado para a área de transferência, excluindo a primeira linha!');
          }
          </script>
        </body>
        </html>
      `;

      res.send(htmlResponse);
    } catch (error) {
      console.error('Erro ao processar o arquivo JSON:', error);
      res.status(500).send('Erro ao processar o arquivo JSON');
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
