import type { Locale } from "@/lib/i18n";
import { GAME_SPOT_CATEGORY_LABEL, type GameSpotCategory } from "@/lib/organizer/game-experience";

/** 参加画面のシステム文言。主催者が書いた題名・問題・ヒントは対象外。 */
const EXACT: Record<string, string> = {
  "ゲームが見つかりません": "Game not found",
  "データベースに接続できません": "Can’t reach the database",
  "ゲームの取得に失敗しました": "Couldn’t load the game",
  "参加処理を開始できません": "Couldn’t start joining",
  "参加に失敗しました": "Couldn’t join",
  "参加できませんでした": "Couldn’t join",
  "Invalid JSON": "Couldn’t read that request",
  "スポットが見つかりません": "Spot not found",
  "スポットの取得に失敗しました": "Couldn’t load the spot",
  "スタンプを押せません": "Couldn’t stamp",
  "スタンプを押せませんでした": "Couldn’t stamp",
  "スタンプに失敗しました": "Couldn’t stamp",
  "読み込みに失敗しました": "Couldn’t load",
  "先に参加用QRから入ってください": "Join from the participation QR first",
  "先に参加用QRからニックネームと合言葉を入れてください": "Enter a nickname and passphrase from the participation QR first",
  "このラリーには入れません": "You can’t join this rally",
  "まだこちらは押せません": "You can’t stamp here yet",
  "先のスポットを巡ってください": "Visit the earlier spot first",
  "このスポットは、いま公開されていません": "This spot isn’t open right now",
  "キーワードが違います": "That keyword doesn’t match",
  "キーワードを入れてください": "Enter the keyword",
  "キーワードがまだ入っていません。": "The keyword isn’t set yet.",
  "もう少し近づいてください": "Come a little closer",
  "現在地を確認してから、スタンプを押してください": "Check your location, then stamp",
  "この端末では現在地を取れません": "This device can’t share its location",
  "現在地を取得できませんでした。位置情報を許可して、もう一度押してください。":
    "Couldn’t get your location. Allow location access and try again.",
  "通信エラーが発生しました": "Connection problem. Try again.",
  "合言葉が違います": "That passphrase doesn’t match",
  "現在地を確認してください": "Check your location",
  "チェックポイントに着いてから答えてください": "Reach the checkpoint before answering",
  "チェックポイントを確かめられませんでした": "Couldn’t check the checkpoint",
  "チェックポイント": "Checkpoint",
  "この場所に着くと、問題が出ます。": "The question opens when you reach this place.",
  "着いたら、現在地で確かめます。": "When you arrive, we’ll check your location.",
  "現地にある合言葉を入れると、問題が開きます。": "Enter the passphrase posted at the spot to open the question.",
  "現在地で確かめる": "Check my location",
  "現在地を確認しています…": "Checking your location…",
  "問題を開く": "Open the question",
  "合言葉": "Passphrase",
  "着きました。問題に答えてください。": "You made it. Answer the question.",
  "もう一周できません": "Can’t play another round",
  "もう一周できませんでした": "Couldn’t start another round",
  "もう一周の準備ができていません": "Another round isn’t ready yet",
  "このラリーは1回までです": "This rally can be played once",
  "クリアしてから、もう一周できます": "Clear it first, then you can play again",
  "再開できませんでした": "Couldn’t resume",
  "再開に失敗しました": "Couldn’t resume",
  "合言葉がリセットされました。参加用QRから入り直してください":
    "The passphrase was reset. Join again from the participation QR",
  "合言葉が違います。忘れたときは主催者にリセットを頼んでください。":
    "That passphrase doesn’t match. Ask the organizer to reset it if you’ve forgotten.",
  "そのニックネームは使われています。合言葉を入れて再開してください。":
    "That nickname is taken. Enter the passphrase to continue.",
  "このニックネームは、別のアカウントで参加しています。": "This nickname is used by another account.",
  "このアカウントでは、別のニックネームで参加しています。": "This account is already playing under another nickname.",
  "ニックネームを入力してください": "Enter a nickname",
  "1人1回のラリーは、ログインしたアカウントで参加してください": "Log in to join this one-time rally",
  "参加パスを持っているアカウントでログインしてください": "Log in with an account that holds a participation pass",
  "イベントに参加しているアカウントでログインしてください": "Log in with an account that’s joined the event",
  "このラリーの対象イベントがまだ決まっていません": "This rally isn’t linked to an event yet",
  "このラリーは、対象イベントの参加者だけが入れます": "Only people who joined the event can enter",
  "このラリーは、参加パスを持っている人だけが入れます": "Only people with a participation pass can enter",
  "問題が見つかりません": "Question not found",
  "選択肢を選んでください": "Choose an answer",
  "回答を保存できませんでした": "Couldn’t save your answer",
  "ミッションが見つかりません": "Mission not found",
  "達成を保存できませんでした": "Couldn’t save that",
  "合言葉を入れてください": "Enter the passphrase",
  "撮影スポットが見つかりません": "Photo spot not found",
  "記録を保存できませんでした": "Couldn’t save that",
  "店舗が見つかりません": "Shop not found",
  "謎が見つかりません": "Puzzle not found",
  "まえの謎からどうぞ。": "Start with the previous puzzle.",
  "答えを入れてください": "Enter an answer",
  "答えを保存できませんでした": "Couldn’t save your answer",
  "ちがいます。もう一度どうぞ。": "Not quite. Try again.",
  "正解です。記録しました。": "Correct. Saved.",
  "スタンプラリー": "Stamp rally",
  "クイズラリー": "Quiz rally",
  "謎解き街歩き": "Mystery walk",
  "ミッション": "Mission",
  "フォトラリー": "Photo rally",
  "クーポンラリー": "Coupon rally",
  "チェックイン": "Check-in",
  "スタンプ": "Stamp",
  "ゴール": "Goal",
  "キーワード": "Keyword",
  "スポットに行く": "Visit a spot",
  "写真を投稿": "Post a photo",
  "キーワード入力": "Enter a keyword",
  "クイズに答える": "Answer a quiz",
  "友だちと参加": "Join with a friend",
  "写真を残す": "Save a photo",
  "チェックインする": "Check in",
  "答えた": "Answered",
  "一緒に参加した": "Joined together",
  "答える": "Answer",
  "着いた": "I’ve arrived",
  "QRを読み取った": "Scanned the QR",
  "この場所にいる": "I’m here",
  "ここに来た": "I came here",
  "撮影スポット": "Photo spot",
  "ラリーをはじめる": "Start the rally",
  "コンプリート！": "Complete!",
  "クーポンを受け取れます。": "You can collect a coupon.",
  "会場でクーポンを受け取れます。": "Collect your coupon at the venue.",
  "順位は、結果の画面で見られます。": "Your rank is on the results screen.",
  "ポイントが残ります。": "Points will be saved.",
  "スタンプが残ります。": "A stamp will be saved.",
  "景品を受け取れます。": "You can collect a prize.",
  "景品と引き換えできます。": "You can redeem a prize.",
  "会場で受け取れます。": "Collect it at the venue.",
  "クーポンの併用はできません。": "Coupons can’t be combined.",
  "リンクをコピーしました": "Link copied",
  "共有できませんでした": "Couldn’t share",
};

const PATTERNS: { re: RegExp; en: (match: RegExpMatchArray) => string }[] = [
  {
    re: /^もう少し近づいてください。あと約(\d+)mです。$/,
    en: (match) => `A little closer. About ${match[1]} m to go.`,
  },
  {
    re: /^もう少し近づいてください。あと約([\d.]+)kmです。$/,
    en: (match) => `A little closer. About ${match[1]} km to go.`,
  },
  {
    re: /^先に「(.+)」を巡ってください$/,
    en: (match) => `Visit “${match[1]}” first`,
  },
  {
    re: /^このアカウントは、ニックネーム「(.+)」で参加しています。$/,
    en: (match) => `This account is playing as “${match[1]}”.`,
  },
  {
    re: /^ニックネームは(\d+)文字以内です$/,
    en: (match) => `Nicknames can be up to ${match[1]} characters`,
  },
  {
    re: /^合言葉は(\d+)文字以上にしてください$/,
    en: (match) => `Use at least ${match[1]} characters for the passphrase`,
  },
  {
    re: /^合言葉は(\d+)文字以内です$/,
    en: (match) => `Passphrases can be up to ${match[1]} characters`,
  },
  {
    re: /^(\d+)ポイントが残ります。$/,
    en: (match) => `${match[1]} points will be saved.`,
  },
  {
    re: /^(.+)で受け取れます。$/,
    en: (match) => `Collect it at ${match[1]}.`,
  },
  {
    re: /^特典：(.+)$/,
    en: (match) => `Reward: ${match[1]}`,
  },
  {
    re: /^クーポン：(.+)$/,
    en: (match) => `Coupon: ${match[1]}`,
  },
  {
    re: /^ポイント：(.+)$/,
    en: (match) => `Points: ${match[1]}`,
  },
  {
    re: /^バッジ：(.+)$/,
    en: (match) => `Badge: ${match[1]}`,
  },
  {
    re: /^名前だけ：(.+)$/,
    en: (match) => `Reward: ${match[1]}`,
  },
  {
    re: /^(.+) 〜 (.+)$/,
    en: (match) => `${match[1]} – ${match[2]}`,
  },
  {
    re: /^(.+) から$/,
    en: (match) => `From ${match[1]}`,
  },
  {
    re: /^(.+) まで$/,
    en: (match) => `Until ${match[1]}`,
  },
];

export function localizePlayMessage(locale: Locale, message: string): string {
  if (locale !== "en" || !message) return message;
  const exact = EXACT[message];
  if (exact) return exact;
  for (const pattern of PATTERNS) {
    const match = message.match(pattern.re);
    if (match) return pattern.en(match);
  }
  return message;
}

export function playCopy(locale: Locale) {
  const en = locale === "en";
  const msg = (message: string) => localizePlayMessage(locale, message);
  return {
    locale,
    msg,
    loading: en ? "Loading…" : "読み込み中です…",
    preparingStamp: en ? "Preparing your stamp…" : "スタンプを準備しています…",
    gameMissing: en ? "Game not found" : "ゲームが見つかりません",
    login: en ? "Log in" : "ログインする",
    join: en ? "Join" : "参加する",
    joining: en ? "Joining…" : "入っています…",
    backToStart: en ? "Back to the start" : "スタート画面に戻る",
    toApp: en ? "App" : "アプリへ",
    backToCard: en ? "Back to your stamp card" : "スタンプ帳へ戻る",
    backToList: en ? "Back to the list" : "一覧へ戻る",
    share: en ? "Share" : "シェアする",
    freeToJoin: en ? "Free to join" : "参加無料",
    nickname: en ? "Nickname" : "ニックネーム",
    passphrase: en ? "Passphrase" : "合言葉",
    showSecret: en ? "Show" : "表示",
    hideSecret: en ? "Hide" : "隠す",
    joinBeforeStamp: en ? "Join before you stamp." : "スタンプの前に、参加します。",
    joinWithWords: en ? "Join with a nickname and passphrase." : "ニックネームと合言葉で参加します。",
    signedInOnce: en ? "You’re signed in. This account can join once." : "ログイン中です。このアカウントで1回参加できます。",
    onceNeedsLogin: en ? "One play per person. Join with a signed-in account." : "1人1回です。ログインしたアカウントで参加します。",
    checkingEvent:
      en ? "We’ll check that this account joined the event." : "ログイン中のアカウントが、対象イベントの参加者か確認します。",
    eventAccount: en ? "Join with an account that’s in the event." : "対象イベントに参加しているアカウントで入れます。",
    checkingPass: en ? "We’ll check that this account holds a pass." : "ログイン中のアカウントが、参加パスを持っているか確認します。",
    passAccount: en ? "Join with an account that holds a pass." : "参加パスを持っているアカウントで入れます。",
    replay: en ? "Play again" : "もう一周する",
    replaying: en ? "Starting…" : "はじめています…",
    replayConfirm: en
      ? "Collect the stamps again from the start. Rewards you already earned stay as they are. Continue?"
      : "スタンプを最初から集め直します。特典は、このままです。よろしいですか？",
    spotsSoon: en ? "Spots will be added" : "スポットはこれから置かれます",
    spotsPreparing: en ? "Spots are being prepared" : "スポット準備中",
    next: en ? "Next" : "つぎ",
    justStamped: en ? "Just stamped" : "いま押した",
    goal: en ? "Goal" : "ゴール",
    allCollected: en ? "You collected them all. Well done." : "全部集まりました。お疲れさまでした。",
    goalCollected: en ? "You reached the goal. Well done." : "目標の数まで集まりました。お疲れさまでした。",
    placeKeyword: en ? "Keyword for this place" : "この場所のキーワード",
    checking: en ? "Checking…" : "確認しています…",
    stampHere: en ? "Stamp" : "スタンプを押す",
    stampNearby: en ? "Stamp at this place" : "この場所の近くで押せます。",
    locating: en ? "Checking your location…" : "現在地を確認しています…",
    stampWithLocation: en ? "Stamp with your location" : "現在地でスタンプを押す",
    thisPlace: en ? "This place" : "この場所",
    openInMaps: en ? "Open in maps" : "地図アプリで開く",
    hintLabel: en ? "Hint" : "ヒント",
    used: en ? "Used" : "使用済み",
    showCode: en ? "Show this code at the shop" : "店でこのコードを見せてください",
    pointsLand: en ? "They’ll be added to the signed-in account" : "ログイン中のアカウントに入ります",
    loginToClaim: en ? "Log in to collect" : "ログインして受け取る",
    badgeGot: en ? "You received a badge" : "バッジを受け取りました",
    seeBadges: en ? "See your badges" : "もらったバッジを見る",
    badgeStays: en ? "It stays on the signed-in account" : "ログイン中のアカウントに残ります",
    seePoints: en ? "See my points" : "マイポイントを見る",
    cleared: en ? "Clear" : "クリア",
    noQuestions: en ? "No questions yet." : "問題がまだありません。",
    noPuzzles: en ? "No puzzles yet." : "謎がまだありません。",
    seeResults: en ? "See results" : "結果を見る",
    nextQuestion: en ? "Next question" : "次の問題へ",
    nextPuzzle: en ? "Next puzzle" : "次の謎へ",
    correctSaved: en ? "Correct. Saved." : "正解です。記録しました。",
    answerPlaceholder: en ? "Answer" : "答え",
    keywordPlaceholder: en ? "Keyword" : "キーワード",
    recording: en ? "Saving…" : "記録しています…",
    recorded: en ? "Saved" : "記録しました",
    visited: en ? "Visited" : "寄りました",
    achieved: en ? "Done" : "達成",
    stopBy: en ? "Stop by this shop" : "この店に寄る",
    quizDone: en ? "Quiz complete" : "クイズ完了",
    missionDone: en ? "Missions complete" : "ミッション完了",
    photoDone: en ? "Photos complete" : "フォト完了",
    couponDone: en ? "Coupon earned" : "クーポン獲得",
    checkinDone: en ? "Check-in complete" : "チェックイン完了",
    mysteryDone: en ? "Mystery complete" : "謎解き完了",
    correctCount: en ? "correct" : "正解",
    places: en ? "spots" : "か所",
    shops: en ? "shops" : "店舗",
    questions: en ? "questions" : "問",
    doneWord: en ? "done" : "達成",
    player(name: string) {
      return en ? name : `${name}さん`;
    },
    accountPlaying(name: string) {
      return en ? `This account is playing as “${name}”.` : `このアカウントは「${name}」で参加しています。`;
    },
    withinRadius(meters: number) {
      return en ? `You can stamp within ${meters} m.` : `半径${meters}m以内で押せます。`;
    },
    nearRadius(meters: number) {
      return en ? `Around a ${meters} m radius.` : `半径 ${meters}m のあたりです。`;
    },
    placeOf(name: string) {
      return en ? `Location of ${name}` : `${name}の場所`;
    },
    alreadyStamped(name: string) {
      return en ? `${name} is already stamped` : `${name}は、すでに押してあります`;
    },
    stampedName(name: string) {
      return en ? `Stamped ${name}` : `${name}のスタンプを押しました`;
    },
    pointsGot(amount: number) {
      return en ? `You received ${amount} points` : `${amount}ポイントを受け取りました`;
    },
    pointsReady(amount: number) {
      return en ? `You can receive ${amount} points` : `${amount}ポイントを受け取れます`;
    },
    badgeReady(name: string) {
      return en ? `You can receive ${name}` : `${name}を受け取れます`;
    },
    rankLine(rank: number) {
      return en ? `Rank ${rank}` : `${rank}位です`;
    },
    quizScore(total: number, correct: number) {
      return en
        ? `You got ${correct} of ${total} right. Well done.`
        : `${total}問中${correct}問、正解しました。お疲れさまでした。`;
    },
    missionScore(total: number, done: number) {
      return en
        ? `You finished ${done} of ${total}. Well done.`
        : `${total}件中${done}件、達成しました。お疲れさまでした。`;
    },
    photoScore(total: number, done: number) {
      return en
        ? `You saved photos at ${done} of ${total} spots. Well done.`
        : `${total}か所中${done}か所、写真を残しました。お疲れさまでした。`;
    },
    checkinScore(total: number, done: number) {
      return en
        ? `You checked in at ${done} of ${total} spots. Well done.`
        : `${total}か所中${done}か所を記録しました。お疲れさまでした。`;
    },
    mysteryScore(total: number, solved: number) {
      return en
        ? `You solved ${solved} of ${total}. Well done.`
        : `${total}問中${solved}問、解けました。お疲れさまでした。`;
    },
    shopsVisited(count: number) {
      return en ? `You visited ${count} shops.` : `${count}店舗をまわりました。`;
    },
    quizMeta(questions: number, clear: number) {
      return en
        ? `${questions} questions · clear with ${clear} or more`
        : `${questions}問 · ${clear}問以上でクリア`;
    },
    missionMeta(count: number, clear: number) {
      return en ? `${count} missions · clear with ${clear} or more` : `${count}件 · ${clear}件以上でクリア`;
    },
    photoMeta(count: number, clear: number) {
      return en ? `${count} spots · clear with ${clear} or more` : `${count}か所 · ${clear}か所以上でクリア`;
    },
    couponMeta(count: number, needed: number) {
      return en ? `${count} shops · coupon at ${needed}` : `${count}店舗 · ${needed}店舗でクーポン`;
    },
    checkinMeta(count: number, needed: number) {
      return en ? `${count} spots · clear with ${needed} or more` : `${count}か所 · ${needed}か所以上でクリア`;
    },
    mysteryMeta(count: number, needed: number) {
      return en ? `${count} puzzles · clear with ${needed} or more` : `${count}問 · ${needed}問以上でクリア`;
    },
    spotMeta(count: number) {
      return en ? `${count} spots` : `スポット ${count} か所`;
    },
    rally: {
      tabHome: en ? "Home" : "ホーム",
      tabMap: en ? "Map" : "マップ",
      tabScan: en ? "Scan" : "読み取る",
      tabReward: en ? "Reward" : "特典",
      tabMe: en ? "My page" : "マイページ",
      stampStatus: en ? "Stamps collected" : "スタンプ獲得状況",
      stampBook: en ? "Stamp book" : "スタンプ帳",
      nextPick: en ? "Recommended next spot" : "次に行くおすすめスポット",
      seeOnMap: en ? "See it on the map" : "マップで場所を見る",
      allDone: en ? "Every stamp collected!" : "すべてのスタンプを集めました！",
      map: en ? "Map" : "地図",
      list: en ? "List" : "リスト",
      filterAll: en ? "All" : "すべて",
      filterOpen: en ? "Not yet" : "未獲得",
      filterDone: en ? "Collected" : "獲得済み",
      filterNear: en ? "Nearest" : "近い順",
      noPins: en ? "No spots have a map pin yet." : "地図にピンのあるスポットはまだありません。",
      noSpots: en ? "No spots match." : "該当するスポットはありません。",
      locating: en ? "Finding your location…" : "現在地を確認しています…",
      locateFailed: en
        ? "Couldn’t get your location. Allow location access in your settings."
        : "現在地を取得できませんでした。位置情報の利用を許可してください。",
      myLocation: en ? "Show my location" : "現在地を表示",
      details: en ? "Details" : "詳細を見る",
      hint: en ? "Hint" : "ヒント",
      checkinHow: en ? "How to check in" : "チェックイン方法",
      checkinQr: en ? "QR code" : "QRコード",
      checkinQrNote: en
        ? "Scan the QR code posted at the spot to get the stamp."
        : "設置されたQRコードを読み取ってスタンプを獲得できます。",
      checkinGps: en ? "GPS" : "GPSチェックイン",
      checkinGpsNote: en
        ? "Scan the QR code at the spot, then check in near the pin."
        : "現地のQRコードを読み取り、ピンの近くでチェックインします。",
      checkinKeyword: en ? "Keyword" : "キーワード",
      checkinKeywordNote: en
        ? "Scan the QR code at the spot, then enter the keyword you find there."
        : "現地のQRコードを読み取り、その場所で見つけたキーワードを入れます。",
      scanQr: en ? "Scan the QR code" : "QRコードを読み取る",
      openMaps: en ? "Open in Maps" : "地図アプリで開く",
      stamped: en ? "Collected" : "獲得済み",
      scanTitle: en ? "Scan the QR code at the spot" : "スポットのQRコードを読み取る",
      scanLead: en
        ? "Open your phone’s camera and point it at the QR code posted at the spot. The stamp page opens automatically."
        : "スマホのカメラを起動して、スポットに設置されたQRコードに向けてください。スタンプ画面が自動でひらきます。",
      scanStarting: en ? "Starting the camera…" : "カメラを起動しています…",
      scanAim: en ? "Fit the spot’s QR code inside the frame" : "スポットのQRコードを枠内に合わせてください",
      scanFound: en ? "Got it. Opening the stamp…" : "読み取りました。スタンプを押しています…",
      scanWrong: en
        ? "That isn’t a game QR code. Scan the one posted at the spot."
        : "ゲームのQRコードではありません。スポットに設置されたQRコードを読み取ってください",
      scanDenied: en
        ? "Camera access isn’t allowed. You can still scan with your phone’s camera app."
        : "カメラの使用が許可されていません。スマホのカメラアプリでも読み取れます。",
      scanNoCamera: en
        ? "The camera can’t be used here. You can still scan with your phone’s camera app."
        : "ここではカメラを使えません。スマホのカメラアプリでも読み取れます。",
      scanStep1: en ? "Open the camera app" : "カメラアプリをひらく",
      scanStep2: en ? "Point it at the QR code" : "QRコードに向ける",
      scanStep3: en ? "Tap the link that appears" : "表示されたリンクをタップ",
      stampGet: en ? "Stamp GET!" : "スタンプGET!",
      alreadyGot: en ? "Already collected" : "獲得済みのスタンプです",
      nextSpot: en ? "Next spot" : "つぎのスポットへ",
      seeBook: en ? "See the stamp book" : "スタンプ帳をみる",
      toReward: en ? "Get your reward" : "特典を受け取る",
      congrats: en ? "Congratulations!" : "おめでとう！",
      complete: en ? "Complete!" : "コンプリート！",
      rewardLocked: en ? "Collect the stamps to unlock the reward" : "スタンプを集めると特典がもらえます",
      rewardTitle: en ? "Reward" : "特典",
      playerName: en ? "Nickname" : "ニックネーム",
      language: en ? "Language" : "言語",
      progressLabel: en ? "Progress" : "進捗",
      close: en ? "Close" : "閉じる",
      back: en ? "Back" : "戻る",
      eventInfo: en ? "About this event" : "イベントについて",
      route: en ? "Directions" : "ルート案内",
      media: en ? "Photos & video" : "写真・動画",
      related: en ? "Nearby spots" : "近くのスポット",
      favorite: en ? "Favorite" : "お気に入り",
      stampHere: en ? "Get the stamp at this spot" : "このスポットでスタンプを獲得する",
      copied: en ? "Link copied" : "リンクをコピーしました",
      shareFailed: en ? "Couldn’t share" : "共有できませんでした",
    },
    spotCategory(category: GameSpotCategory) {
      if (!en) return GAME_SPOT_CATEGORY_LABEL[category];
      return {
        food: "Food & café",
        shop: "Shops",
        sightseeing: "Sightseeing",
        culture: "Culture",
        event: "Events & festivals",
        stamp: "Stamp spot",
        stay: "Stay",
        nature: "Nature & leisure",
        sports: "Sports & activities",
        transport: "Transport & more",
      }[category];
    },
    spotCategoryShort(category: GameSpotCategory) {
      if (en) {
        return {
          food: "Food",
          shop: "Shops",
          sightseeing: "Sights",
          culture: "Culture",
          event: "Events",
          stamp: "Stamps",
          stay: "Stay",
          nature: "Nature",
          sports: "Sports",
          transport: "Transport",
        }[category];
      }
      return {
        food: "グルメ",
        shop: "お店",
        sightseeing: "観光",
        culture: "文化",
        event: "イベント",
        stamp: "スタンプ",
        stay: "宿泊",
        nature: "自然",
        sports: "スポーツ",
        transport: "交通",
      }[category];
    },
    walkMinutes(meters: number) {
      // 直線距離に道の曲がりぶんを足し、分速80mで見積もる。
      const minutes = Math.max(1, Math.round((meters * 1.3) / 80));
      return en ? `About ${minutes} min walk` : `徒歩 約${minutes}分`;
    },
    rallyLeft(left: number) {
      return en ? `${left} more to complete!` : `あと ${left} 個でコンプリート！`;
    },
    rallyDistance(meters: number) {
      if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
      return `${(meters / 1000).toFixed(1)} km`;
    },
    wrongHint(hint: string) {
      if (!en) return hint.startsWith("ちがいます") ? hint : `ちがいます。${hint}`;
      if (hint === "ちがいます。もう一度どうぞ。") return "Not quite. Try again.";
      const rest = hint.replace(/^ちがいます[。.]?\s*/, "");
      return rest ? `Not quite. ${rest}` : "Not quite. Try again.";
    },
  };
}
