# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: parents in Moscow of children roughly **1.5–10 years old** — sensory/early development, school readiness, first-grade adaptation, attention/memory/thinking, emotional regulation — evaluating whether to enroll the child in a group program or book individual diagnostics. Their job on the site is to recognize their child's stage/need, judge the practitioner's credibility, and book a trial session or diagnostic slot.

Secondary (explicitly retained by the client — do not drop): the same parents seeking psychological consultation for themselves or the whole family, not only structured child programs. This is a smaller, real part of the offering (individual consultation, family consultation) and should stay visible, just not the lead framing.

## Product Purpose

Marketing/informational site for a real, existing Moscow children's development studio ("Сензитивность," led by Татьяна Петрова) built for paid Yandex.Direct traffic. It exists to build trust with a parent who has never visited, explain the real program roster and prices, and convert that trust into a booked trial session or diagnostic — either via a lead form (notifying the practice on Telegram) or a direct call/Telegram message. Success = a parent submits the form or contacts directly rather than bouncing to a competitor.

## Positioning

A named, credentialed practitioner (Петрова Татьяна Анатольевна — детский психолог, нейропсихолог, учитель начальных классов) running a real children's development studio, not an anonymous clinic and not a franchise-style children's-center brand. Client-confirmed direction: use the studio's real facts (name, credentials, address, programs, prices) from its actual marketing brochures, but present them in a quiet, editorial, non-clinical visual language — explicitly *not* the brochures' own bright/cartoon illustration style (see Brand Commitments).

## Operating Context

- Two physical locations in Moscow, each tied to a metro station: м. Красные ворота (Мясницкая, 46) and м. Войковская (**Ленинградское шоссе, д. 8, к. 3** — corrected 2026-07-27, see Capabilities and Constraints).
- Phone contact (+7 985 825-87-30 / 8 985 825-87-30 — same number appears in both the design canvas and the real brochures) with stated hours "Ежедневно 10:00–19:00," plus WhatsApp/Telegram for messaging.
- Primary conversion is a lead form; on submit it should notify the practice via Telegram Bot API (serverless function, no third-party form service, token in env vars). Secondary conversion: direct Telegram message or phone call.
- Third-party social proof lives on Yandex (reviews/ratings) and is linked from the site rather than fully hosted on it.
- A blog is part of the planned navigation (content/authority channel), alongside core marketing pages (About the psychologist, Programs, Methodology, Prices, Reviews).
- Site is built for paid traffic: needs Yandex.Metrika with goals on form submit, Telegram click, phone click, and scroll-to-prices.

## Capabilities and Constraints

- Confirmed: primary conversion action is booking ("Записаться"/"Отправить заявку"); real photos exist and are preferred over stock; real Yandex review quotes exist and must not be supplemented with invented testimonials.
- Booking mechanism (confirmed 2026-07-27): a serverless function forwarding the lead form to Telegram Bot API, plus a honeypot field (no captcha). No third-party form service. The current implementation is still a client-side-only mock (shows a fake success message, sends nothing) — this must be replaced with the real serverless+Telegram wiring before launch.
- **Superseded** (2026-07-27): the earlier resolution that treated the Claude Design canvas ("Сензитивность-print" files) as the sole factual source of truth was wrong on several points. The client supplied 10 real business brochures which are now the higher-authority source for: full legal name (Петрова Татьяна Анатольевна, patronymic included), credentials list with named institutions, the Войковская address, and the full program roster/pricing. Canvas-file copy that isn't contradicted by the brochures (stats, testimonials, quotes, mission/problem copy, and two named consultation services below) is still treated as real content, not discarded.
- Age framing (confirmed 2026-07-27): lead with **1.5–10 years** (matches the brochures' actual program ages) rather than the canvas copy's "3–18, psychologist for the whole family." The whole-family/parent-consultation angle is explicitly kept as a secondary, real offering (see Evidence on Hand below), not the primary framing.
- Emotional constraints (client-stated, hard rules): no countdown timers, no "N spots left," no discounts/urgency, no outcome guarantees ("we'll fix the behavior"), no diagnosis language in ad copy, no exclamation marks, no informal "ты," no baby talk. Tone addresses the parent as an adult. Must be transparent about format/duration/frequency/cancellation, explain what a first session looks like, and honestly note when a medical doctor (not a psychologist) is the right next step.
- Visual anti-references (client-stated): no infobusiness sales-landing patterns, no children's-center acid/neon colors or comic fonts, no medical-clinic aesthetic, no rainbow gradients, no cartoon animals, no smiling-stock-kid photos, no brain/neuron or lotus/butterfly/helping-hands iconography, no rounded-tile icon-over-every-heading pattern. This explicitly rules out reusing the visual style of the client's own real brochures (bright, illustrated, "Студия Сензики" tree-logo aesthetic) even though their *content* is now the source of truth.
- Russian-language site; no other locale requirement stated.

## Brand Commitments

- Legal/working name: Петрова Татьяна Анатольевна — детский психолог, нейропсихолог, учитель начальных классов. Studio name: Сензитивность.
- Education (real, from brochures — list verbatim, do not paraphrase): Позитивная психология — Учебный центр им. Н. П. Бехтеревой; Когнитивно-поведенческая терапия — Институт психотерапии им. Б. Д. Карвасарского; Интегрированная песочная терапия — Высшая школа психологии; Нейропсихология — Международный институт развития образования.
- Voice: calm, professional, no-pressure, addresses the parent as an adult — explicitly requested by the client.
- Anti-references: see Capabilities and Constraints above (both copy-level and visual-level rules recorded there).

## Evidence on Hand

- Real business brochures (10 images, supplied 2026-07-27) are the highest-authority source for: full name/credentials/education, the Войковская address, and the complete real program roster with prices (see below). Treat as ground truth over any earlier canvas-derived figures.
- A Claude Design canvas project ("Редизайн сайта развития," id `e222f53f-0823-4964-91f7-524f7b4748a2`) supplied structure, motion patterns, and copy for sections the brochures don't cover (mission statement, "problems we work with" list, testimonials, stats, quotes, methodology/advantages copy, and two consultation-only programs: "Консультация психолога" and "Семейное консультирование"). Its own hero subtitle/CTA/heading copy was found to describe the *old* 3–18/whole-family framing and has been superseded per the age-framing decision above; its 2-tier "от 800 ₽ / от 4 500 ₽" pricing has been fully replaced by the brochures' real price list.
- Real testimonial quotes are present (Елена, Любовь, Марина via Yandex reviews) — authentic evidence, not a template; never fabricate additional testimonials, credentials, or statistics.
- **Program roster and pricing (real, from brochures)** — 7 priced items plus 2 unpriced consultation services carried over from the canvas as the retained "for parents/family" offering:
  1. Раннее развитие (2,5–4 года), 50 мин — 7 500 ₽/8 занятий · 4 200 ₽/4 занятия. Note: a separate brochure markets the same program as "от 1,5 лет" for children 1,5–3 — this age-bracket discrepancy between two brochures is unresolved and should be confirmed with the practice.
  2. Подготовка к школе «Старт» (Ломоносовская программа, от 4 лет), 8 занятий по 50 минут — 7 500 ₽/8 занятий · 4 200 ₽/4 занятия.
  3. Развивай-ка (4–6 лет), 2 ч 30 мин (5 блоков по 30 мин) — price not stated in any supplied brochure; shown on-site as "цена по запросу," do not invent a number.
  4. Школьный навигатор (для первоклассников), мини-группы до 6 детей, 1 занятие 50 мин/1 раз в неделю — 4 200 ₽/месяц (4 занятия).
  5. Песок и глина (5–10 лет), 1 занятие 50 мин — 4 200 ₽/месяц (4 занятия).
  6. Диагностика (4–10 лет): нейропсихологическая / эмоциональной сферы / познавательной сферы-готовность к школе — 3 500 ₽ за каждый вид, 45 минут.
  7. Индивидуальные занятия: психокоррекция/сопровождение — 3 500 ₽ (45 мин) / 4 000 ₽ (60 мин); индивидуальная подготовка к школе — 2 300 ₽ (45 мин).
  8. Консультация психолога (очно и онлайн, для детей и взрослых) — canvas-sourced, real service, no price given anywhere; shown as "уточняется при записи."
  9. Семейное консультирование — canvas-sourced, real service, no price given anywhere; shown as "уточняется при записи." This is the primary home of the retained "parents/family" offering.
- Known image gaps (unchanged from before): one testimonial photo (initial-letter avatar fallback), five life-stage timeline icons (inline SVG instead of photos), two of four video thumbnails (duplicated from the other two). None affect copy or facts. Programs 1–9 above reuse the existing real `img/prog-*.jpg` / `img/method.jpg` photos by closest theme, since no brochure-specific photography was supplied as separate asset files — confirm with the practice whether dedicated photos exist for the brochure-only programs (Раннее развитие, Развивай-ка, Школьный навигатор, Песок и глина) before launch.

## Product Principles

1. Lead with the real programs and prices for children 1,5–10 — this is what the brochures and paid search traffic are actually about.
2. Keep the individual practitioner (Петрова Татьяна Анатольевна, full credentials) as the trust anchor, not an anonymous studio.
3. Keep parent/family consultation visible as a real, secondary offering — never drop it, per explicit client instruction.
4. Use only real evidence and real figures from the brochures or canvas; where a real price or fact is genuinely missing, say so on-site ("цена по запросу") rather than invent one.
5. Keep the tone calm, pressure-free, and adult-addressed; avoid infobiz/neon-kids-center/clinical patterns in both copy and visuals — including the client's own brochure illustration style, which is content-authoritative but visually out of scope.

## Accessibility & Inclusion

No product-specific requirement established yet.
