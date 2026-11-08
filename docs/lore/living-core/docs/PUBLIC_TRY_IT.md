# Public Try it (drop-in)

Replace the README **Try it** section on `grok-bot-living-ceo` with this.
No webhook. No $. `simulatedBest` takes a **string** parent id.

```bash
git clone https://github.com/MatthewGRodriguez/grok-bot-living-ceo.git
cd grok-bot-living-ceo
node scripts/smoke.js
node -e "var rt=require('./src/runtime').createRuntime({rootDir:process.cwd()}); var s=rt.simulatedBest('ceo_next'); console.log('STRANGER_OK', s.top && s.top.id, 'n', (s.ranked||[]).length);"
```

Needs Node >= 18. Discord notify is optional and later:

```bash
python3 scripts/ceo-discord-notify.py test
```

Without a webhook that fails cleanly. Never print or commit webhook URLs.

Copy `scripts/stranger-first-run.js` from living-core if you want the one-file wrapper (same call).
