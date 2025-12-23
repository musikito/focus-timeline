type WeeklyInsightEmailProps = {
  userName?: string;
  weekLabel: string;
  summaryMarkdown: string;
  suggestions: string[];
  infographicSvg: string;
};

function mdToHtml(md: string) {
  return md
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export function weeklyInsightEmail({
  userName,
  weekLabel,
  summaryMarkdown,
  suggestions,
  infographicSvg,
}: WeeklyInsightEmailProps) {
  const summaryHtml = mdToHtml(summaryMarkdown);

  return {
    subject: `Your Weekly Focus Insight — ${weekLabel}`,
    html: `
<!DOCTYPE html>
<html>
  <body style="margin:0;background:#0d1117;color:#e6edf3;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto;">
    <div style="max-width:720px;margin:0 auto;padding:24px;">
      <h1 style="margin:0 0 8px 0;">FocusMirror</h1>
      <p style="color:#94a3b8;margin:0 0 24px 0;">
        ${userName ? `Hi ${userName}, ` : ""}here’s your weekly insight for <strong>${weekLabel}</strong>.
      </p>

      <div style="background:#161b22;border:1px solid #273244;border-radius:16px;padding:16px;margin-bottom:20px;">
        ${summaryHtml}
      </div>

      <div style="background:#161b22;border:1px solid #273244;border-radius:16px;padding:16px;margin-bottom:20px;">
        <h3>Suggestions</h3>
        <ul>
          ${suggestions.map((s) => `<li>${s}</li>`).join("")}
        </ul>
      </div>

      <div style="background:#161b22;border:1px solid #273244;border-radius:16px;padding:16px;margin-bottom:20px;overflow:auto;">
        ${infographicSvg}
      </div>

      <p style="color:#94a3b8;font-size:12px;">
        You’re receiving this because weekly insights are enabled in Settings.
      </p>
    </div>
  </body>
</html>
`,
  };
}
