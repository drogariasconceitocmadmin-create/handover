// Edge Function: enviar-encomenda-email  (Deno / Supabase Functions)
//
// Recebe o payload disparado pelo trigger SQL public._notificar_encomenda_email()
// (migration 0010) quando uma linha de medicamentos com tipo='Encomenda' é inserida,
// e envia um e-mail via Resend para drogariasconceitocm@gmail.com.
//
// Assunto/corpo espelham o sendOrderEmail_ do legado (SPEC §8): ID, Medicamento,
// Cliente, Atendente, Pré-pago, Previsão + link de compras.
//
// ─────────────────────────────────────────────────────────────────────────────
// DEPENDÊNCIAS DE DEPLOY:
//
//   1) SECRET (obrigatório):
//        supabase secrets set RESEND_API_KEY=<sua_chave_resend>
//      Lida abaixo via Deno.env.get('RESEND_API_KEY'). Sem ela, a function responde 500.
//
//   2) verify_jwt = false (obrigatório):
//      O POST vem do banco (pg_net) sem JWT de usuário. Faça o deploy com:
//        supabase functions deploy enviar-encomenda-email --no-verify-jwt
//      ou em supabase/config.toml:
//        [functions.enviar-encomenda-email]
//        verify_jwt = false
//
//   3) (Opcional) Domínio de remetente verificado no Resend. Enquanto não houver
//      domínio próprio verificado, use o remetente de teste do Resend
//      (onboarding@resend.dev). Ajuste FROM_EMAIL abaixo / via env EMAIL_FROM.
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

// Remetente: domínio verificado no Resend (configurável por env). Fallback de teste.
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") ?? "Handover <onboarding@resend.dev>";
const TO_EMAIL = "drogariasconceitocm@gmail.com";

// Link de compras (mesma origem do projeto). Configurável por env.
const COMPRAS_URL =
  Deno.env.get("COMPRAS_URL") ??
  "https://pxswpufbkisdniojwdtt.supabase.co";

interface EncomendaPayload {
  ID?: string | null;
  Medicamento?: string | null;
  Cliente?: string | null;
  Atendente?: string | null;
  Pre_Pago?: boolean | null;
  Previsao_Entrega?: string | null;
}

function s(v: unknown): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function buildSubject(p: EncomendaPayload): string {
  // Espelha o assunto do sendOrderEmail_ do legado.
  return `Nova encomenda: ${s(p.Medicamento)} — ${s(p.Cliente)}`;
}

function buildText(p: EncomendaPayload): string {
  const prePago = p.Pre_Pago === true ? "Sim" : "Não";
  return [
    "Uma nova encomenda foi registrada no Handover.",
    "",
    `ID: ${s(p.ID)}`,
    `Medicamento: ${s(p.Medicamento)}`,
    `Cliente: ${s(p.Cliente)}`,
    `Atendente: ${s(p.Atendente)}`,
    `Pré-pago: ${prePago}`,
    `Previsão: ${s(p.Previsao_Entrega)}`,
    "",
    `Acesse a fila de compras: ${COMPRAS_URL}`,
  ].join("\n");
}

function buildHtml(p: EncomendaPayload): string {
  const prePago = p.Pre_Pago === true ? "Sim" : "Não";
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;">
      <p>Uma nova encomenda foi registrada no Handover.</p>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:2px 8px;"><b>ID</b></td><td style="padding:2px 8px;">${s(p.ID)}</td></tr>
        <tr><td style="padding:2px 8px;"><b>Medicamento</b></td><td style="padding:2px 8px;">${s(p.Medicamento)}</td></tr>
        <tr><td style="padding:2px 8px;"><b>Cliente</b></td><td style="padding:2px 8px;">${s(p.Cliente)}</td></tr>
        <tr><td style="padding:2px 8px;"><b>Atendente</b></td><td style="padding:2px 8px;">${s(p.Atendente)}</td></tr>
        <tr><td style="padding:2px 8px;"><b>Pré-pago</b></td><td style="padding:2px 8px;">${prePago}</td></tr>
        <tr><td style="padding:2px 8px;"><b>Previsão</b></td><td style="padding:2px 8px;">${s(p.Previsao_Entrega)}</td></tr>
      </table>
      <p><a href="${COMPRAS_URL}">Acessar a fila de compras</a></p>
    </div>`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY ausente — configure o secret no deploy.");
    return new Response(JSON.stringify({ error: "missing_resend_api_key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: EncomendaPayload;
  try {
    payload = (await req.json()) as EncomendaPayload;
  } catch (_e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: buildSubject(payload),
        text: buildText(payload),
        html: buildHtml(payload),
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error("Resend falhou:", resp.status, detail);
      return new Response(
        JSON.stringify({ error: "resend_failed", status: resp.status, detail }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ success: true, id: data?.id ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Erro inesperado ao enviar e-mail:", e);
    return new Response(JSON.stringify({ error: "unexpected", detail: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
