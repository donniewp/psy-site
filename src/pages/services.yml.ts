import type { APIRoute } from 'astro';
import { buildFeed } from './services.xml';

/* Прежний адрес прайса. Он указан в документах и мог быть куда-то отправлен,
   поэтому продолжает отдавать тот же фид. Подключать в Яндекс Бизнесе нужно
   /services.xml: GitHub Pages отдаёт .yml как text/yaml, а парсеру фида нужен
   XML-тип ответа. */

export const GET: APIRoute = () =>
  new Response(buildFeed(), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
