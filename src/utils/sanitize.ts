export function sanitize(input: string | undefined): string {
  return input?.replace(/[<>]/g, (i) => encodeURIComponent(i)) ?? '';
}
