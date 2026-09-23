chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "MULTILOGIN_FILL") return;

  const { id, senha, url } = message.payload || {};
  if (!id || !senha) {
    sendResponse({ ok: false, error: "id e senha são obrigatórios" });
    return;
  }

  const injetar = (tabId) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: preencherFormulario,
      args: [id, senha],
    });
  };

  const aguardarCarregarEInjetar = (tabId) => {
    const listener = (updatedTabId, info) => {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        // pequena espera extra para apps que montam o form via JS
        setTimeout(() => injetar(tabId), 400);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  };

  if (url) {
    chrome.tabs.create({ url }, (tab) => aguardarCarregarEInjetar(tab.id));
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) injetar(tabs[0].id);
    });
  }

  sendResponse({ ok: true });
  return true; // mantém o canal aberto para a resposta assíncrona
});

// ---- Executado DENTRO da página de destino (não tem acesso ao escopo acima) ----
function preencherFormulario(id, senha) {
  const senhaField = document.querySelector('input[type="password"]');
  if (!senhaField) {
    console.warn("[Multilogin Autofill] Campo de senha não encontrado nesta página.");
    return;
  }

  // Heurística: pega o último campo de texto/tel visível ANTES do campo de senha
  let idField = null;
  const candidatos = document.querySelectorAll(
    'input[type="text"], input[type="tel"], input[type="email"], input:not([type])'
  );
  candidatos.forEach((el) => {
    const posicao = el.compareDocumentPosition(senhaField);
    const antesDaSenha = posicao & Node.DOCUMENT_POSITION_FOLLOWING;
    const visivel = el.offsetParent !== null;
    if (antesDaSenha && visivel) idField = el;
  });

  const setValue = (el, valor) => {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, valor);
    else el.value = valor;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  if (idField) setValue(idField, id);
  else console.warn("[Multilogin Autofill] Campo de id/usuário não encontrado.");

  setValue(senhaField, senha);
}
