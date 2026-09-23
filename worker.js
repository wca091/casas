// ====== CONFIGURAÇÃO ======
// Pegue o ID na URL da sua planilha:
// https://docs.google.com/spreadsheets/d/ESTE_TRECHO_AQUI/edit
const SHEET_ID = "SEU_SHEET_ID_AQUI";

// Em produção, troque "*" pelo domínio exato do seu painel
// (ex: "https://seu-usuario.github.io")
const ALLOWED_ORIGIN = "*";
// ============================

async function fetchSheetAsJSON(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Não foi possível ler a aba "${sheetName}". Verifique se a planilha está compartilhada como "Qualquer pessoa com o link pode ver".`
    );
  }
  const csv = await res.text();
  return csvToJSON(csv);
}

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function csvToJSON(csv) {
  const lines = csv.trim().split("\n");
  const rows = lines.map(parseCsvLine);
  const headers = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()])));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (url.pathname === "/api/plataformas") {
        const data = await fetchSheetAsJSON("Config");
        return json(data);
      }

      if (url.pathname === "/api/contas") {
        const aba = url.searchParams.get("aba");
        if (!aba) return json({ error: "Parâmetro 'aba' é obrigatório" }, 400);
        const data = await fetchSheetAsJSON(aba);
        return json(data);
      }

      return json({ error: "Rota não encontrada" }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
