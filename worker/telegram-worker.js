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
      console.log('Honeypot triggered, submission dropped');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const name = (data.name || '').toString().trim().slice(0, 200);
    const phone = (data.phone || '').toString().trim().slice(0, 50);
    const program = (data.program || '').toString().trim().slice(0, 200) || 'не указана';
    // Необязательное поле: возраст ребёнка, удобное время звонка, суть запроса.
    const comment = (data.comment || '').toString().trim().slice(0, 1000);

    if (!name || !phone) {
      return new Response('Missing fields', { status: 400, headers: corsHeaders });
    }

    // Атрибуция: не блокирует отправку заявки, если чего-то из этого нет
    // (например, JS не успел получить ym_client_id или человек пришёл без меток).
    const field = (key, max) => (data[key] || '').toString().trim().slice(0, max);
    const ymClientId = field('ym_client_id', 50);
    const yclid = field('yclid', 50);
    const utmSource = field('utm_source', 100);
    const utmMedium = field('utm_medium', 100);
    const utmCampaign = field('utm_campaign', 100);
    const utmContent = field('utm_content', 100);
    const utmTerm = field('utm_term', 100);
    const landingUrl = field('landing_url', 500);

    const text = [
      'Новая заявка с сайта «Сензитивность»',
      '',
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Программа: ${program}`,
      comment && `Комментарий: ${comment}`,
      '',
      `ClientID Метрики: ${ymClientId || 'не получен'}`,
      yclid && `yclid: ${yclid}`,
      (utmSource || utmMedium || utmCampaign || utmContent || utmTerm) &&
        `UTM: ${[utmSource, utmMedium, utmCampaign, utmContent, utmTerm].filter(Boolean).join(' / ')}`,
      landingUrl && `Страница входа: ${landingUrl}`,
    ].filter(Boolean).join('\n');

    const tgResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    });

    if (!tgResponse.ok) {
      console.error('Telegram send failed', tgResponse.status, await tgResponse.text());
      return new Response('Failed to send', { status: 502, headers: corsHeaders });
    }

    console.log('Telegram message sent');
    return new Response('OK', { status: 200, headers: corsHeaders });
  },
};
