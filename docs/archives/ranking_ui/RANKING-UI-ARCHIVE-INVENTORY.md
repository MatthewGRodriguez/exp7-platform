# ranking_ui archive (source/assets/docs, privacy-sanitized)

Built 2026-11-08 by Grok Bot for archival import. Integration, runtime and release changes are not authorized.

## Provenance (one snapshot, not mixed)
- Source: box snapshot `/workspace/ranking_ui_stage/holes/`. It was chosen because it is the newest **complete** tree on the box (vendor plus joys). Its `ranking_ui.html` matches the backup lineage around 2026-10-24/25 (1,053,124 B). File times show the 2026-11-07 00:35 CST box restore; the real copy date is unknown.
- The authoritative live seat is on the owner's Mac (`…/The Joy Machine 2/legacy/legacy/html`, served on :8765). Later Mac edits (backups show `ranking_ui.html` changing through 2026-10-30) are **not** reflected here.
- `serve_ranking.py` is not in this snapshot. It exists only in other box snapshots, so it was not mixed in.

## Withheld
- **`ranking_ui.html` (the main app): withheld as UNSAFE TO SANITIZE automatically.** It embeds the owner's real finances throughout its code: account balances and account numbers, pay-table and pay-grade details, location, and service dates. Removing them without breaking behavior needs a careful manual pass. No copy is included.
- Data files: `vendor/workbook_*.json`, `actuals_local.json`, `budget_map.json`, `seed_ranked.json`, `sheet_summary.*`, the joys calendar `.ics`. These are the owner's real financial and calendar data.
- `*.bak*` backups, plus the snapshot's test artifacts (`test.html`, `results.json`, `wb_new.json`, `workbook_local.json`).
- 216: rendered JPEG frames (outputs)
- 3: macOS metadata
- 8: personal data (joy profiles/review/calendar actions)

## Sanitization (copies only; features unchanged except as noted)
Placeholders replaced: local user paths, military unit and base, city, the owner's work/sleep schedule text, bank, payer and account digits, and two merchant names.
- Identifiers were replaced consistently across files (e.g. `firm_…_abilene` → `firm_…_redacted_city`).
- Name-matching rules that referenced a merchant now match the placeholder. This only affects matching against the owner's real data, which is withheld.
- **Package left schedule minutes as-is; repo import redacted them** in `vendor/model_tools_script.js` (`ECON_MATTHEW` work/sleep minutes → null placeholders; tz placeholder). Archive is not required to run.
- Generic product models (e.g. a brokerage subscription EV model) and the perspective name `matthew` remain.

## Files (original sha256 → archived sha256)
| Path | Bytes | original sha256 | archived sha256 | modified |
|---|---|---|---|---|
| `joys/README.md` | 1392 | `c2105182c68f119fd80e5c21ef1620710a2af93d1f05e0c0e9eecea41d70a397` | `c2105182c68f119fd80e5c21ef1620710a2af93d1f05e0c0e9eecea41d70a397` | no |
| `joys/index.json` | 3216 | `224534eed2b341b7dcf8fd1e31b44cc3490021d2242eb31f518683f1e767dba4` | `224534eed2b341b7dcf8fd1e31b44cc3490021d2242eb31f518683f1e767dba4` | no |
| `joys/joy_age_happiness/HOW.md` | 309 | `8cb79d27fa36d386631db7e14975bdd7d921270a2e2be5bf170b2e90a90ad3de` | `8cb79d27fa36d386631db7e14975bdd7d921270a2e2be5bf170b2e90a90ad3de` | no |
| `joys/joy_age_happiness/MANIFEST.json` | 344 | `9ae190d8e972f45145b1c1c78fd98a72165ccf3a76665755d72aeef332d105fe` | `9ae190d8e972f45145b1c1c78fd98a72165ccf3a76665755d72aeef332d105fe` | no |
| `joys/joy_age_happiness/jmethod.js` | 1677 | `886114c194ecbf97512a1980edacd486a77620dd226055c0665553d5bcb297c0` | `886114c194ecbf97512a1980edacd486a77620dd226055c0665553d5bcb297c0` | no |
| `joys/joy_calendar/HOW.md` | 1740 | `edcfda1d043aae7a9fc2fd0bd3322e85ca8880d19e3989cc039c310591f10b84` | `d835427b47e4657fa7600e02d9f508d9f2b39c2a7bd9679264beba4f0ac0e0bf` | yes |
| `joys/joy_calendar/MANIFEST.json` | 365 | `357942621f3a80fcae455fdddc4b22212339f3d66afa08711ddd6b2a31fb16ac` | `357942621f3a80fcae455fdddc4b22212339f3d66afa08711ddd6b2a31fb16ac` | no |
| `joys/joy_calendar/RESEARCH.md` | 149 | `296cda74fb5e5d4c650e08587ccbf2607282b46d99ae0a4779b58a0edee9a230` | `296cda74fb5e5d4c650e08587ccbf2607282b46d99ae0a4779b58a0edee9a230` | no |
| `joys/joy_calendar/jmethod.js` | 1326 | `d90620174c33ff4ca32b6415b812c8f26e8a5ebd20316cd08bd41171901d85e5` | `d90620174c33ff4ca32b6415b812c8f26e8a5ebd20316cd08bd41171901d85e5` | no |
| `joys/joy_debt_urgency/HOW.md` | 273 | `f4f1d5e540574d5c596cffd6d9ba95068a81ec42f313fe152e2be14ad60836e7` | `f4f1d5e540574d5c596cffd6d9ba95068a81ec42f313fe152e2be14ad60836e7` | no |
| `joys/joy_debt_urgency/MANIFEST.json` | 337 | `76e8e406a4c2298b84ba6a69ff6f2c0c45fe598cdff305c2f3a2f7750db5832b` | `76e8e406a4c2298b84ba6a69ff6f2c0c45fe598cdff305c2f3a2f7750db5832b` | no |
| `joys/joy_debt_urgency/jmethod.js` | 1555 | `4885a8a7cfaa392b483a0c18f1a1eece73916c8e8962347e717d27ed3ee36d54` | `4885a8a7cfaa392b483a0c18f1a1eece73916c8e8962347e717d27ed3ee36d54` | no |
| `joys/joy_external/HOW.md` | 256 | `5fb2fa2b91ee4bcd7074a6dcd98ce1b8f966f1d53dfef27c8c86e0197b41071c` | `5fb2fa2b91ee4bcd7074a6dcd98ce1b8f966f1d53dfef27c8c86e0197b41071c` | no |
| `joys/joy_external/MANIFEST.json` | 361 | `bf9774b8425e5bf98bad2f65aa01ec32fcf6bc5c72648a6e22ad01964e046ac3` | `bf9774b8425e5bf98bad2f65aa01ec32fcf6bc5c72648a6e22ad01964e046ac3` | no |
| `joys/joy_external/jmethod.js` | 1837 | `adbbef3a4e87600aa845f1c9e6a7518ee54fd9cd0b15e0eb2fbb71ddb4d62488` | `adbbef3a4e87600aa845f1c9e6a7518ee54fd9cd0b15e0eb2fbb71ddb4d62488` | no |
| `joys/joy_money/HOW.md` | 362 | `464d7367a46e0b44bc11199129ac1fbacc65bb2572ca0908c7be1fdfb3f55c77` | `464d7367a46e0b44bc11199129ac1fbacc65bb2572ca0908c7be1fdfb3f55c77` | no |
| `joys/joy_money/MANIFEST.json` | 353 | `aadda0a95fc373864b69563aa6b9f0f4f75e629e9bf21666dae9f222cfa04757` | `aadda0a95fc373864b69563aa6b9f0f4f75e629e9bf21666dae9f222cfa04757` | no |
| `joys/joy_money/RESEARCH.md` | 214 | `0ab6987aa5dda1f14e3764b3a4af212382829dd8196d130ee1f61f2ce3de7bc2` | `0ab6987aa5dda1f14e3764b3a4af212382829dd8196d130ee1f61f2ce3de7bc2` | no |
| `joys/joy_money/jmethod.js` | 1692 | `820bb1fb1df9c3d1111f9c4befd80e7c83ab454e6b68883fa2d2e1a83544dbff` | `820bb1fb1df9c3d1111f9c4befd80e7c83ab454e6b68883fa2d2e1a83544dbff` | no |
| `joys/joy_surplus_freedom/HOW.md` | 669 | `930cfa002372041e81ae0d529feadfc82747ea3080fac358b94dd94fae0d2614` | `930cfa002372041e81ae0d529feadfc82747ea3080fac358b94dd94fae0d2614` | no |
| `joys/joy_surplus_freedom/MANIFEST.json` | 362 | `3550d2e802fac9afe98742573abf7fab59baf389cc7d8458e7449225e40b3472` | `3550d2e802fac9afe98742573abf7fab59baf389cc7d8458e7449225e40b3472` | no |
| `joys/joy_surplus_freedom/RESEARCH.md` | 257 | `7a15ca7b81aa2f02768f9e6b632d81fa41e402b4b0f9a414724840a0041cd5ed` | `7a15ca7b81aa2f02768f9e6b632d81fa41e402b4b0f9a414724840a0041cd5ed` | no |
| `joys/joy_surplus_freedom/jmethod.js` | 2548 | `403e915ce8c45f5f7cf927e55922e296f73313d0b4f6d842110c0ea244816796` | `403e915ce8c45f5f7cf927e55922e296f73313d0b4f6d842110c0ea244816796` | no |
| `joys/review/README.md` | 363 | `3ff0039df5a0fdb0760090a78efbb635abd1af1082307a99bf5a8827e94fc14d` | `3ff0039df5a0fdb0760090a78efbb635abd1af1082307a99bf5a8827e94fc14d` | no |
| `vendor/JFactor_exp6.js` | 166029 | `c65acb90525ad8f502d785d0dc3b90dc319be0d16dbbb56b194d9023e246b87a` | `c65acb90525ad8f502d785d0dc3b90dc319be0d16dbbb56b194d9023e246b87a` | no |
| `vendor/calendar_model.js` | 68198 | `8c429c5ffcb88b20eb33f198d97a2a80521e3b1b682e5bfbfb42cec0338dae94` | `06d52086c61428395d4be44ac29e0a040610481ab380c3a45afe5fa09523ab7f` | yes |
| `vendor/household_economy.js` | 14625 | `09e621cfa0a92109b510e884cca83ac9a5a09a038a5cadc4b999da4f6fc36006` | `09e621cfa0a92109b510e884cca83ac9a5a09a038a5cadc4b999da4f6fc36006` | no |
| `vendor/jmethod_packs/builtins.json` | 264034 | `651d7cee446c8938ee75ee9201a172bcd14efe971d43389b234f110913d979b9` | `fd6684d677556d416385962b429e70c1e463d65e2bc5fdc0c4f5fa9ac6adafe0` | yes |
| `vendor/joy_factors.js` | 9820 | `84948b9d644a17aef346f6d071eaec13e85a290e51093fb1a84b5029325e7613` | `84948b9d644a17aef346f6d071eaec13e85a290e51093fb1a84b5029325e7613` | no |
| `vendor/joy_loader.js` | 2565 | `43b7daafa415e42a2874e348095d98108c312d204c0920aed6fa57b3e6e19e6a` | `43b7daafa415e42a2874e348095d98108c312d204c0920aed6fa57b3e6e19e6a` | no |
| `vendor/model_tools_3d.js` | 31969 | `ee9da3e9b169d49a4287b81cb082e149473c9e130ec0cf4c35dd9e4c5c26cd15` | `ee9da3e9b169d49a4287b81cb082e149473c9e130ec0cf4c35dd9e4c5c26cd15` | no |
| `vendor/model_tools_script.js` | 227441 | `416faeab855e048ec2d62275d6e20f33eb9ff77b99e5d5c92613050f30e86bfd` | `751a036132f36355cad022a6c6202262e901873281624455260a7f5800ddedab` | yes |
| `vendor/moho/README.md` | 2011 | `8f181c6ea4c3ee01bc97f4bcbec0508c179c88958215bfb0114085c644faaddb` | `8f181c6ea4c3ee01bc97f4bcbec0508c179c88958215bfb0114085c644faaddb` | no |
| `vendor/moho/design/EXPORT_CHECKLIST.md` | 1174 | `98ceea8074ceb357e3044901b58061507bc77b1f6beea42df0b63d7523e9e1e9` | `98ceea8074ceb357e3044901b58061507bc77b1f6beea42df0b63d7523e9e1e9` | no |
| `vendor/moho/design/PILOT_STATUS.md` | 135 | `443d29ca863e0aa1d6074c7b68607c0e66dfb9454cc85979487efade20c6a01a` | `443d29ca863e0aa1d6074c7b68607c0e66dfb9454cc85979487efade20c6a01a` | no |
| `vendor/moho/design/PROJECT.md` | 699 | `5f19099580ea9c254dec34d6182cf4bc03a1c542ce90b33d70b6c71b6aed7772` | `5f19099580ea9c254dec34d6182cf4bc03a1c542ce90b33d70b6c71b6aed7772` | no |
| `vendor/moho/design/ROADMAP.md` | 717 | `b3b9d26b1715ef8a86613ba5657771006e2f8208147c643202c3471a262aa1e7` | `b3b9d26b1715ef8a86613ba5657771006e2f8208147c643202c3471a262aa1e7` | no |
| `vendor/moho/design/design_map.svg` | 2351 | `6ef350b56caa2fe1e930b44f4f59453146bb175937a22ba952129d4c754b41bc` | `6ef350b56caa2fe1e930b44f4f59453146bb175937a22ba952129d4c754b41bc` | no |
| `vendor/moho/design/svg_motion_proof.svg` | 2348 | `b06354a9140328fcdcd1b67f5cfd9290b4337aec0e602016bd554f96d42a526f` | `b06354a9140328fcdcd1b67f5cfd9290b4337aec0e602016bd554f96d42a526f` | no |
| `vendor/moho/design/ui_master.svg` | 2845 | `d966606b2d3bc62b420960f90bb0a5a54333e084baa22a15e69a5c9abb8ed571` | `d966606b2d3bc62b420960f90bb0a5a54333e084baa22a15e69a5c9abb8ed571` | no |
| `vendor/moho/design_bindings.json` | 4800 | `3ffdddae4b7152d948ab063f9abbf391515c4d3c3a384c62a64944842101077e` | `3ffdddae4b7152d948ab063f9abbf391515c4d3c3a384c62a64944842101077e` | no |
| `vendor/moho/exports/L0_void.svg` | 1809 | `16e4bf1d908105d7fe0c191d0732685b67eababf999dd62e479b2aaa169fd246` | `16e4bf1d908105d7fe0c191d0732685b67eababf999dd62e479b2aaa169fd246` | no |
| `vendor/moho/exports/L10_review.svg` | 1060 | `fb4e64c01da0be862d3f4306c3d346b6c44892cd454ed0cc26ebcd0e376c5991` | `fb4e64c01da0be862d3f4306c3d346b6c44892cd454ed0cc26ebcd0e376c5991` | no |
| `vendor/moho/exports/L11_cal_drill.svg` | 959 | `4d9e3bbfa68478b94e345bc1e1d006691de524aeb1a8724b16a2966a7aae5607` | `4d9e3bbfa68478b94e345bc1e1d006691de524aeb1a8724b16a2966a7aae5607` | no |
| `vendor/moho/exports/L12_save_ok.svg` | 1041 | `d30502f76cd30ccaff9d8a2c2c595cae9770657c613bade64430ff84f7aaf6d8` | `d30502f76cd30ccaff9d8a2c2c595cae9770657c613bade64430ff84f7aaf6d8` | no |
| `vendor/moho/exports/L13_relation_graph.svg` | 20102 | `36cbc4811a7be17021f624f829190b722ba1332fcf1cda47e2a50a57362500d2` | `36cbc4811a7be17021f624f829190b722ba1332fcf1cda47e2a50a57362500d2` | no |
| `vendor/moho/exports/L1_accent_wave.svg` | 1459 | `b1b2a007ee2983170c54a81b5dbf4ccfc8e03cd007f206bd272886383e48ad90` | `b1b2a007ee2983170c54a81b5dbf4ccfc8e03cd007f206bd272886383e48ad90` | no |
| `vendor/moho/exports/L2_chrome.svg` | 1236 | `e4ebc38c05830501898b9292accdffb1cf306052be6a7b46394fae95ca809515` | `e4ebc38c05830501898b9292accdffb1cf306052be6a7b46394fae95ca809515` | no |
| `vendor/moho/exports/L3_panel.svg` | 942 | `5c8ffb82e83054d1c7ae7a98de6184e420f6e6e4f908ee52d5f1536cb792585d` | `5c8ffb82e83054d1c7ae7a98de6184e420f6e6e4f908ee52d5f1536cb792585d` | no |
| `vendor/moho/exports/L4_run_pulse.svg` | 900 | `5bb238dd96aaa753890de15c3bcca9bd7708ccc64c7aed618651644b5b7484b6` | `5bb238dd96aaa753890de15c3bcca9bd7708ccc64c7aed618651644b5b7484b6` | no |
| `vendor/moho/exports/L5_money_spark.svg` | 1087 | `5f2e8cd9101e375e2d69c5cf8e2463d25d6fbf85294c11e8b9abd28178590d22` | `5f2e8cd9101e375e2d69c5cf8e2463d25d6fbf85294c11e8b9abd28178590d22` | no |
| `vendor/moho/exports/L6_tab.svg` | 1029 | `8eea961e94a022191fb3ac34c2fc4333653915e12b1f12c992402e5a96198001` | `8eea961e94a022191fb3ac34c2fc4333653915e12b1f12c992402e5a96198001` | no |
| `vendor/moho/layers.json` | 6050 | `c88058274ff320f7e85169492120cf47284a54406f112ec9d1facce646b643ab` | `c88058274ff320f7e85169492120cf47284a54406f112ec9d1facce646b643ab` | no |
| `vendor/moho/project/JWorkbook_chrome.moho` | 44481 | `25bed12504afbda5a4bbdcc3d96e9417999870e930a044c0a5120e038963664d` | `25bed12504afbda5a4bbdcc3d96e9417999870e930a044c0a5120e038963664d` | no |
| `vendor/moho/project/OPEN_IN_MOHO.md` | 999 | `765787f24393d37fe958d51e11c5476f2bc57b48d37a0821b7fd18bcd111eb4b` | `765787f24393d37fe958d51e11c5476f2bc57b48d37a0821b7fd18bcd111eb4b` | no |
| `vendor/moho/project/README_MOHO_FILE.md` | 154 | `e173d1d8ff205a339c084867769b2dff388fc8db9f0a7982c722545c2d2d613d` | `e173d1d8ff205a339c084867769b2dff388fc8db9f0a7982c722545c2d2d613d` | no |
| `vendor/moho/project/layer_stack.json` | 2036 | `1d0d01399cdff3e3651a256964f6fae922550bc3cbdc3db496c0a306af35a0c7` | `1d0d01399cdff3e3651a256964f6fae922550bc3cbdc3db496c0a306af35a0c7` | no |
| `vendor/moho/published/lighting_sot.json` | 21582 | `1f5676d9f02bddba43b6b3997effc3f28ef69cbcc194c6212e8ac7a11399a301` | `1f5676d9f02bddba43b6b3997effc3f28ef69cbcc194c6212e8ac7a11399a301` | no |
| `vendor/moho/published/moho_publish.json` | 2174 | `5689c336b928ce16004b030929434c99cd8a9d07fad78936418cc7348cedbf31` | `5689c336b928ce16004b030929434c99cd8a9d07fad78936418cc7348cedbf31` | no |
| `vendor/moho/published/motion_timeline.json` | 12155 | `45ecaaf8bfb57da576221f9008cff661170b7ef16a3ffe9c299fc95a9ec4922f` | `66b1d85296acc23d3739f312f70bc112e76616a90dde2262242cd6a99526f7bf` | yes |
| `vendor/moho/published/scene_sot.json` | 3146 | `4334833343f6c36ed6aa6d0beb61272252c0e491b6a768648406c5d7f9920b7a` | `4334833343f6c36ed6aa6d0beb61272252c0e491b6a768648406c5d7f9920b7a` | no |
| `vendor/moho/scripts/AnimateJWorkbookLayers.lua` | 3177 | `581315a5539bf1fc25cd6eaee7e08e42065f059bd6f171bee255392cfc6f591e` | `581315a5539bf1fc25cd6eaee7e08e42065f059bd6f171bee255392cfc6f591e` | no |
| `vendor/moho/scripts/AnimateUiLighting.lua` | 3491 | `b44ce49ab67246385613b30d57eca1cf3f4b4590f10a8dafb9474b9b5e7901e5` | `b44ce49ab67246385613b30d57eca1cf3f4b4590f10a8dafb9474b9b5e7901e5` | no |
| `vendor/moho/scripts/CreateJWorkbookProject.lua` | 1012 | `03f96851a5f8ec8bab1eaf30802737bda11dea56d367a32038b56873d288a762` | `59252bdfd03ed602a670ad99f8fdcdcc095dab5a5b8a4a9d8660cce0a6e0ea1f` | yes |
| `vendor/moho/scripts/DesignUpgradeRankingUi.lua` | 13830 | `c6954eda8d48dae7709c3c11138328efd6515515617a8f85f8d28c8ebf3bbd28` | `c6954eda8d48dae7709c3c11138328efd6515515617a8f85f8d28c8ebf3bbd28` | no |
| `vendor/moho/scripts/DiagShapes.lua` | 2627 | `dc97229b9050a0daadffa11c7cd4c2fc346ea27fb680766b5a7f80f8fe10926c` | `dc97229b9050a0daadffa11c7cd4c2fc346ea27fb680766b5a7f80f8fe10926c` | no |
| `vendor/moho/scripts/DrawAccentShapes.lua` | 2239 | `4a49bb648a3f71612acf7104ccdeb03d3b4ac3695651d482e3741a5e8f826a63` | `4a49bb648a3f71612acf7104ccdeb03d3b4ac3695651d482e3741a5e8f826a63` | no |
| `vendor/moho/scripts/ExportMotionTimeline.lua` | 3031 | `fdcfc2abf2759e982946dfafe0abb22010e140fd60a5839d25892f1baaf7aacc` | `fdcfc2abf2759e982946dfafe0abb22010e140fd60a5839d25892f1baaf7aacc` | no |
| `vendor/moho/scripts/ListLayers.lua` | 585 | `d72aff3a4789ed16bab92d0991dd407d42ef3bf225afc5ef41cb3e30667ed253` | `d72aff3a4789ed16bab92d0991dd407d42ef3bf225afc5ef41cb3e30667ed253` | no |
| `vendor/moho/scripts/RenderPreview.lua` | 775 | `846dae733b68e2825a67a7d3f89483514598aa515b0dd1ec733ae3f22dba0311` | `846dae733b68e2825a67a7d3f89483514598aa515b0dd1ec733ae3f22dba0311` | no |
| `vendor/moho/scripts/SmokeQuit.lua` | 122 | `04fc433e631f4953e6ecf00a75275bf551739a280c8c81577a5cc4268c9b64f7` | `04fc433e631f4953e6ecf00a75275bf551739a280c8c81577a5cc4268c9b64f7` | no |
| `vendor/moho/scripts/WriteLayerMarkers.lua` | 684 | `8966391ae9e195e03487848a9e01fb342ae637ed39c070aebbaf1638bd5f72ce` | `8966391ae9e195e03487848a9e01fb342ae637ed39c070aebbaf1638bd5f72ce` | no |
| `vendor/review_model.js` | 23465 | `81f47e9e8428b391194c314f7ee999b428d0a7091ca9f3b7e285c54ba7d3199a` | `81f47e9e8428b391194c314f7ee999b428d0a7091ca9f3b7e285c54ba7d3199a` | no |
| `vendor/run_jmethods.js` | 65106 | `cc40515628b81c881ed260925e13c70e64182d543fe8eefebe47108de91e540e` | `cc40515628b81c881ed260925e13c70e64182d543fe8eefebe47108de91e540e` | no |
| `vendor/spend_chat.js` | 15335 | `abc309e266631ede0dff386976b18bb26fe9da5f4924b7c33975a054b1e28c20` | `abc309e266631ede0dff386976b18bb26fe9da5f4924b7c33975a054b1e28c20` | no |


---

## Repo import addendum (docs PR; after zip)

Further privacy redaction applied **before commit** (zip archived SHAs above remain the package provenance):

| Path | Repo bytes | Repo sha256 | Note |
|---|---|---|---|
| `vendor/model_tools_script.js` | 228148 | `911c50397a415f127a8fcf3ef912fbc2db84a26f27035885fc1ba4c7f5cb6de0` | Schedule minutes + tz redacted beyond zip; residual clock comments removed |
| `ranking_ui.html.txt` | 1055178 | `b31a84cf1a7b9f5f5fb6440db106c458fbb50b72732f60d6562032f0e362656e` | Sanitized from private raw `ranking_ui.html`; raw not in git |

See `SANITIZATION.md`. Merchant placeholder rules remain **not** production-equivalent. Archive is **not** runnable.
