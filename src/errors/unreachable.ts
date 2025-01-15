export default function unreachable(message?: string): never {
  throw new Error(`Unreachable code reached${message ? `: ${message}` : ''}`);
}
