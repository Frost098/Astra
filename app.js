// Astra app loader — concatenates parts
(async function(){
  const parts = ['./app.part1.js','./app.part2.js'];
  let code = '';
  for (const p of parts) {
    const r = await fetch(p + '?v=1');
    if (!r.ok) throw new Error('fail '+p);
    code += await r.text() + '\n';
  }
  const s = document.createElement('script');
  s.textContent = code;
  document.body.appendChild(s);
})().catch(e => console.error(e));
