#!/usr/bin/env python3
"""Inject sidecar sources into exp7-platform-lean.html (and pack budgetpkg).

Shipped tree remains the lean HTML file plus release.json. This tool rewrites
named <script data-exp7-shared="..."> bodies and the budgetpkg base64 blob.
"""
from __future__ import annotations
import argparse, base64, hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # repo root (exp7-platform git root)
# parents: tools -> budget-src -> exp7-platform (dir) -> repo root? 
# file: repo/exp7-platform/budget-src/tools/inject.py
# parents[0]=tools, [1]=budget-src, [2]=exp7-platform (dir containing lean), [3]=repo root
SRC = Path(__file__).resolve().parents[1]
LEAN_DIR = Path(__file__).resolve().parents[2]
LEAN = LEAN_DIR / "exp7-platform-lean.html"
RELEASE = LEAN_DIR / "release.json"

SCRIPTS = {
    "budget-rules": SRC / "scripts" / "budget-rules.js",
    "budget-flows": SRC / "scripts" / "budget-flows.js",
    "journal-views": SRC / "scripts" / "journal-views.js",
    "eval": SRC / "scripts" / "eval.js",
}
BUDGETPKG = SRC / "app" / "budgetpkg.html"


def normalize_js(text: str) -> str:
    text = text.replace("\r\n", "\n")
    if not text.startswith("\n"):
        text = "\n" + text
    if not text.endswith("\n"):
        text = text + "\n"
    return text


def replace_shared(html: str, name: str, body: str) -> str:
    pat = re.compile(
        r'(<script data-exp7-shared="%s">)(.*?)(</script>)' % re.escape(name),
        re.S,
    )
    m = pat.search(html)
    if not m:
        raise SystemExit(f"missing script data-exp7-shared={name}")
    return pat.sub(lambda mm: mm.group(1) + normalize_js(body) + mm.group(3), html, count=1)


def replace_budgetpkg(html: str, raw: bytes) -> str:
    b64 = base64.b64encode(raw).decode("ascii")
    pat = re.compile(
        r'(<script type="application/octet-stream" id="budgetpkg">)(.*?)(</script>)',
        re.S,
    )
    if not pat.search(html):
        raise SystemExit("missing budgetpkg blob")
    return pat.sub(lambda m: m.group(1) + b64 + m.group(3), html, count=1)


def replace_literal(html: str, old: str, new: str, label: str, required: bool = True) -> str:
    n = html.count(old)
    if n == 0:
        if required:
            raise SystemExit(f"patch {label}: needed string not found")
        return html
    return html.replace(old, new)



def apply_views_host_patches(html: str) -> str:
    """Budget phone-first options, cash list, and no leftover what-if chrome."""
    html = replace_literal(
        html,
        "function vmOpts(V){ return V.opts||(V.opts=VMx().options(null)); }",
        "function vmOpts(V){ if(!V.opts){ var AW=activeAtlas(V), over=null; if(AW&&AW.meta&&AW.meta.budget) over={budget:{facts:false,tabs:false},plan:{presentation:'compact',summary:false,columns:['step','selected']},board:{presentation:'ledger'},calendar:{}}; V.opts=VMx().options(over);} return V.opts; }",
        "vmOpts-budget",
    )
    html = replace_literal(
        html,
        "function boardVM(V,A,c,O){ const X=VMx(), M=window.JAtlasModel, o=O.board, AW=activeAtlas(V)||A, cid=c.id, Q=boardRows(A,c), bid=boardCompId(V);\n  if(window.Exp7Journal&&(o.presentation==='ledger')) return window.Exp7Journal.ledgerModel(V,A,c,O);",
        "function boardVM(V,A,c,O){ const X=VMx(), M=window.JAtlasModel, o=O.board, AW=activeAtlas(V)||A, cid=c.id, Q=boardRows(A,c), bid=boardCompId(V);\n  if(window.Exp7Journal&&AW&&AW.meta&&AW.meta.budget){ const ids=(AW.meta.boardIds)||{}; if(c.id===(ids.asset||'board_asset')&&window.Exp7Journal.cashModel) return window.Exp7Journal.cashModel(V,A,c); }\n  if(window.Exp7Journal&&(o.presentation==='ledger')) return window.Exp7Journal.ledgerModel(V,A,c,O);",
        "boardVM-cash",
    )
    # Keep what-if handlers from committing, and drop the leftover Clear what-if button
    html = replace_literal(
        html,
        "if(o.summary) kids.push(X.row('sum',[X.text('s',sum,'muted'),V.wi&&X.btn('clear','Clear what-if','clear')]));",
        "if(o.summary) kids.push(X.row('sum',[X.text('s',sum,'muted')]));",
        "clear-what-if",
        required=False,  # may already be hidden when summary is false
    )
    return html

def apply_shell_patches(html: str) -> str:
    """Patch the platform shell (anon-2) in the lean file for private auto-create."""
    html = replace_literal(
        html,
        'body:JSON.stringify({name:repo,description:"Exp7 personal data. Budget data is sealed (encrypted) before it is written here.",private:false,auto_init:true,has_issues:false,has_wiki:false,has_projects:false})',
        'body:JSON.stringify({name:repo,description:"Exp7 personal data. Budget data is sealed (encrypted) before it is written here.",private:true,auto_init:true,has_issues:false,has_wiki:false,has_projects:false})',
        "create-private",
    )
    html = replace_literal(
        html,
        '/* Create the personal data repo (1.8.48). Public, as the data repo check requires; Budget data is sealed before it is written.\n   Fine-grained keys need Administration write on all repositories to create one; GitHub names what is missing in a header. */',
        '/* Create the personal data repo. Private by default (1.8.62). Creation is automatic once GitHub access is available;\n   an existing repo this key can use is reused, public or private, and is never overwritten. Budget data stays sealed.\n   Fine-grained keys need Administration write on all repositories to create one; GitHub names what is missing in a header. */',
        "create-comment",
    )
    # 404 in validate: auto-create instead of showing a create button
    old_404 = 'if(!r.ok){if(r.status===404){$("tstat").textContent="No repo "+login+"/"+repo+" that this key can see.";const cb=$("btnCreateRepo");if(cb){cb.textContent="Create public "+login+"/"+repo;cb.hidden=false}}else $("tstat").textContent="Could not check "+login+"/"+repo+" ("+r.status+").";return rec("target_check","fail",{status:r.status})}'
    new_404 = 'if(!r.ok){if(r.status===404){$("tstat").textContent="No data repo "+login+"/"+repo+" yet. Creating a private one…";const cb=$("btnCreateRepo");if(cb)cb.hidden=true;setTimeout(createDataRepo,50);return rec("target_check","info",{status:404,autoCreate:true})}else{$("tstat").textContent="Could not check "+login+"/"+repo+" ("+r.status+"). Local saving continues.";return rec("target_check","fail",{status:r.status})}}'
    html = replace_literal(html, old_404, new_404, "validate-404")
    html = replace_literal(
        html,
        'if(!(r.data.owner&&r.data.owner.login===login)||r.data.private){$("tstat").textContent="Repo must be yours and public.";return rec("target_check","fail","not own public repo")}',
        'if(!(r.data.owner&&r.data.owner.login===login)){$("tstat").textContent="Data repo must be yours ("+login+"). Local saving continues.";return rec("target_check","fail","not own repo")}',
        "accept-private",
    )
    html = replace_literal(
        html,
        'if(res&&res.ok){S.cfg=Object.freeze({gen:my,tok:t,...src});$("tstat").textContent="Ready. Proposal-op sync to "+login+"/"+src.repo+".";rec("target_check","pass",{public:true});startAutoSync();await rememberAppForUser(UI.mountedAppId||DEFAULT_APP_ID)}',
        'if(res&&res.ok){S.cfg=Object.freeze({gen:my,tok:t,...src});$("tstat").textContent="Ready. Sync to "+login+"/"+src.repo+(r.data.private?" (private)":"")+".";rec("target_check","pass",{private:!!r.data.private});startAutoSync();await rememberAppForUser(UI.mountedAppId||DEFAULT_APP_ID)}',
        "ready-msg",
    )
    # 422 on create: try to use the existing repo if this key can see it
    html = replace_literal(
        html,
        'if(res.status===422){rec("repo_create","fail",{status:422});$("tstat").textContent=login+"/"+repo+" already exists but this key cannot see it. Give the key access to that repo, or pick another name.";return}',
        'if(res.status===422){const seen=await gh("/repos/"+login+"/"+repo,{tok:t});if(seen.ok&&seen.data&&seen.data.owner&&seen.data.owner.login===login){rec("repo_create","pass",{repo,existed:true});$("tstat").textContent="Using existing "+login+"/"+repo+". Checking it…";const cb=$("btnCreateRepo");if(cb)cb.hidden=true;setTimeout(validate,50);return}rec("repo_create","fail",{status:422});$("tstat").textContent=login+"/"+repo+" already exists but this key cannot use it. Give the key access to that repo, or pick another name. Local saving continues.";return}',
        "create-422-reuse",
    )
    # comments about public-only repo
    html = replace_literal(
        html,
        "/* Budget data in the personal data repo, sealed (1.8.47). The repo is public, so the atlas is encrypted in this browser:",
        "/* Budget data in the personal data repo, sealed (1.8.47). The managed key stays in force when the repo is private:",
        "seal-comment",
        required=False,
    )
    return html


def apply_version(html: str, version: str, notes: str) -> str:
    html = replace_literal(html, 'SHELL_VERSION="1.8.61"', f'SHELL_VERSION="{version}"', "shell-version")
    # debug paste mentions shell version
    html = replace_literal(html, "shell 1.8.61", f"shell {version}", "debug-paste")
    return html


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default="1.8.62")
    ap.add_argument("--notes", default="")
    ap.add_argument("--skip-version", action="store_true")
    args = ap.parse_args()
    html = LEAN.read_text()
    for name, path in SCRIPTS.items():
        if not path.exists():
            raise SystemExit(f"missing {path}")
        html = replace_shared(html, name, path.read_text())
        print(f"injected {name} ({path.stat().st_size} bytes)")
    html = replace_budgetpkg(html, BUDGETPKG.read_bytes())
    print(f"injected budgetpkg ({BUDGETPKG.stat().st_size} bytes)")
    html = apply_views_host_patches(html)
    html = apply_shell_patches(html)
    if not args.skip_version:
        html = apply_version(html, args.version, args.notes)
    LEAN.write_text(html)
    digest = sha256_file(LEAN)
    if RELEASE.exists():
        rel = json.loads(RELEASE.read_text())
        if not args.skip_version:
            rel["version"] = args.version
        rel["sha256"] = digest
        if args.notes:
            rel["contains"] = {args.version: args.notes, **{k: v for k, v in (rel.get("contains") or {}).items() if k != args.version}}
        RELEASE.write_text(json.dumps(rel, indent=2) + "\n")
    print(f"wrote {LEAN} sha256={digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
