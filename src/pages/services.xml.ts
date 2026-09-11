import type { APIRoute } from 'astro';
import { programs, programPaths, specialist } from '../data/content';

/* Прайс услуг для Яндекс Бизнеса и Директа в формате YML.

   Адрес именно .xml: на GitHub Pages тип ответа берётся из расширения файла, и
   прежний /services.yml отдавался как text/yaml — для парсера фида это не XML.
   Старый адрес оставлен рядом и отдаёт то же самое, он уже указан в документах.

   Обязательный минимум по требованиям Яндекса: атрибут date у yml_catalog,
   блоки name / company / url / currencies / categories перед offers, у каждого
   офера — уникальный id, available, name, url, price, currencyId, categoryId,
   picture и description. */

const SITE = 'https://senzitivnost.ru';

// Цена относится к указанному пакету, а не к одному занятию.
const packages: Record<string, { price: number; unit: string }> = {
  'early-sensory': { price: 4200, unit: '4 занятия' },
  'early-senior': { price: 7500, unit: '8 занятий' },
  razvivayka: { price: 1900, unit: '1 занятие, 2,5 часа' },
  start: { price: 4200, unit: '4 занятия' },
  sand: { price: 4200, unit: '4 занятия' },
  'school-navigator': { price: 4200, unit: '4 занятия' },
  psychocorrection: { price: 3500, unit: '45 минут' },
  diagnostics: { price: 3500, unit: '45 минут' },
};

const xml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Яндекс ждёт время генерации в формате YYYY-MM-DD hh:mm по московскому времени.
const stamp = () => {
  const now = new Date();
  const msk = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${msk.getFullYear()}-${pad(msk.getMonth() + 1)}-${pad(msk.getDate())} ${pad(msk.getHours())}:${pad(msk.getMinutes())}`;
};

export const buildFeed = () => {
  const offers = programs
    .map((p) => {
      const pack = packages[p.slug];
      if (!pack) return '';
      const url = `${SITE}/${programPaths[p.slug]}/?utm_source=yandex_business&utm_medium=organic&utm_campaign=services`;
      const description = `${p.ageLabel}. ${p.desc} Стоимость за ${pack.unit}. ${p.sessionInfo}. ${
        p.slug === 'diagnostics'
          ? 'Встреча с заключением и рекомендациями.'
          : 'Пробное занятие бесплатно. Время согласуем при записи.'
      }`;
      return `    <offer id="${xml(p.slug)}" available="true">
      <name>${xml(`${p.searchName}${p.ageLabel ? `, ${p.ageLabel}` : ''} — ${pack.unit}`)}</name>
      <url>${xml(url)}</url>
      <price>${pack.price}</price>
      <currencyId>RUB</currencyId>
      <categoryId>1</categoryId>
      <picture>${xml(`${SITE}${p.img || '/img/hero.jpg'}`)}</picture>
      <vendor>Сензитивность</vendor>
      <description>${xml(description)}</description>
    </offer>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${stamp()}">
  <shop>
    <name>Сензитивность</name>
    <company>${xml(specialist.fullName)}</company>
    <url>${SITE}/</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Занятия для детей и подростков</category>
    </categories>
    <offers>
${offers}
    </offers>
  </shop>
</yml_catalog>`;
};

export const GET: APIRoute = () =>
  new Response(buildFeed(), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
