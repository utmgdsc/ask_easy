import crypto from "crypto";

export function generateSignedUrl(
  baseUrl: string,
  expiresInHours: number = 1
): { url: string; expiresAt: string } {
  const secret = process.env.SIGNED_URL_SECRET || "development_secret";
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${baseUrl}:${expiresAt}`)
    .digest("hex");

  const separator = baseUrl.includes("?") ? "&" : "?";
  const url = `${baseUrl}${separator}expires=${encodeURIComponent(expiresAt)}&signature=${signature}`;

  return { url, expiresAt };
}

export function verifySignedUrl(url: string, expiresAt: string, signature: string): boolean {
  const secret = process.env.SIGNED_URL_SECRET || "development_secret";

  if (new Date(expiresAt).getTime() < Date.now()) {
    return false; // Expired
  }

  const baseUrl = url.split(/[?&]expires=/)[0];
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${baseUrl}:${expiresAt}`)
    .digest("hex");

  return signature === expectedSignature;
}
