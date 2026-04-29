import Plunk from "@plunk/node";
import {
  getAppBaseUrl,
  getPlunkApiUrl,
  getPlunkFromEmail,
  getPlunkFromName,
  getPlunkSecretKey,
  getPlunkVideoReadyTemplateId,
} from "./env";

type SendVideoReadyEmailInput = {
  to: string;
  userName?: string | null;
  title?: string | null;
  videoUrl: string;
  seriesId?: string | number | null;
  videoId?: string | number | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  sceneCount?: number | null;
  generatedAt?: string | null;
};

type PlunkTemplateSendBody = {
  to: { email: string; name?: string } | string;
  template?: string;
  data?: Record<string, unknown>;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDuration(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return "Ready to watch";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

function buildViewUrl(seriesId?: string | number | null, videoUrl?: string) {
  const appBaseUrl = getAppBaseUrl();
  if (!appBaseUrl) return videoUrl;

  const url = new URL("/dashboard/videos", appBaseUrl);
  if (seriesId !== null && seriesId !== undefined && String(seriesId)) {
    url.searchParams.set("seriesId", String(seriesId));
  }

  return url.toString();
}

function getPlunkSdkBaseUrl() {
  const apiUrl = getPlunkApiUrl().replace(/\/$/, "");
  if (apiUrl.endsWith("/v1")) return `${apiUrl}/`;
  return `${apiUrl}/v1/`;
}

function buildVideoReadyEmailHtml(data: {
  userName: string;
  title: string;
  videoUrl: string;
  viewUrl: string;
  downloadUrl: string;
  thumbnailUrl?: string | null;
  durationLabel: string;
  sceneCountLabel: string;
  generatedAt: string;
}) {
  const safeTitle = escapeHtml(data.title);
  const safeUserName = escapeHtml(data.userName);
  const safeDuration = escapeHtml(data.durationLabel);
  const safeSceneCount = escapeHtml(data.sceneCountLabel);
  const safeGeneratedAt = escapeHtml(data.generatedAt);
  const safeViewUrl = escapeHtml(data.viewUrl);
  const safeDownloadUrl = escapeHtml(data.downloadUrl);
  const safeThumbnailUrl = data.thumbnailUrl ? escapeHtml(data.thumbnailUrl) : null;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e6eaf0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 20px;">
                <p style="margin:0 0 10px;color:#64748b;font-size:14px;">Your video is ready</p>
                <h1 style="margin:0;color:#111827;font-size:28px;line-height:1.2;">${safeTitle}</h1>
                <p style="margin:18px 0 0;color:#475569;font-size:16px;line-height:1.6;">Hi ${safeUserName}, your generated video has finished rendering and is available now.</p>
              </td>
            </tr>
            ${
              safeThumbnailUrl
                ? `<tr><td style="padding:0 28px 20px;"><img src="${safeThumbnailUrl}" alt="${safeTitle}" width="564" style="display:block;width:100%;max-width:564px;border-radius:8px;border:1px solid #e6eaf0;object-fit:cover;"></td></tr>`
                : ""
            }
            <tr>
              <td style="padding:0 28px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e6eaf0;border-radius:8px;">
                  <tr>
                    <td style="padding:16px;color:#64748b;font-size:13px;">Duration<br><strong style="display:block;margin-top:4px;color:#111827;font-size:16px;">${safeDuration}</strong></td>
                    <td style="padding:16px;color:#64748b;font-size:13px;">Scenes<br><strong style="display:block;margin-top:4px;color:#111827;font-size:16px;">${safeSceneCount}</strong></td>
                    <td style="padding:16px;color:#64748b;font-size:13px;">Generated<br><strong style="display:block;margin-top:4px;color:#111827;font-size:16px;">${safeGeneratedAt}</strong></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 32px;">
                <a href="${safeViewUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:6px;padding:13px 18px;margin:0 10px 10px 0;">View video</a>
                <a href="${safeDownloadUrl}" style="display:inline-block;background:#eef2f7;color:#111827;text-decoration:none;font-weight:700;font-size:15px;border-radius:6px;padding:13px 18px;margin:0 0 10px;">Download MP4</a>
                <p style="margin:14px 0 0;color:#64748b;font-size:13px;line-height:1.5;">If the buttons do not open, use this link: <a href="${safeDownloadUrl}" style="color:#2563eb;">${safeDownloadUrl}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVideoReadyEmail(input: SendVideoReadyEmailInput) {
  const title = input.title?.trim() || "Your generated video";
  const userName = input.userName?.trim() || "there";
  const viewUrl = buildViewUrl(input.seriesId, input.videoUrl) || input.videoUrl;
  const durationLabel = formatDuration(input.durationSeconds);
  const sceneCountLabel =
    typeof input.sceneCount === "number" && Number.isFinite(input.sceneCount)
      ? String(input.sceneCount)
      : "Generated";
  const generatedAt = input.generatedAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(input.generatedAt),
      )
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

  const data = {
    userName,
    title,
    videoUrl: input.videoUrl,
    viewUrl,
    downloadUrl: input.videoUrl,
    thumbnailUrl: input.thumbnailUrl || "",
    durationLabel,
    sceneCountLabel,
    generatedAt,
    videoId: input.videoId ? String(input.videoId) : "",
    seriesId: input.seriesId ? String(input.seriesId) : "",
  };

  const templateId = getPlunkVideoReadyTemplateId();
  const fromEmail = getPlunkFromEmail();

  if (templateId) {
    const body: PlunkTemplateSendBody = {
      to: userName === "there" ? input.to : { email: input.to, name: userName },
      template: templateId,
      data,
    };

    const endpoint = new URL("/v1/send", getPlunkApiUrl()).toString();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getPlunkSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let responseJson: unknown = null;
    if (responseText) {
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = responseText;
      }
    }

    if (!response.ok) {
      throw new Error(
        `Plunk template email send failed (${response.status}): ${
          typeof responseJson === "string" ? responseJson : JSON.stringify(responseJson)
        }`,
      );
    }

    return responseJson;
  }

  if (!fromEmail) {
    throw new Error("Missing env: PLUNK_FROM_EMAIL");
  }

  const plunk = new Plunk(getPlunkSecretKey(), { baseUrl: getPlunkSdkBaseUrl() });
  return await plunk.emails.send({
    to: input.to,
    from: fromEmail,
    name: getPlunkFromName(),
    subject: `Your video is ready: ${title}`,
    body: buildVideoReadyEmailHtml(data),
    type: "html",
    subscribed: false,
  });
}
