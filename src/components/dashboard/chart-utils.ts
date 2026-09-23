export function toSvgId(id: string, suffix: string): string {
  return `dashboard-${id.replace(/[^a-zA-Z0-9_-]/g, "")}-${suffix}`;
}
