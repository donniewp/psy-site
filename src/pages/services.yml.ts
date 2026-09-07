import type { APIRoute } from 'astro';
import { programs, programPaths } from '../data/content';

// Прайс для Яндекс Бизнеса. Цена относится к указанному пакету, а не к одному занятию.
const packages: Record<string, { price: number; unit: string }> = {
  'early-sensory': { price: 4200, unit: '4 занятия' },
  'early-senior': { price: 4200, unit: '4 занятия' },
  razvivayka: { price: 1900, unit: '1 занятие, 2,5 часа' },
  start: { price: 4200, unit: '4 занятия' },
  sand: { price: 4200, unit: '4 занятия' },
  'school-navigator': { price: 4200, unit: '4 занятия' },
  diagnostics: { price: 3500, unit: '45 минут' },
  psychocorrection: { price: 3500, unit: '45 минут' },
  'individual-school-prep': { price: 2300, unit: '45 минут' },
};
const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  const offers = programs.map((p) => {
    const pack = packages[p.slug];
    const description = `${p.ageLabel}. ${p.desc} Стоимость за ${pack.unit}. ${p.sessionInfo}. ${p.slug === 'diagnostics' ? 'Встреча с заключением и рекомендациями.' : 'Пробное занятие бесплатно. Время согласуем при записи.'}`;
    return `<offer id="${p.slug}">
      <name>${xml(`${p.title}${p.ageLabel ? `, ${p.ageLabel}` : ''} — ${pack.unit}`)}</name>
      <vendor>Сензитивность</vendor><price>${pack.price}</price><currencyId>RUB</currencyId><categoryId>1</categoryId>
      <picture>https://senzitivnost.ru${p.img || '/img/hero.jpg'}</picture>
      <description>${xml(description)}</description>
      <url>https://senzitivnost.ru/${programPaths[p.slug]}/?utm_source=yandex_business&amp;utm_medium=organic&amp;utm_campaign=services</url>
    </offer>`;
  }).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<yml_catalog><shop><name>Сензитивность</name><url>https://senzitivnost.ru/</url><categories><category id="1">Занятия для детей и подростков</category></categories><offers>${offers}</offers></shop></yml_catalog>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
