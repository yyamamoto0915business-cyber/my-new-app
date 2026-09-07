import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  StripeTerminalProvider,
  useStripeTerminal,
} from "@stripe/stripe-terminal-react-native";
import * as Linking from "expo-linking";
import { API_URL, supabase } from "./config";

let accessToken = "";

async function fetchConnectionToken() {
  const res = await fetch(`${API_URL}/api/organizer/pos/terminal/connection-token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok || typeof json.secret !== "string") {
    throw new Error(json.error || "接続トークンを取得できませんでした");
  }
  return json.secret;
}

function saleIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const fromQuery = parsed.queryParams?.saleId;
    return typeof fromQuery === "string" && fromQuery ? fromQuery : null;
  } catch {
    return null;
  }
}

function CollectScreen({
  saleId,
  onNeedLogin,
}: {
  saleId: string | null;
  onNeedLogin: () => void;
}) {
  const [status, setStatus] = useState("準備しています…");
  const [busy, setBusy] = useState(false);

  const {
    initialize,
    discoverReaders,
    connectReader,
    retrievedPaymentIntent,
    retrievePaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
  } = useStripeTerminal();

  const startCollect = useCallback(
    async (id: string) => {
      if (!accessToken) {
        onNeedLogin();
        return;
      }
      setBusy(true);
      setStatus("決済情報を読み込んでいます…");
      try {
        const init = await initialize();
        if (init?.error) throw new Error(init.error.message);

        const res = await fetch(
          `${API_URL}/api/organizer/pos/terminal/session?saleId=${encodeURIComponent(id)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "会計を取得できませんでした");
        if (json.alreadyPaid) {
          setStatus("この会計は支払い済みです");
          return;
        }

        setStatus("iPhoneタッチを起動しています…");
        const discovered = await discoverReaders({
          discoveryMethod: "tapToPay",
          locationId: json.locationId,
        });
        if (discovered.error) throw new Error(discovered.error.message);
        const reader = discovered.readers?.[0];
        if (!reader) throw new Error("この iPhone ではタッチ決済を開始できませんでした");

        const connected = await connectReader(
          { reader, locationId: json.locationId },
          "tapToPay"
        );
        if (connected.error) throw new Error(connected.error.message);

        setStatus("カードを iPhone の上部にかざしてください…");
        const retrieved = await retrievePaymentIntent(json.clientSecret);
        if (retrieved.error) throw new Error(retrieved.error.message);

        const collected = await collectPaymentMethod({
          paymentIntent: retrieved.paymentIntent ?? retrievedPaymentIntent,
        });
        if (collected.error) throw new Error(collected.error.message);

        const confirmed = await confirmPaymentIntent({
          paymentIntent: collected.paymentIntent,
        });
        if (confirmed.error) throw new Error(confirmed.error.message);

        setStatus("支払いが完了しました。ウェブのレジに戻ってください。");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "タッチ決済に失敗しました");
      } finally {
        setBusy(false);
      }
    },
    [
      collectPaymentMethod,
      confirmPaymentIntent,
      connectReader,
      discoverReaders,
      initialize,
      onNeedLogin,
      retrievePaymentIntent,
      retrievedPaymentIntent,
    ]
  );

  useEffect(() => {
    if (saleId) void startCollect(saleId);
  }, [saleId, startCollect]);

  return (
    <View>
      {busy ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      <Pressable
        style={styles.btn}
        disabled={busy || !saleId}
        onPress={() => saleId && void startCollect(saleId)}
      >
        <Text style={styles.btnText}>
          {saleId ? "カードを待つ" : "レジからの起動を待っています"}
        </Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

export function TapApp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("主催者アカウントでログインしてください");
  const [saleId, setSaleId] = useState<string | null>(null);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const id = saleIdFromUrl(url);
      if (id) setSaleId(id);
    });
    void Linking.getInitialURL().then((url) => {
      const id = saleIdFromUrl(url);
      if (id) setSaleId(id);
    });
    return () => sub.remove();
  }, []);

  async function handleLogin() {
    if (!supabase) {
      setStatus("Supabase の接続設定がありません");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error || !data.session) {
      setStatus(error?.message || "ログインに失敗しました");
      return;
    }
    accessToken = data.session.access_token;
    setLoggedIn(true);
    setStatus("ログインしました。カードをかざす準備ができます。");
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>カードタッチ</Text>
      <Text style={styles.lead}>
        Visa などのカードを、この iPhone の上部にかざします。Suica・iD・QUICPay は使えません。
      </Text>
      {!loggedIn ? (
        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="メールアドレス"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="パスワード"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.btn} onPress={() => void handleLogin()} disabled={busy}>
            <Text style={styles.btnText}>{busy ? "処理中…" : "ログイン"}</Text>
          </Pressable>
          <Text style={styles.status}>{status}</Text>
        </View>
      ) : (
        <StripeTerminalProvider logLevel="verbose" tokenProvider={fetchConnectionToken}>
          <CollectScreen saleId={saleId} onNeedLogin={() => setLoggedIn(false)} />
        </StripeTerminalProvider>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#f5f8f5",
    paddingTop: 72,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a2214",
  },
  lead: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#566358",
  },
  form: { marginTop: 28, gap: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dde8df",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#2d7a4f",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  status: { marginTop: 24, fontSize: 14, lineHeight: 20, color: "#3d4a40" },
});
