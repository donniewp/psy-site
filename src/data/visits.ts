import { programs, programBooking, bookingOptions } from './content';

export type Program = (typeof programs)[number];
export type Visit = {
  value: string;
  label: string;
  title: string;
  price: string;
  explanation: string;
  action: string;
};

export const familyBooking = 'Консультация для родителей и семьи';
export const individualBooking = 'Индивидуальная подготовка к школе';

export const visitFor = (p: Program): Visit => {
  const diagnostic = p.slug === 'diagnostics';
  const consultation = p.slug === 'psychocorrection';
  return {
    value: programBooking[p.slug],
    label: `${p.searchName} · ${p.ageLabel}`,
    title: diagnostic ? 'Запись на диагностику' : consultation ? 'Обсудим консультацию' : 'Запись на пробное занятие',
    price: diagnostic || consultation ? p.price : 'Пробное в группе — бесплатно',
    explanation: diagnostic
      ? 'Диагностика длится 45 минут и включает заключение с рекомендациями. Свяжемся, чтобы уточнить запрос и время встречи.'
      : consultation
        ? 'Согласуем запрос и продолжительность консультации. Бесплатное знакомство со студией можно обсудить отдельно.'
        : 'Познакомитесь с педагогом и форматом до покупки абонемента. Время, длительность пробного и участие родителя уточним при записи.',
    action: diagnostic ? 'Записаться на диагностику' : consultation ? 'Обсудить консультацию' : 'Записаться на пробное',
  };
};

export const defaultVisit: Visit = {
  value: '', label: 'Помогите выбрать занятие', title: 'Подберём занятие для ребёнка',
  price: 'Пробное в группе — бесплатно',
  explanation: 'Оставьте имя и телефон. Свяжемся в часы работы, поможем выбрать программу и согласуем первый визит.',
  action: 'Оставить заявку',
};

export const individualVisitFor = (p: Program): Visit => ({
  value: p.slug === 'start' ? individualBooking : `${p.searchName} — индивидуально`,
  label: p.slug === 'start' ? individualBooking : `${p.searchName} — индивидуально`,
  title: 'Обсудим индивидуальное занятие', price: 'Занятие — 2 300 ₽',
  explanation: 'Согласуем время и продолжительность занятия. Условия бесплатного знакомства со студией обсудим при записи.',
  action: 'Обсудить индивидуальное занятие',
});

export const visits: Visit[] = [
  ...programs.map(visitFor),
  ...programs.filter(p => p.individual).map(individualVisitFor),
  { value: familyBooking, label: familyBooking, title: 'Обсудим ваш запрос',
    price: 'Стоимость и формат уточним при записи', explanation: 'Расскажите, с чем нужна помощь. Согласуем, кто будет на встрече, её стоимость и время.', action: 'Обсудить консультацию' },
  { ...defaultVisit, value: bookingOptions[8] },
];

export const programPhotos = (p: Program) => {
  if (p.slug === 'early-sensory' || p.slug === 'early-senior') return {
    alt: 'Пространство студии для игр и занятий на полу',
    caption: 'Пространство для занятий в нашей студии',
  };
  if (p.slug === 'psychocorrection' || p.slug === 'diagnostics') return {
    alt: 'Татьяна Петрова беседует с посетителем студии',
    caption: 'Татьяна Петрова на индивидуальной встрече',
  };
  return { alt: 'Татьяна Петрова занимается с детьми в студии', caption: 'Занятия в «Сензитивности»' };
};

export const programQuestions = (p: Program) => {
  const questions = [{ q: 'Когда можно начать?', a: p.slug === 'start'
    ? 'Занятия проходят в возрастных группах 4–5, 5–6 и 6–7 лет. При записи уточним ближайшее занятие и состав группы. Если группа ещё собирается, сообщим об этом.'
    : p.schedule ? `${p.schedule}. Точное время первого визита и возможность присоединиться согласуем при записи.`
    : 'При записи подберём время и уточним ближайшее занятие. Если группа ещё собирается, сообщим об этом до визита.' }];
  if (p.slug === 'early-sensory') questions.push({ q: 'Нужно ли маме быть рядом?', a: 'Да, занятия для детей 1,5–2,5 года проходят вместе с мамой. Длительность пробного и то, что взять с собой, уточним при записи.' });
  else if (p.slug === 'diagnostics') questions.splice(0, 1, { q: 'Что входит в диагностику?', a: 'Встреча длится 45 минут и стоит 3 500 ₽. По итогам вы получите заключение и рекомендации. Бесплатное знакомство со студией не заменяет диагностику.' });
  else if (p.slug === 'psychocorrection') questions.splice(0, 1, { q: 'Кто приходит на консультацию?', a: 'Это зависит от запроса: до встречи обсудим участие ребёнка и родителя. Консультация длится 45 или 60 минут; стоимость — 3 500 ₽ или 4 000 ₽ соответственно.' });
  else questions.push({ q: 'Родитель остаётся на пробном?', a: 'Участие родителя и длительность именно пробного зависят от возраста и формата. Уточним это при записи, чтобы вы могли спланировать визит.' });
  if (p.individual) questions.push({ q: 'Можно заниматься индивидуально?', a: 'Да, индивидуальное занятие стоит 2 300 ₽. Продолжительность, время и условия первого знакомства уточним при записи.' });
  return questions;
};

export const programSummaries: Record<string, string> = {
  'early-sensory': 'Первые навыки речи, движения и общения.',
  'early-senior': 'Сенсорные игры, речь, движение и творчество.',
  razvivayka: 'Пять блоков: от чтения и логики до творчества.',
  start: 'Чтение, письмо и счёт перед первым классом.',
  sand: 'Выражать эмоции и справляться с напряжением через творчество.',
  'school-navigator': 'Внимание и самостоятельность в школьных делах.',
  psychocorrection: 'Эмоции, тревоги и отношения ребёнка.',
  diagnostics: 'Разобраться в причинах трудностей и получить рекомендации.',
};
