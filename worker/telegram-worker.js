/*
  Cloudflare Worker: принимает заявку с формы сайта и пересылает в Telegram.
  Токен бота хранится как секрет на сервере — на сайте его нет.

  Деплой: dash.cloudflare.com → Workers & Pages → Create Worker → вставить
  этот код → Settings → Variables:
    - TELEGRAM_BOT_TOKEN (Secret)  — токен от @BotFather
    - TELEGRAM_CHAT_ID   (обычная переменная) — id чата, куда слать заявки
    - ALLOWED_ORIGIN     (обычная переменная) — https://ваш-домен, для CORS
*/

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response('Bad request', { status: 400, headers: corsHeaders });
    }

    // Honeypot: настоящие посетители это поле не видят и не заполняют.
    if (data.hp_check) {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const name = (data.name || '').toString().trim().slice(0, 200);
    const phone = (data.phone || '').toString().trim().slice(0, 50);
    const program = (data.program || '').toString().trim().slice(0, 200) || 'не указана';

    if (!name || !phone) {
      return new Response('Missing fields', { status: 400, headers: corsHeaders });
    }

    const text = [
      'Новая заявка с сайта «Сензитивность»',
      '',
      `Имя ребёнка: ${name}`,
      `Телефон: ${phone}`,
      `Программа: ${program}`,
    ].join('\n');

    const tgResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    });

    if (!tgResponse.ok) {
      return new Response('Failed to send', { status: 502, headers: corsHeaders });
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  },
};
