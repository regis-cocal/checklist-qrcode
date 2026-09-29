/*
  CONFIGURAÇÃO DO FORMULÁRIO

  1) Gere novamente a URL/SAS do seu gatilho HTTP no Power Automate.
  2) Cole a nova URL abaixo.
  3) NÃO publique esse arquivo com a URL real em repositório público.
     Se usar GitHub, prefira uma solução/proxy seguro para manter o endpoint fora
     do código público. Para testes internos, este arquivo pode ser usado localmente.

  O formulário usa UM ÚNICO endpoint e a propriedade "acao" para decidir:
    - buscar = consultar SELECT_COLABORADORES
    - gravar = criar item em CHECKLIST_EQUIPAMENTOS_QRCODE
*/

window.APP_CONFIG = {
  POWER_AUTOMATE_URL: "https://default9b4fb990c47449baaeeb0ea15270b2.9a.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/12/workflows/7772bd1ae2804feeafb18e6d75cf8ceb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Qtnq5QJOhEjtnjDHxw9d8J7kOG1LDKTjH8sJi1erJsE",

  // Modo de demonstração: true = usa dados simulados e NÃO chama o Power Automate.
  // Deixe false em produção.
  MOCK_MODE: false,

  // Tempo máximo de espera de cada chamada HTTP.
  REQUEST_TIMEOUT_MS: 15000
};
