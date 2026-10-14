const API_URL = 'https://api.anthropic.com/v1/messages';

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

// Minimal Claude call using fetch, so there is no SDK to install or keep updated.
export async function askClaude({ system, user, maxTokens = 600 }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
