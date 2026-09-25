/** Bağımsız açılır-kapanır satırlar: her satır kendi başına açık/kapalı. */
export function isOpen(open: ReadonlySet<string>, id: string): boolean {
  return open.has(id);
}

export function toggle(open: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(open);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function panelState(open: boolean): "open" | "closed" {
  return open ? "open" : "closed";
}
