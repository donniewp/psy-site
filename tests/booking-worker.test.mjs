import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/telegram-worker.js';

const env = { ALLOWED_ORIGIN: 'https://example.invalid', TELEGRAM_BOT_TOKEN: 'test', TELEGRAM_CHAT_ID: 'test' };
const valid = { name: 'Тест', phone: '8 (999) 123-45-67', program: 'Подготовка к школе' };
const request = body => new Request('https://local.invalid/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('validation rejects unusable submissions without contacting Telegram', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Must not send'); });
  for (const body of [null, [], { ...valid, name: ' ' }, { ...valid, phone: 'abc' }, { ...valid, phone: '12345' }, { ...valid, phone: '799912345671234567' }, { ...valid, phone: 'call 79991234567' }, { ...valid, hp_check: 'autofill' }]) {
    assert.equal((await worker.fetch(request(body), env)).status, 400);
  }
  assert.equal(calls, 0);
});

test('normalizes formatted Russian and international phones and preserves attribution', async t => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ ok: true });
  });
  for (const [input, expected] of [['8 (999) 123-45-67', '+79991234567'], ['9991234567', '+79991234567'], ['+44 20 7946 0958', '+442079460958']]) {
    const response = await worker.fetch(request({ ...valid, phone: input, ym_client_id: '123', utm_campaign: 'school' }), env);
    assert.deepEqual(await response.json(), { ok: true });
    assert.match(sent.text, new RegExp(expected.replace('+', '\\+')));
    assert.ok(sent.text.includes('ClientID Метрики: 123'));
    assert.ok(sent.text.includes('UTM: school'));
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), env.ALLOWED_ORIGIN);
  }
});

test('never confirms failed or malformed upstream responses', async t => {
  for (const result of [() => Response.json({ ok: false }), () => Response.json({ ok: false }, { status: 500 }), () => new Response('not json'), () => { throw new Error('offline'); }]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => result());
    assert.equal((await worker.fetch(request(valid), env)).status, 502);
    mock.mock.restore();
  }
});

test('preflight and unsupported methods never send a message', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not send'); });
  const options = await worker.fetch(new Request('https://local.invalid/', { method: 'OPTIONS' }), env);
  assert.equal(options.status, 200);
  assert.equal((await worker.fetch(new Request('https://local.invalid/'), env)).status, 405);
});
