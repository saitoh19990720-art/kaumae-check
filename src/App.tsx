import { useEffect, useState } from "react";

// ── 判定ロジック（モック・完全ローカル。外部APIには繋がない）──
type Verdict = "safe" | "caution" | "danger";
type Result = { verdict: Verdict; reasons: string[] };

const FLAGS: { re: RegExp; reason: string }[] = [
  {
    re: /激安|最安|半額|格安|破格|大幅値下げ|９?0\s*%|90\s*%|80\s*%オフ|爆安/i,
    reason: "価格が市場相場より大幅に安い（相場の60%以下の可能性）",
  },
  {
    re: /評価なし|評価\s*[0-3]\s*件?|新規|出品したばかり|アカウント作成/i,
    reason: "出品者の評価件数が極端に少ない／新しいアカウント（3件以下）",
  },
  {
    re: /前払い|先払い|銀行振込|振込|直接取引|手渡し|現金書留|LINE|ライン|別サイト|外部|コード番号/i,
    reason: "支払いや連絡が不自然（前払い・直接取引・外部サイトへの誘導）",
  },
  {
    re: /海外発送|中国|発送に\s*\d|2\s*週間|3\s*週間|届くまで|返品不可|ノークレーム|ＮＣ|NC\s*NR/i,
    reason: "発送に時間がかかる／返品不可など、後戻りしづらい条件がある",
  },
  {
    re: /公式保証|正規品保証|本物保証|限定|今だけ|残りわずか|急いで|お早めに|早い者勝ち/i,
    reason: "「正規・限定・今だけ」など、急がせる/うますぎる表現がある",
  },
  {
    re: /\.(xyz|top|shop|buzz|click|online|site)(\/|$)/i,
    reason: "URLのドメインが、あまり見かけない種類（注意して確認）",
  },
];

const CONFIRM = [
  "出品者のプロフィール・評価を確認する",
  "他のショッピングサイトで同じ商品を比べる",
  "レビューの日付と内容をよく読む",
];

function judge(text: string): Result {
  const reasons = FLAGS.filter((f) => f.re.test(text)).map((f) => f.reason).slice(0, 4);
  let verdict: Verdict = "safe";
  if (reasons.length >= 3) verdict = "danger";
  else if (reasons.length >= 1) verdict = "caution";
  if (verdict === "safe") {
    reasons.push("目立った危険信号は見つかりませんでした。");
  }
  return { verdict, reasons };
}

const VMETA: Record<Verdict, { label: string; emoji: string; bar: string; box: string; text: string }> = {
  safe: { label: "安全そう", emoji: "✅", bar: "bg-emerald-500", box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  caution: { label: "注意", emoji: "⚠️", bar: "bg-amber-500", box: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  danger: { label: "やめた方がいい", emoji: "🛑", bar: "bg-rose-500", box: "bg-rose-50 border-rose-200", text: "text-rose-700" },
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
      [
        {
          id: Date.now(),
          date: `${now.getMonth() + 1}/${now.getDate()}`,
          verdict: r.verdict,
          snippet: t.slice(0, 24),
        },
        ...h,
      ].slice(0, 10),
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-white">
      {/* ヘッダー */}
      <header className="bg-brand-soft px-6 pb-6 pt-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[18px]">🛡️</span>
          <h1 className="text-[24px] font-bold text-ink">AI安全買い物チェッカー</h1>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-sub">
          商品URLや説明文を貼るだけで、怪しい点をAIが整理します
        </p>
      </header>

      <main className="space-y-5 px-6 py-6">
        {/* 入力 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="mb-2 text-[15px] font-bold text-ink">商品URLまたは説明文を貼り付けてください</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={"例) https://www.example.com/item123\nまたは商品の説明文をそのまま貼ってください"}
            className="w-full resize-none rounded-xl bg-gray-50 p-3.5 text-[15px] leading-relaxed text-ink outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-brand"
          />
        </section>

        <button
          onClick={check}
          className="w-full rounded-2xl bg-brand py-4 text-[18px] font-bold text-white shadow-sm transition active:opacity-80"
        >
          安全チェックする
        </button>

        {/* 判定結果 */}
        {result && (
          <>
            <section className={`overflow-hidden rounded-2xl border ${VMETA[result.verdict].box}`}>
              <div className="flex">
                <div className={`w-1.5 ${VMETA[result.verdict].bar}`} />
                <div className="px-4 py-3.5">
                  <p className={`text-[20px] font-bold ${VMETA[result.verdict].text}`}>
                    {VMETA[result.verdict].emoji} {VMETA[result.verdict].label}
                  </p>
                  <p className="mt-0.5 text-[15px] font-medium text-ink">
                    {result.verdict === "safe"
                      ? "目立った危険信号は見つかりませんでした"
                      : result.verdict === "caution"
                        ? "いくつか気になる点があります"
                        : "危険信号が多いです。慎重に"}
                  </p>
                </div>
              </div>
            </section>

            {/* 気になる点 */}
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="mb-3 text-[15px] font-bold text-ink">🔍 気になる点</p>
              <ul className="space-y-2.5">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                    <span className="shrink-0">{result.verdict === "safe" ? "✅" : "⚠️"}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 買う前に確認すること */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="mb-3 text-[15px] font-bold text-emerald-700">✓ 買う前に確認すること</p>
              <ul className="space-y-2.5">
                {CONFIRM.map((c) => (
                  <li key={c} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
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
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="mb-3 text-[14px] font-bold text-sub">最近チェックしたもの</p>
            <ul className="space-y-1.5">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-[13px] text-sub">
                  <span>{VMETA[h.verdict].emoji}</span>
                  <span className="truncate">{h.snippet || "（テキスト）"}</span>
                  <span className="ml-auto shrink-0 text-gray-400">{h.date}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="px-2 pb-4 pt-2 text-center text-[13px] leading-relaxed text-gray-400">
          ※ AIによる参考情報です。最終判断はご自身でお願いします。
        </p>
      </main>
    </div>
  );
}
