"""QA only: CPU rasterization of actual native Wasm solid-color triangle buffers.
Not a product renderer and not a browser/GPU screenshot. Meshes are exported by test.cjs.
"""
from pathlib import Path
import json,struct
import cairosvg
base=Path(__file__).parent
for d in sorted((base/'qa-mesh').iterdir()):
 state=d.name
 d=base/'qa-mesh'/state;m=json.loads((d/'slots.json').read_text());W=m['width'];H=m['height'];out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H+30}" viewBox="0 0 {W} {H+30}"><rect width="100%" height="100%" fill="white"/><text x="30" y="{H+19}" font-family="sans-serif" font-size="11" fill="#685b79">ILLUSTRATIVE TEST DATA. CPU native-mesh preview; not a browser or GPU screenshot.</text>']
 for slot,s in enumerate(m['slots']):
  vb=(d/f'{slot}-0.bin').read_bytes();gb=(d/f'{slot}-1.bin').read_bytes();rb=(d/f'{slot}-3.bin').read_bytes();vv=list(struct.iter_unpack('<ff4BI',vb));gg=list(struct.iter_unpack('<8f',gb));rr=list(struct.iter_unpack('<II',rb));runs=[];last=None
  for start,count in rr:
   for n in range(start,start+count,3):
    tri=vv[n:n+3]
    if len(tri)!=3:continue
    g=gg[tri[0][6]];col=tuple(tri[0][2:6]);assert all(tuple(v[2:6])==col for v in tri),'Non-solid triangle not supported by QA preview'
    key=(tri[0][6],col);cmd='M'+' L'.join(f'{v[0]+g[0]:.3f},{v[1]+g[1]:.3f}' for v in tri)+' Z'
    if runs and key==last:runs[-1][1].append(cmd)
    else:runs.append([key,[cmd]])
    last=key
  out.append(f'<defs><clipPath id="slot{slot}"><rect width="{s["w"]}" height="{s["h"]}"/></clipPath>')
  for i,g in enumerate(gg):out.append(f'<clipPath id="g{slot}_{i}"><rect x="{g[4]}" y="{g[5]}" width="{max(0,g[6]-g[4])}" height="{max(0,g[7]-g[5])}"/></clipPath>')
  out.append(f'</defs><g transform="translate({s["x"]},{s["y"]})" clip-path="url(#slot{slot})">')
  for (gi,col),cmds in runs:out.append(f'<path clip-path="url(#g{slot}_{gi})" fill="rgb({col[0]},{col[1]},{col[2]})" opacity="{col[3]/255}" d="{' '.join(cmds)}"/>')
  out.append('</g>')
 out.append('</svg>');svg=''.join(out);(base/f'cpu-mesh-{state}.svg').write_text(svg);cairosvg.svg2png(bytestring=svg.encode(),write_to=str(base/f'cpu-mesh-{state}.png'))
 print(state,W,H,len(vv),'last-slot native vertices')
