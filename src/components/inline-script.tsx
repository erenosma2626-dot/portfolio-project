/**
 * İlk boyamadan önce senkron çalışan script (bkz. Next docs: preventing
 * flash before hydration). İstemcide text/plain olur, tekrar çalışmaz.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
