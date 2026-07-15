import { Resend } from 'resend'
import QRCode from 'qrcode'
import { supabase } from '@/app/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY!)

export interface DadosEmailCasal {
  email: string
  nome_parceiro_1: string
  nome_parceiro_2: string
  data_especial: string
  local: string
  slug_pagina_exclusiva: string
  token_edicao: string
}

// Gera QR Code como data URI (image/png;base64) e retorna as duas partes separadas
export async function gerarQrCode(url: string): Promise<{ dataUri: string; base64: string }> {
  const dataUri = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: { dark: '#0a0a1a', light: '#f5f0ff' },
  })
  const base64 = dataUri.split(',')[1]
  return { dataUri, base64 }
}

export async function enviarEmailConfirmacao(casal: DadosEmailCasal): Promise<void> {
  const baseUrl = process.env.BASE_URL ?? 'https://meudominio.com.br'
  const urlPagina = `${baseUrl}/casal/${casal.slug_pagina_exclusiva}`
  const urlEditar = `${baseUrl}/editar/${casal.token_edicao}`

  const { base64 } = await gerarQrCode(urlPagina)

  const storagePath = `qrcodes/${casal.slug_pagina_exclusiva}.png`
  const qrBuffer = Buffer.from(base64, 'base64')
  await supabase.storage
    .from('fotos-casais')
    .upload(storagePath, qrBuffer, { contentType: 'image/png', upsert: true })
  const { data: { publicUrl: qrCodeUrl } } = supabase.storage
    .from('fotos-casais')
    .getPublicUrl(storagePath)

  const dataFormatada = new Date(casal.data_especial + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  await resend.emails.send({
    from: 'Céu Daquele Dia <ola@ceudaqueledia.com.br>',
    to: casal.email,
    subject: `✨ O Céu de ${casal.nome_parceiro_1} & ${casal.nome_parceiro_2} está pronto`,
    attachments: [
      {
        filename: 'qrcode-ceu-daquele-dia.png',
        content: base64,
      },
    ],
    text: criarTextoEmail({
      nome1: casal.nome_parceiro_1,
      nome2: casal.nome_parceiro_2,
      dataFormatada,
      local: casal.local,
      urlPagina,
      urlEditar,
    }),
    html: criarHtmlEmail({
      nome1: casal.nome_parceiro_1,
      nome2: casal.nome_parceiro_2,
      dataFormatada,
      local: casal.local,
      urlPagina,
      urlEditar,
      qrCodeUrl,
    }),
  })
}

// ─── Template ─────────────────────────────────────────────────────────────────

interface TextParams {
  nome1: string
  nome2: string
  dataFormatada: string
  local: string
  urlPagina: string
  urlEditar: string
}

function criarTextoEmail(p: TextParams): string {
  return `Olá, ${p.nome1} & ${p.nome2}!

O céu de vocês está pronto 🌌

Preparamos a memória do céu da noite de ${p.dataFormatada}, em ${p.local}.

Acesse sua página especial:
${p.urlPagina}

Quer personalizar sua página? Acesse o link de edição:
${p.urlEditar}

O QR Code da sua página está em anexo neste e-mail — imprima e emoldure para ter sempre por perto.

Sua assinatura é válida por 1 ano.

— Equipe Céu Daquele Dia`
}

interface TemplateParams {
  nome1: string
  nome2: string
  dataFormatada: string
  local: string
  urlPagina: string
  urlEditar: string
  qrCodeUrl: string
}

function criarHtmlEmail(p: TemplateParams): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>O Céu de Vocês</title>
</head>
<body style="margin:0;padding:0;background-color:#07071a;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#07071a;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Cabeçalho estrelado -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:28px;letter-spacing:8px;color:#c8b4ff;">✦ · · · ✦ · · · ✦</p>
            </td>
          </tr>

          <!-- Título -->
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <h1 style="margin:0;font-size:26px;font-weight:normal;color:#f0e6ff;letter-spacing:1px;">
                O céu de vocês está pronto
              </h1>
            </td>
          </tr>

          <!-- Subtítulo -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-size:14px;color:#8b7fb0;letter-spacing:2px;text-transform:uppercase;">
                Céu Daquele Dia
              </p>
            </td>
          </tr>

          <!-- Corpo principal -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0f2e 0%,#1a1040 100%);border-radius:16px;padding:40px 36px;border:1px solid #2a2060;">

              <!-- Saudação -->
              <p style="margin:0 0 24px;font-size:18px;color:#e8d5ff;line-height:1.6;">
                Olá, <strong style="color:#c8a8ff;">${p.nome1}</strong> &amp;
                <strong style="color:#c8a8ff;">${p.nome2}</strong> 💜
              </p>

              <!-- Mensagem principal -->
              <p style="margin:0 0 28px;font-size:16px;color:#bbaedd;line-height:1.8;">
                Preparamos com muito carinho a memória do céu da noite de
                <strong style="color:#e8d5ff;">${p.dataFormatada}</strong>,
                em <strong style="color:#e8d5ff;">${p.local}</strong>.
                Cada estrela que brilhou naquela noite está esperando por vocês. 🌙
              </p>

              <!-- Botão CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <a href="${p.urlPagina}"
                       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;font-size:16px;font-family:Arial,sans-serif;font-weight:600;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;">
                      ✨ Ver o Céu do Nosso Dia
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <hr style="border:none;border-top:1px solid #2a2060;margin:0 0 32px;" />

              <!-- Seção QR Code -->
              <p style="margin:0 0 8px;font-size:16px;color:#e8d5ff;text-align:center;line-height:1.6;">
                📱 Escaneie o código abaixo com a câmera do celular
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#9b8cc0;text-align:center;line-height:1.6;">
                para abrir o seu céu especial instantaneamente!
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <img src="${p.qrCodeUrl}"
                         width="200" height="200"
                         alt="QR Code para sua página especial"
                         style="display:block;border-radius:12px;border:4px solid #2a2060;" />
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:12px;color:#6b5e8a;text-align:center;">
                O QR Code também está anexado neste e-mail — imprima e emoldure para ter sempre por perto 🖼️
              </p>

              <!-- Divisor -->
              <hr style="border:none;border-top:1px solid #2a2060;margin:0 0 28px;" />

              <!-- Link de edição -->
              <p style="margin:0 0 8px;font-size:14px;color:#9b8cc0;line-height:1.6;">
                🔧 Quer personalizar sua página? Adicionar fotos, música ou ajustar a mensagem?
              </p>
              <p style="margin:0;font-size:14px;color:#9b8cc0;line-height:1.6;">
                Acesse o link exclusivo de edição:
                <a href="${p.urlEditar}"
                   style="color:#a78bfa;text-decoration:underline;">
                  Editar minha página
                </a>
              </p>

            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td align="center" style="padding-top:32px;padding-bottom:8px;">
              <p style="margin:0;font-size:12px;color:#4a4070;line-height:1.8;">
                Este é um e-mail exclusivo gerado para
                <strong style="color:#6b5e8a;">${p.nome1} &amp; ${p.nome2}</strong>.<br />
                Sua assinatura é válida por 1 ano.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:48px;">
              <p style="margin:0;font-size:20px;letter-spacing:6px;color:#2a2060;">✦ · · · ✦ · · · ✦</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
