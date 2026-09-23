// ====== CONFIGURAÇÃO — troque estes dois valores ======
const WORKER_URL = "https://SEU-WORKER.SEU-USUARIO.workers.dev";
const EXTENSION_ID = "SUA_EXTENSION_ID_AQUI"; // pegue em chrome://extensions depois de instalar
// =========================================================

async function fetchJSON(path) {
  const res = await fetch(`${WORKER_URL}${path}`);
  if (!res.ok) throw new Error(`Erro ${res.status} ao consultar ${path}`);
  return res.json();
}

// Envia id/senha/link para a extensão preencher na aba de destino
function acessarConta({ id, senha, link }) {
  if (!window.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
    alert("Extensão Multilogin Autofill não encontrada neste navegador.");
    return;
  }
  chrome.runtime.sendMessage(
    EXTENSION_ID,
    { type: "MULTILOGIN_FILL", payload: { id, senha, url: link || null } },
    (response) => {
      if (chrome.runtime.lastError) {
        alert(
          "Não foi possível falar com a extensão: " +
            chrome.runtime.lastError.message +
            "\nVerifique se ela está instalada e se o EXTENSION_ID em app.js está correto."
        );
        return;
      }
      if (!response || !response.ok) {
        alert("A extensão recebeu a chamada mas retornou um erro.");
      }
    }
  );
}
