// utils/tokenEstimator.ts

export function estimateTokens(messages: { content: string }[]): number {
  const words = messages.map(m => m.content.split(/\s+/).length).reduce((a, b) => a + b, 0);
  return Math.round(words * 1.5); // estimación aproximada (mejor usar tiktoken si querés exactitud)
}
