import http2 from "node:http2";
import { createPrivateKey, createSign, type KeyObject } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUNDLE_ID = "jp.machiglyph.app";

type PushMessage = {
  title: string;
  body?: string | null;
  link?: string | null;
};

let cachedJwt: { token: string; exp: number } | null = null;

function apnsPrivateKey(): KeyObject | null {
  const raw = process.env.APNS_PRIVATE_KEY;
  if (!raw) return null;
  try {
    return createPrivateKey(raw.replace(/\\n/g, "\n"));
  } catch (err) {
    console.error("[push] APNS_PRIVATE_KEY を読めません", err);
    return null;
  }
}

function apnsJwt(): string | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const key = apnsPrivateKey();
  if (!keyId || !teamId || !key) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp > now + 60) return cachedJwt.token;
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now })).toString("base64url");
  const signer = createSign("SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign({ key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  const token = `${header}.${payload}.${signature}`;
  cachedJwt = { token, exp: now + 50 * 60 };
  return token;
}

function postApns(
  deviceToken: string,
  jwt: string,
  body: string,
  sandbox: boolean
): Promise<{ status: number; body: string }> {
  const host = sandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`);
    const fail = (err: Error) => {
      client.close();
      reject(err);
    };
    client.on("error", fail);
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
    });
    const chunks: Buffer[] = [];
    req.on("response", (headers) => {
      const status = Number(headers[":status"] ?? 0);
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        client.close();
        resolve({ status, body: Buffer.concat(chunks).toString("utf8") });
      });
    });
    req.on("error", fail);
    req.end(body);
  });
}

/** 保存済みの iOS 端末へ通知を送る。鍵が無いときは何もしない。 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  const jwt = apnsJwt();
  if (!jwt) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data, error } = await admin
    .from("push_device_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("platform", "ios");
  if (error || !data?.length) {
    if (error) console.error("[push] token select", error);
    return;
  }

  const sandbox = process.env.APNS_USE_SANDBOX === "true";
  const body = JSON.stringify({
    aps: {
      alert: {
        title: message.title,
        body: message.body ?? "",
      },
      sound: "default",
    },
    link: message.link ?? undefined,
  });

  await Promise.all(
    data.map(async (row) => {
      try {
        const result = await postApns(row.token, jwt, body, sandbox);
        if (result.status === 200) return;
        let reason = "";
        try {
          const parsed = JSON.parse(result.body) as { reason?: string };
          reason = parsed.reason ?? "";
        } catch {
          reason = "";
        }
        if (
          result.status === 410 ||
          reason === "BadDeviceToken" ||
          reason === "Unregistered"
        ) {
          await admin.from("push_device_tokens").delete().eq("token", row.token);
        } else {
          console.error("[push] apns", result.status, reason || result.body);
        }
      } catch (err) {
        console.error("[push] apns request", err);
      }
    })
  );
}
