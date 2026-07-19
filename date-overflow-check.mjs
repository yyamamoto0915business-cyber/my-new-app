import { chromium } from 'playwright';

const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
</head><body class="bg-[#f5f4f0] p-4" style="width:390px">
  <div id="card" class="mb-2 min-w-0 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white p-3">
    <div class="min-w-0 space-y-3">
      <div>
        <div class="mb-1.5 text-[11px] text-[#888]">開催日</div>
        <input id="date" type="date" value="2026-08-05"
          class="w-full max-w-full min-w-0 rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2 text-[13px]" />
      </div>
      <div class="grid min-w-0 grid-cols-2 gap-3 [&>*]:min-w-0">
        <div>
          <div class="mb-1.5 text-[11px] text-[#888]">開始時刻</div>
          <input id="start" type="time" value="12:35"
            class="w-full max-w-full min-w-0 rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2 text-[13px]" />
        </div>
        <div>
          <div class="mb-1.5 text-[11px] text-[#888]">終了（任意）</div>
          <input id="end" type="time"
            class="w-full max-w-full min-w-0 rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2 text-[13px]" />
        </div>
      </div>
    </div>
  </div>
  <div id="pass" class="min-w-0 space-y-3.5 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white p-3">
    <input id="deadline" type="date"
      class="w-full max-w-full min-w-0 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[14px] py-[10px] text-[13px]" />
  </div>
</body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.setContent(html);
await page.waitForTimeout(800);

const result = await page.evaluate(() => {
  const check = (inputId, cardId) => {
    const input = document.getElementById(inputId);
    const card = document.getElementById(cardId);
    const ir = input.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    return {
      id: inputId,
      inputRight: Math.round(ir.right * 10) / 10,
      cardRight: Math.round(cr.right * 10) / 10,
      overflows: ir.right > cr.right + 0.5,
      inputWidth: Math.round(ir.width),
    };
  };
  return [
    check('date', 'card'),
    check('start', 'card'),
    check('end', 'card'),
    check('deadline', 'pass'),
  ];
});

console.log(JSON.stringify(result, null, 2));
const failed = result.filter((r) => r.overflows);
if (failed.length) {
  console.error('OVERFLOW DETECTED');
  process.exitCode = 1;
} else {
  console.log('OK: no overflow');
}
await browser.close();
