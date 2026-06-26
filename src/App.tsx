import { useEffect, useState } from "react";

// ── 判定（モック・完全ローカル。外部には送りません）──
type Verdict = "safe" | "caution" | "danger";
type Result = { verdict: Verdict; reasons: string[]; score: number; hitokoto: string };

// あやしいサインと、やさしい言葉での説明
const FLAGS: { re: RegExp; reason: string }[] = [
  {
    re: /激安|最安|半額|格安|破格|大幅値下げ|９?0\s*%|90\s*%|80\s*%オフ|爆安/i,
    reason: "値段が安すぎるかも（ふつうより、かなり安い）",
  },
  {
    re: /評価なし|評価\s*[0-3]\s*件?|新規|出品したばかり|アカウント作成/i,
    reason: "売っている人の評価が少ない（信用の手がかりがとぼしい）",
  },
  {
    re: /前払い|先払い|銀行振込|振込|直接取引|手渡し|現金書留|LINE|ライン|別サイト|外部|コード番号/i,
    reason: "お金のはらい方があやしい（先ばらい・直接取引など）",
  },
  {
    re: /海外発送|中国|発送に\s*\d|2\s*週間|3\s*週間|届くまで|返品不可|ノークレーム|ＮＣ|NC\s*NR/i,
    reason: "返品できない・届くのが遅いなど、あとで困りやすい",
  },
  {
    re: /公式保証|正規品保証|本物保証|限定|今だけ|残りわずか|急いで|お早めに|早い者勝ち/i,
    reason: "「今だけ」「急いで」など、あせらせる言葉がある",
  },
  {
    re: /\.(xyz|top|shop|buzz|click|online|site)(\/|$)/i,
    reason: "サイトのアドレスが見なれない（よく確認）",
  },
];

const CONFIRM = ["売っている人の評価を見る", "ほかのお店と値段をくらべる", "口コミの日付と中身をよく読む"];

const HITOKOTO: Record<Verdict, string> = {
  safe: "大きなあやしい点は見つかりませんでした。それでも、買う前にもう一度だけ見ると安心です。",
  caution: "少し気になる点があります。あせらず、売っている人と値段をもう一度たしかめましょう。",
  danger: "あやしい点が多いです。今回は一度やめて、ほかのお店も見てみるのがおすすめです。",
};

function judge(text: string): Result {
  const matched = FLAGS.filter((f) => f.re.test(text)).map((f) => f.reason);
  const n = matched.length;
  const verdict: Verdict = n >= 3 ? "danger" : n >= 1 ? "caution" : "safe";
  const reasons = n === 0 ? ["とくにあやしい点は見つかりませんでした"] : matched.slice(0, 3);
  const score = n === 0 ? 92 : Math.max(10, 100 - n * 22);
  return { verdict, reasons, score, hitokoto: HITOKOTO[verdict] };
}

const VMETA: Record<Verdict, { label: string; emoji: string; bar: string; box: string; text: string }> = {
  safe: { label: "安全そう", emoji: "✅", bar: "bg-emerald-500", box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  caution: { label: "注意", emoji: "⚠️", bar: "bg-amber-500", box: "bg-amber-50 border-amber-300", text: "text-amber-700" },
  danger: { label: "やめた方がいい", emoji: "🛑", bar: "bg-rose-500", box: "bg-rose-50 border-rose-300", text: "text-rose-700" },
};

type HistoryItem = { id: number; date: string; verdict: Verdict; snippet: string };
const KEY = "kaumae-check:v1";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(history));
  }, [history]);

  const check = () => {
    const t = text.trim();
    if (t.length < 3) return;
    const r = judge(t);
    setResult(r);
    const now = new Date();
    setHistory((h) =>
      [{ id: Date.now(), date: `${now.getMonth() + 1}/${now.getDate()}`, verdict: r.verdict, snippet: t.slice(0, 24) }, ...h].slice(0, 10),
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-white">
      {/* ヘッダー */}
      <header className="bg-brand-soft px-6 pb-6 pt-9">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-[22px]">🛡️</span>
          <h1 className="text-[28px] font-bold text-ink">買う前AI確認</h1>
        </div>
        <p className="mt-2.5 text-[17px] leading-relaxed text-sub">
          買おうとしている物が、あやしくないか。AIが かわりに見ます。
        </p>
      </header>

      <main className="space-y-5 px-6 py-6">
        {/* 入力 */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="mb-2.5 text-[17px] font-bold text-ink">買いたい物のURLか、説明をはってください</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={"例) https://www.example.com/item123\nまたは 商品の説明を そのまま はってください"}
            className="w-full resize-none rounded-xl bg-gray-50 p-4 text-[16px] leading-relaxed text-ink outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-brand"
          />
        </section>

        <button
          onClick={check}
          className="w-full rounded-2xl bg-brand py-5 text-[20px] font-bold text-white shadow-sm transition active:opacity-80"
        >
          買う前に確認する
        </button>

        {result && (
          <>
            {/* 判定結果（一番大きく） */}
            <section className={`rounded-3xl border-2 ${VMETA[result.verdict].box} px-6 py-7 text-center`}>
              <div className="text-[56px] leading-none">{VMETA[result.verdict].emoji}</div>
              <p className={`mt-3 text-[34px] font-bold ${VMETA[result.verdict].text}`}>
                {VMETA[result.verdict].label}
              </p>
            </section>

            {/* AIのひとこと（判定のすぐ下） */}
            <section className="rounded-2xl bg-brand-soft p-5">
              <p className="text-[15px] font-bold text-brand">🤖 AIのひとこと</p>
              <p className="mt-2 text-[17px] leading-relaxed text-ink">{result.hitokoto}</p>
            </section>

            {/* あんしん度 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-end justify-between">
                <p className="text-[17px] font-bold text-ink">あんしん度</p>
                <p className={`text-[34px] font-bold leading-none ${VMETA[result.verdict].text}`}>
                  {result.score}
                  <span className="ml-0.5 text-[16px] text-sub">/100</span>
                </p>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${VMETA[result.verdict].bar}`} style={{ width: `${result.score}%` }} />
              </div>
            </section>

            {/* 気をつけること */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="mb-3 text-[17px] font-bold text-ink">🔍 気をつけること</p>
              <ul className="space-y-3">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[16px] leading-relaxed text-ink">
                    <span className="shrink-0">{result.verdict === "safe" ? "✅" : "⚠️"}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 買う前にすること */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
              <p className="mb-3 text-[17px] font-bold text-emerald-700">✓ 買う前にすること</p>
              <ul className="space-y-3">
                {CONFIRM.map((c) => (
                  <li key={c} className="flex gap-2.5 text-[16px] leading-relaxed text-ink">
                    <span className="shrink-0 text-emerald-600">☑</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* 履歴 */}
        {history.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="mb-3 text-[15px] font-bold text-sub">さいきん確認したもの</p>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-[14px] text-sub">
                  <span>{VMETA[h.verdict].emoji}</span>
                  <span className="truncate">{h.snippet || "（文章）"}</span>
                  <span className="ml-auto shrink-0 text-gray-400">{h.date}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="px-2 pb-6 pt-2 text-center text-[14px] leading-relaxed text-gray-400">
          ※ これはAIの参考意見です。さいごは自分で決めてください。
        </p>
      </main>
    </div>
  );
}
