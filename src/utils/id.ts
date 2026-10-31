type UuidSource = {
  randomUUID?: () => string;
};

function fallbackId(): string {
  const time = Date.now().toString(16);
  const left = Math.random().toString(16).slice(2, 10);
  const right = Math.random().toString(16).slice(2, 10);
  return `${time}-${left}-${right}`;
}

export function createId(): string {
  const source = (globalThis as { crypto?: UuidSource }).crypto;
  if (source?.randomUUID) {
    return source.randomUUID();
  }
  return fallbackId();
}
