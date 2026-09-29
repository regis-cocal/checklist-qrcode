# Checklist de Equipamento — QR Code

Projeto estático em HTML + CSS + JavaScript para uso por QR Code, conectado a **um único fluxo do Power Automate**.

## Arquitetura

```text
QR CODE
   ↓
GitHub Pages / hospedagem estática
   ↓
index.html
   ↓
POST JSON
   ↓
Power Automate — único endpoint HTTP
   ├── acao = buscar
   │      ↓
   │   SELECT_COLABORADORES
   │      ↓
   │   retorna matrícula / nome / cargo / local
   │
   └── acao = gravar
          ↓
      CHECKLIST_EQUIPAMENTOS_QRCODE
```

## Estrutura das SharePoint Lists

### SELECT_COLABORADORES

- MATRÍCULA (coluna exibida; internamente `Title`)
- NOME
- CARGO
- LOCAL

### CHECKLIST_EQUIPAMENTOS_QRCODE

- MATRÍCULA (coluna exibida; internamente `Title`)
- NOME
- CARGO
- LOCAL
- DATA
- FROTA
- PROBLEMA_PNEU

## 1. Configurar a URL do Power Automate

Abra `config.js`.

Cole a **nova URL/SAS** do gatilho HTTP do Power Automate:

```js
window.APP_CONFIG = {
  POWER_AUTOMATE_URL: "COLE_A_NOVA_URL_AQUI",
  MOCK_MODE: false,
  REQUEST_TIMEOUT_MS: 15000
};
```

### Segurança

O endpoint em modo `Anyone` usa a URL/SAS como mecanismo de autorização. Portanto:

- Não coloque a URL real em repositório público.
- Não compartilhe a URL em chats ou documentação pública.
- Gere uma nova URL/SAS depois de qualquer vazamento.
- Para produção corporativa, considere colocar uma camada de API/proxy segura na frente do fluxo.

## 2. Payload enviado pelo HTML

### Buscar colaborador

```json
{
  "acao": "buscar",
  "matricula": "2974100"
}
```

Resposta esperada:

```json
{
  "ok": true,
  "matricula": "2974100",
  "nome": "Nome do colaborador",
  "cargo": "Cargo",
  "local": "Local"
}
```

Quando não encontrado:

```json
{
  "ok": false,
  "erro": "Matrícula não encontrada"
}
```

### Gravar checklist

```json
{
  "acao": "gravar",
  "matricula": "2974100",
  "nome": "Nome do colaborador",
  "cargo": "Cargo",
  "local": "Local",
  "frota": "4506358",
  "problema_pneu": "Não"
}
```

Resposta esperada:

```json
{
  "ok": true,
  "mensagem": "Checklist registrado com sucesso."
}
```

O campo `DATA` não é enviado pelo navegador; o fluxo deve preencher com `utcNow()` no momento da criação do item.

## 3. Testar somente a interface

Em `config.js`:

```js
MOCK_MODE: true
```

Assim o site usa dados simulados e não chama o Power Automate.

- Matrícula `0000000` simula matrícula inexistente.
- Qualquer outra matrícula retorna colaborador de demonstração.
- O envio simula sucesso.

Volte para `MOCK_MODE: false` ao conectar o fluxo real.

## 4. Hospedar sem comprar domínio

O projeto é estático. O GitHub Pages publica arquivos HTML/CSS/JavaScript diretamente de um repositório e fornece uma URL `github.io`, sem necessidade de domínio próprio.

### GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `script.js`, `config.js` e os demais arquivos.
3. Em **Settings → Pages**, selecione a branch `main` e a pasta raiz `/`.
4. Publique.
5. Use a URL gerada pelo GitHub Pages no QR Code.

Exemplo:

```text
https://SEU-USUARIO.github.io/checklist-qrcode/
```

O GitHub documenta que GitHub Pages hospeda sites estáticos diretamente de um repositório e que sites de projeto usam a estrutura `https://<owner>.github.io/<repository>`. Pode levar alguns minutos para a publicação ficar disponível.

## 5. CORS — teste obrigatório

O Power Automate funcionou no PowerShell, mas um navegador aplica a política de CORS para chamadas `fetch()`.

Depois de hospedar o HTML, teste:

- Buscar uma matrícula real.
- Enviar um checklist.
- Verificar o histórico do Power Automate.
- Se o navegador mostrar `Failed to fetch` e o fluxo não iniciar, o bloqueio pode ser CORS. Nesse caso, será necessária uma camada intermediária que aceite o navegador e chame o Power Automate no servidor.

O projeto já mostra uma mensagem específica quando o navegador não consegue fazer a chamada.

## 6. Adicionar novas perguntas

A versão inicial implementa:

- Matrícula
- Dados do colaborador
- Frota
- Problema no pneu? (Sim/Não)

Para adicionar novas perguntas, elas precisam entrar em **três lugares**:

1. Interface (`index.html`)
2. Payload de gravação (`script.js`)
3. Esquema JSON do gatilho + ação `Criar item` no Power Automate

Isso mantém o formulário e o banco sincronizados.

## 7. Recomendações de produção

- Use SharePoint List como banco operacional, não Excel.
- Crie índice em `Title`/MATRÍCULA na lista `SELECT_COLABORADORES`.
- Crie índices em `DATA`, `FROTA` e `MATRÍCULA` na lista de respostas.
- Mantenha `DATA` em UTC no fluxo e converta para horário de Brasília na camada de análise.
- Não publique informações de colaboradores no repositório.
- Regenere a URL/SAS se o endpoint for exposto.
