# Lore docs — public-safe package

Built 2026-11-08 by Grok Bot for a documentation-only PR. **158 files**, each byte-exact to its box snapshot source and listed below with its SHA-256. No file in this package was modified.

## Sources and freshness
- `jeditor/`: from the box snapshot `/workspace/jed/JEditor`, a plain copy with no Lore metadata. File times show the box restore (2026-11-07 00:35–00:36 CST); the actual copy date is unknown. The authoritative Lore repo is on the owner's Mac. Docs committed after this snapshot (design docs after 49, ADRs after 0111) are **not included**.
- `living-core/`: from the box snapshot `/workspace/living-core`, top-level software docs only. The Mac copy may differ.
- This is **not** a complete set of all Lore docs.

## Withheld (42 files, listed by count only)
- 35: contain or describe personal financial data.
- 4: contain local personal identifiers (machine paths).
- 2: describe where private data is stored and how exposed it is.
- 1: agent operating instructions and persona/runtime material, not software docs.

Also left out on purpose: source/code payloads (animation pipeline scripts), JEditor source code, macOS metadata files and user-uploaded HTML.

Names that appear are decision attributions (the repo owner) only. Money terms in the included docs are generic model variables or synthetic examples.

## Included files (SHA-256)
| Path | Bytes | sha256 |
|---|---|---|
| `jeditor/README.md` | 2143 | `d17d56b130036ac26110f736e542a16b3c3f2f4d28975e9f5c8e6e5836272d7d` |
| `jeditor/docs/decisions/0001-single-animation-runtime.md` | 976 | `8cdf8cd9ca39cdb58029c725d1551133ac74f4e1cac5781922369290b760ad36` |
| `jeditor/docs/decisions/0002-everything-is-a-level.md` | 339 | `2123652862f7ab0bbe7bf4c923ce154cd6b6b65792946d4411fd28f01d249e53` |
| `jeditor/docs/decisions/0003-component-based-editor.md` | 313 | `cf44a980e705095913f04b07d58430db52d752bf8949b660386a14d755b98091` |
| `jeditor/docs/decisions/0004-regenerate-runtime-from-state-table.md` | 991 | `d9a4e94a479b877020a2cee090d06414fd5a270ba93922f9641b2055de09b6db` |
| `jeditor/docs/decisions/0005-ranking-ui-first-reference-level.md` | 395 | `cb7cc0118ee6864c5886eac556767da0ad170aa4e23a66d9b5af937202b52e09` |
| `jeditor/docs/decisions/0006-persistence-configurable-per-level.md` | 334 | `a3717999463d48993aa28e2f84212162305af07bdbd93630bf1c08658eab34ee` |
| `jeditor/docs/decisions/0007-ambient-drift-on-by-default.md` | 433 | `48ae81808b1eec03b9a699e8e57143a3ea2cf269a239bec08cac66ecc7913183` |
| `jeditor/docs/decisions/0008-jfactor-first-class.md` | 491 | `a1add04d61d21f2ca00c2e0a4731e4a6d947811011be50c6c1fa6cefef2475c9` |
| `jeditor/docs/decisions/0009-calendar-and-plan-as-jfactor-views.md` | 634 | `d1defde0afb3262c530ea1c74c4a75424e4b9ec90cd8fa73d91f93a4cad01163` |
| `jeditor/docs/decisions/0010-preview-blueprint-belongs-to-editor.md` | 374 | `9e865f37d59a476f5f1b0f19f7cbd5a0963a89ca3a620c39c81755ba266592e9` |
| `jeditor/docs/decisions/0011-one-system-items-have-alternatives.md` | 535 | `eba7dddb1554872bee7089ec4b1dbc22369949bc1b2d880b0f76a1a16f164958` |
| `jeditor/docs/decisions/0013-condition-metrics-editor-configurable.md` | 477 | `b4334bed1461b9762de3f48b5ea7073fc1b3697f9ee6161b8c1a777944753cd4` |
| `jeditor/docs/decisions/0014-condition-combining-configurable.md` | 488 | `1f850b40cfb629550d60b93900d992f62edc07e58cf71aedede2cf17baa16be1` |
| `jeditor/docs/decisions/0015-condition-scopes-all.md` | 366 | `3963718af141997de385748d3be3fca197ebec4e0dbe280f06cabdb164a9fd13` |
| `jeditor/docs/decisions/0016-conditions-can-trigger-animations.md` | 503 | `5ffc7514f36609e2d23d9f9028ae22f1778cb6d19202928db3337e4a80468d3d` |
| `jeditor/docs/decisions/0017-rank-shares-as-jfactor-scorer.md` | 1269 | `a4da0517c671bde8bc7dbec692521cbf984cd8a6e4fa098f545d127d3d108a0a` |
| `jeditor/docs/decisions/0018-exp6-wasm-in-v1.md` | 1543 | `24094c31d4c616ea39b922ffdd44d74a580f60d8934adf1b554a07828b92e03e` |
| `jeditor/docs/decisions/0019-item-fields-configurable-via-blueprints.md` | 1936 | `909a6534d5e2c91909f284ef6646567fa6608d81f2fe425ce2fa5383875d7dbf` |
| `jeditor/docs/decisions/0020-exp6-webgpu-workers-in-v1.md` | 2529 | `57927c3e39ad7374dbea835861e81abee7d65c2cabc4da2233ca4ab233616c71` |
| `jeditor/docs/decisions/0021-browser-workers-and-webgpu-first-priority.md` | 841 | `7097e1dcd8de0706251aaf4f6dba8aed5947f030d284cb2729bd2b47971d62d3` |
| `jeditor/docs/decisions/0022-blueprint-node-port-order.md` | 486 | `d91814a06557a59603fc30c011de0022752c318d3f2f2d1ca7f63b379f8091a5` |
| `jeditor/docs/decisions/0023-blueprint-packs-shared-across-levels.md` | 430 | `f0dd290a7bbc4c422ba54f8a4f3c1e973c3025ab45d34564caf7aa066eb035e6` |
| `jeditor/docs/decisions/0024-ranking-ui-v1-scope.md` | 904 | `e7ae31e7c2bffac8c2cb3995c03e732599937ca4309d783770c24d7844974dbc` |
| `jeditor/docs/decisions/0028-jrankshare-scorer-and-board-snapshot.md` | 1216 | `7e88c737457df27af32a8922275063855578ef198ea1ae772f324569c16952cf` |
| `jeditor/docs/decisions/0030-calendar-logic-embedded-verbatim.md` | 1462 | `bf93d8ea04c6659e763cef2c3381801f55a8e9d947fe6bbeb45993b759b122a8` |
| `jeditor/docs/decisions/0031-plan-view-alternatives-paths-scoring.md` | 2848 | `9d546e68401a8d22fa90566160a000aed391e6c6cabddd73d02991f132544e81` |
| `jeditor/docs/decisions/0032-live-rank-caches.md` | 1268 | `267ff071c9191f4837a19e137aa6888d9745a405ec671eff14fcb59049a92eec` |
| `jeditor/docs/decisions/0033-editor-model-mode-packs.md` | 3351 | `353d5591290cd363fc1d6b5cd09ed9ab3862097d2835f28398a7f05be4254a2f` |
| `jeditor/docs/decisions/0034-rank-mode-sync.md` | 1388 | `af3918e3fbf872616f30d54d72b73b096e3edb7a5d532fa2a787e6219f29d6a9` |
| `jeditor/docs/decisions/0035-read-only-original-comparison.md` | 891 | `d6c1cfd65ff9042359e51b8ad3d9ff63c60440a68a67b78898670268761150b0` |
| `jeditor/docs/decisions/0036-variant-source-model.md` | 1284 | `30188ab105474031114069c69035f50e7fadd151bdeee3117fce4dd1f48f612f` |
| `jeditor/docs/decisions/0037-save-format-versioning-export-check.md` | 1682 | `552e0e2f42131fc3fa83f3a7a2dc76f3c42cf9d4032acb65afbac7bc074a2cdd` |
| `jeditor/docs/decisions/0038-editor-history.md` | 931 | `2dd2052264bd2a7ddcb520746b1bf5ad057e2468ab35eb2086228d7e50f12bb9` |
| `jeditor/docs/decisions/0039-field-by-field-model.md` | 1934 | `0bd434ccd8f03ec3cbc0aa31d4e62a7651aae9b80d57f0266eafea72ecb83e08` |
| `jeditor/docs/decisions/0041-board-parts.md` | 2805 | `0da18ca61820945de9acc8c83f20dae7e17caa8aab6baedcfac9ec6384a2da36` |
| `jeditor/docs/decisions/0042-motion-overrides.md` | 2113 | `0f83214e9cb3430b2cb5db95eadd2dc1bc394f2acfa993c8a1fcf9af9d1fabd1` |
| `jeditor/docs/decisions/0043-persistent-history.md` | 1458 | `5bdd17ba9e95927f74a8831e8dbc8361ac5550da228f0723ea6abf442e6ee95a` |
| `jeditor/docs/decisions/0044-layout-model.md` | 3471 | `a39317c6e07d55764f8660f48ce995745d4f5caa25f4a25a9960e8b9b697a80e` |
| `jeditor/docs/decisions/0045-theme-model.md` | 2035 | `b6e2f701660c064531aeffac8c1cd40658a0d9a17ebbc0a87fbff8bee8f65a09` |
| `jeditor/docs/decisions/0046-animation-file-format.md` | 2993 | `2c5a00d65c718cda5901e2e5af3e9358ca3ebc8b5fe233acf8f8efc46bcd2a2f` |
| `jeditor/docs/decisions/0047-data-system-model.md` | 1733 | `d11e91fc3239fb99d769df1874ce3c60e2a620e25f526da870947171045d52aa` |
| `jeditor/docs/decisions/0048-blueprints-and-jfactor-scorers.md` | 1591 | `8c97d17ca3fa3a9cf356cee2f7d45e1f95e16cb38a0d8e73d04703a8a71122e6` |
| `jeditor/docs/decisions/0049-data-persistence-and-seed.md` | 1000 | `034ffc7a3227c67d995e21bc87824476739f99b0bfa0e953e7d2450d92e126d1` |
| `jeditor/docs/decisions/0050-migration-tool.md` | 1222 | `27a332765ebaabc734980f6e7166fc3b8b980104a13994a9da9976ab1c7beb81` |
| `jeditor/docs/decisions/0051-items-first-class.md` | 1525 | `aeaf4e758d8d63f99d4810fc5211852e1300e2aaa875eb42be7b1c1d97555811` |
| `jeditor/docs/decisions/0052-joys-universal.md` | 1437 | `1bc342d45b40a2923ed19a493c3b15a1fd57a0e86d4da6683d746fa69b618ee6` |
| `jeditor/docs/decisions/0053-item-blueprints-scoring.md` | 1732 | `985f98484254fc9479d16383e0315bd13b45223f57365824c545136c6426df1c` |
| `jeditor/docs/decisions/0054-ranking-on-items.md` | 1648 | `addc1144cf06158e0f603b61f0018f1d71ece14cc061ff924ca10009711de15b` |
| `jeditor/docs/decisions/0055-item-overrides-alternatives-plan.md` | 1616 | `04b0c2f20093eab365c6701d6ef6d306d536d14cbf7534346c4f37f4c4fe4e9e` |
| `jeditor/docs/decisions/0056-data-packs.md` | 1224 | `d8bc8250dbd9adc0c1f085c1a52704dc776276d53bf24d2c9c0c8b707fdbd047` |
| `jeditor/docs/decisions/0057-m13-verification.md` | 556 | `8b51d9b75f96ddc7eeace20b9bd538fa41374e7d4a7014f6d24bbdc35824e6fd` |
| `jeditor/docs/decisions/0059-calendar-on-items.md` | 1400 | `a9ddfd12e272fc67034bcbcb81b965f446468f03772c012d928c657a13dfbbe4` |
| `jeditor/docs/decisions/0060-board-joys-and-remaining-code.md` | 978 | `403f2d68c7b5fbb674d543eb94afb1730ca5aebdf9d24a6db23b8161c1c139e9` |
| `jeditor/docs/decisions/0061-calendar-editor-panel-and-act-sync.md` | 1349 | `aac595eb7d39eb4b21d48735698de96c73f7943dff082abea61151f07b7266e7` |
| `jeditor/docs/decisions/0062-calendar-and-jrankshare-as-nodes.md` | 913 | `41603ea59563952f3fe11205265da311421134a691163accad1e3e42c42765c8` |
| `jeditor/docs/decisions/0063-auto-condition-labels-and-shared-values.md` | 595 | `2d037a6c016ccc133db65223bc1aa2a9c724db7dc68ea3307712b350de8939f7` |
| `jeditor/docs/decisions/0064-m14b-remaining-code.md` | 1024 | `1e70deef79acec41a39dd15583b579c97fcf0bcb637aea42c4a81d7ebdff96bb` |
| `jeditor/docs/decisions/0065-generic-item-calendar-plan-board.md` | 1667 | `91e0e9d2f0beebc0eb3328fff5f74a7b5ab94cd8a492f2eed2fe1c6414342dc9` |
| `jeditor/docs/decisions/0066-scenarios-are-legacy.md` | 1732 | `174ab693326e6f72e48d1019050040c24e651f38600a929a395b8e7eb0ae1473` |
| `jeditor/docs/decisions/0067-ranking-data-six-tabs-board-view.md` | 1302 | `11da388df4ddcb3cae61c74aa649df94ba5851146c23e43ddff6e47bfafcdf59` |
| `jeditor/docs/decisions/0068-as-of-control.md` | 1036 | `8c6464465a44cbc71028fa6aaf4c9f484728f03ff5937ded6c881c4bfcd674d2` |
| `jeditor/docs/decisions/0069-live-alternatives-port.md` | 2292 | `7f02f4a7b8c93db418cd308a33fd77111d2f2fb5bba0e923209cd999671228f2` |
| `jeditor/docs/decisions/0070-plan-tab.md` | 1731 | `e45120ac5e08a244e922995edd0e1d8f58efb399e8b7be0b4fb7223fe413eee9` |
| `jeditor/docs/decisions/0071-asof-money.md` | 822 | `643916bf288dce82dbc4b9c0d9f66c919191e16a82a18793c36f98dbd5035b75` |
| `jeditor/docs/decisions/0072-pinned-date-parity.md` | 627 | `15ad42812b36b89fbc4de0102f4f77d81b00c70fb6ce9ad8dd3074d49f546461` |
| `jeditor/docs/decisions/0073-itemcal-editor.md` | 1261 | `aea96144575cc5aa546efc89c678d8ef6ed384e58bc5e0ccf936bdd7b3cc1b62` |
| `jeditor/docs/decisions/0074-generic-deps-sequence.md` | 1221 | `c74f7dc09578bb54588edb8440882c9516d6f6937614c9ea4f58dbac2138ba5f` |
| `jeditor/docs/decisions/0075-plan-under-calendar.md` | 1740 | `2825a895963c42c816c6bab79d563a07ab8bcb3fc2e41211590762692fef880c` |
| `jeditor/docs/decisions/0076-ranking-data-six-tabs.md` | 1036 | `095185423ed03a72c99817ab7e584249ea7026ca269d8af9b674b0d705b3f89e` |
| `jeditor/docs/decisions/0077-editor-discoverability.md` | 1056 | `768b15fad85aad77556f3993856915581c282560b939dae3044ee464eaa404e6` |
| `jeditor/docs/decisions/0078-world-holds-everything.md` | 1259 | `9e7d71a51a62a4e134f43123db1fef63f84c4a82f7653324727900f68b7f6b46` |
| `jeditor/docs/decisions/0079-items-are-jgroups.md` | 1845 | `76c34c72a8b922c0acb005beb2ace6751c8dba6d45611e7a87a74ba557cd641a` |
| `jeditor/docs/decisions/0080-joys-and-clock.md` | 701 | `a321ec5681a836fd67f1412cc6aa53ae6d0105bf49ce63ea2942ec2a2c6cbc85` |
| `jeditor/docs/decisions/0081-blueprints-and-nodes.md` | 2810 | `c1de17ff182660b085094c7706f74c6aab0e62a23bf52802f6ab6c8695b1d477` |
| `jeditor/docs/decisions/0082-components-views.md` | 1403 | `edbba7464a1ba377d20867174b2852300aaf2b7d67f634bbb95dc86fa703ec04` |
| `jeditor/docs/decisions/0083-templates-and-delete.md` | 781 | `19fd3b97bda190cbc50eab38a4ed8eec4c37869e732524a7fabdf6724326f8fb` |
| `jeditor/docs/decisions/0084-parallel-evaluation.md` | 2379 | `1858ea86741f8bc8192657153757be7c7f54587086439e11ee283f88e018775e` |
| `jeditor/docs/decisions/0085-premade-components-legacy-path.md` | 1474 | `6f4db44b703b0b5944704093dc82fcdf481000140aaaaeadb0f3f523ee7670e0` |
| `jeditor/docs/decisions/0086-exp6-alternative-picks.md` | 1124 | `6172d44ea1bda192018e69c6bc22c51ceee27ced2fe29053747f72d2b1676b68` |
| `jeditor/docs/decisions/0087-drag-drop-events.md` | 1114 | `8c7055d0c615b1180967411336765ac73014e9171bcd5b99ed816763033e2383` |
| `jeditor/docs/decisions/0088-broken-refs-fixref.md` | 697 | `39b0aba03fc5ea72fe6385e0b1ceb673848e67458fce924077592633fc22c155` |
| `jeditor/docs/decisions/0089-component-janim-states.md` | 699 | `92e36cdeac2d9e330945325b6b8fd6c6f90f5ed121cef26e905a686f9e3059dc` |
| `jeditor/docs/decisions/0090-world-editor-routes.md` | 946 | `7ca0fd7dbd96e700f6299cee5c96a26bde680078deb022d6a0d9879e2eae25a0` |
| `jeditor/docs/decisions/0091-calendar-template.md` | 1287 | `747b5206c6f3ff914de73352c2184303fbc20baebb66695564d60b46fd7ac285` |
| `jeditor/docs/decisions/0092-days-node-per-day-conditions.md` | 751 | `7283fd6589019db95117bc692398f16fb35e33ed676d7733e6249da6ce542579` |
| `jeditor/docs/decisions/0093-legacy-itemcal-missing-collection.md` | 710 | `2f0f6a42a07c6d1a4d348095b2c7195188e450f2c0d4e774a5abc53342bb5368` |
| `jeditor/docs/decisions/0094-view-node-reads.md` | 413 | `5e4cc6a36d46d561a94910fbc55ee117766fb19cd66fb9d803a92a6c2b18a2bb` |
| `jeditor/docs/decisions/0095-accumulate-node-and-charges.md` | 942 | `a2739dd329e3702ae5d13f50e77b1f894b90018d917f8f9455024dfe76603b02` |
| `jeditor/docs/decisions/0096-merge-node-condition-b-view-label.md` | 557 | `56dfe6f3e9d4563029f3e55718cba53a505ff4e3d99b66362def988b48975d5a` |
| `jeditor/docs/decisions/0097-calendar-view-controls.md` | 817 | `3d08dd4bd701c18af156a2ec68d681c8ac57854cba8e7be34516bed05a0a2dec` |
| `jeditor/docs/decisions/0098-money-preset-importer-parity.md` | 960 | `2026456117c5454bf487f2991b48d570eaffd60cf08ffc35dc287d1e36873a8d` |
| `jeditor/docs/decisions/0099-automatic-page-stamp.md` | 365 | `b8fb6ae7da27ea5f287ac4d0f9a019d51c786305430d60808d2342c1d4306bcd` |
| `jeditor/docs/decisions/0101-generic-table-kpi-text-views.md` | 1325 | `3ee2c265b56ec6807a402f5f63acc1099a9dbc9d5879455891345df2d3ba729b` |
| `jeditor/docs/decisions/0102-income-tab-world.md` | 839 | `6cd03f27c630db18d9998b19b7d31cb5f80d792e26b138c13a56d7a93269cc6d` |
| `jeditor/docs/decisions/0103-formula-filtered-sum-choice-alts.md` | 1562 | `1fed56d5ef5897cef2781609241c95f72850be1daec5dec8b533cd162736b875` |
| `jeditor/docs/decisions/0104-plan-deps-section-world-v5.md` | 2198 | `492342c263a18347e55e01ebaa9d03c6571c9bca1f78c2f9d686737e42b8a574` |
| `jeditor/docs/decisions/0105-exp7-standard-layer.md` | 3818 | `5a04c9cab89bf0c24c1cb97ba93667fc7bc36622c01a37ff8ce2c65e5b2cd39c` |
| `jeditor/docs/decisions/0106-atlas-naming-and-verse-like-direction.md` | 1485 | `4896a7e003d199d95f6d4b21d9ea4bfb133cd285774b2b4c32907e2d4175f8ac` |
| `jeditor/docs/decisions/0107-atlas-rename-round-2-and-stored-values.md` | 2688 | `f516a2b0dda7f1a1c15aa7e4e8f4e7c9cf4f42675b4dcae7d3fb5d9c2f37c014` |
| `jeditor/docs/decisions/0108-exp7-op-edge-cases-and-changed-shape.md` | 1249 | `082e1163c8c9e52c72f0332eb77cee4ec22ce32b74a52997d0bd45d45f61446c` |
| `jeditor/docs/decisions/0109-exp7-best-sync-hybrid.md` | 834 | `fcea8d5b20ef6ff4be14d09456590dce4c0564b24b9ca943cca64f7ea88f341a` |
| `jeditor/docs/decisions/0110-exp7-circuit-language-v0.md` | 1061 | `7b86ef12e9131c13512e65c55eef4c14f8beb40211809812e93c77070fb772e8` |
| `jeditor/docs/decisions/0111-exp7-sync-core-codec-compaction-cli.md` | 2113 | `969834651d1d019775f655d1df6ce111d806e1157701ce5cbc9c7ae4900332f0` |
| `jeditor/docs/design/01-commonalities-survey.md` | 5065 | `0bd004afa41f22dc8b8fa3ff18278806120214380b0cba0717973a3639739d3b` |
| `jeditor/docs/design/02-animation-binary.md` | 6621 | `c79ebe630aeff399c3d24c95a7f4d7926e74c25bdb34176a1f5341c2703b0113` |
| `jeditor/docs/design/03-level-format.md` | 4673 | `a975cf3e90011844d8d9f7643193ea9901f087c85f8cf356fce9e34d0e3fde50` |
| `jeditor/docs/design/04-component-model.md` | 3282 | `17ef0a71068dc2218a88951c072e31a3d508e25eecec0ce94e4d46bd7f575f5d` |
| `jeditor/docs/design/07-m2a-engine-report.md` | 5219 | `409fd09e4a24bc48471b6818983412739b4fba4d57838800ffe9f1dda94c512c` |
| `jeditor/docs/design/09-m3-report.md` | 1983 | `585c8741999287b1ec43526f861cf7998379b656b63bc2a46e3421e07d66a40c` |
| `jeditor/docs/design/13-m7-report.md` | 3765 | `63fdcb358bf0361529af726297bcfa4f6632d683a2c644fb67bfab859032ce2f` |
| `jeditor/docs/design/15-m9-report.md` | 6705 | `b13c8751c51c2189029d623ae65758ee426da8d35cd078b6acb98928a7034ccd` |
| `jeditor/docs/design/16-m10-report.md` | 5005 | `3e013354590d043db7952ac7b5c3c15a91a2648398dd2e9e69a8b14a8e4e13a1` |
| `jeditor/docs/design/18-m12-report.md` | 4683 | `2927a060de7fe26399e66fdc365f4d3c3bfa221ec336d0df0f853184300842f8` |
| `jeditor/docs/design/19-m13-report.md` | 3914 | `f880e3b96b40c6d44d698c4dcf087d8c6f80a89261b2b5ac8300d1957adcc2ce` |
| `jeditor/docs/design/20-m14-report.md` | 2612 | `7eb855908768aff0b525ce9096ec11038a5d5bc265326b46876599943b9155e5` |
| `jeditor/docs/design/25-world-and-components.md` | 4419 | `eff33f718de71535ec0f1ddb257130d916da67becadc4244f0e328d91d690821` |
| `jeditor/docs/design/26-m17b-report.md` | 3535 | `68d434010f6f81f91f8d996ceb1f7b16c6e77371ef65a0fe0c843b7a377b0229` |
| `jeditor/docs/design/27-m18-report.md` | 2203 | `d1459b8edb78516e96a8651f3187a998348034c854f5b623109e02fbef78bf93` |
| `jeditor/docs/design/32-m20b-report.md` | 567 | `df67863c87547366efbb10d16eb9f5421276d51a926c7d670f12438dfe74fec3` |
| `jeditor/docs/design/38-m20f-report.md` | 1072 | `a30f69feb5791ed0c426d47e7890e821b279f683fc0bf692ee0089815d791dab` |
| `jeditor/docs/design/43-m21e-preview-modeltools-run.md` | 1056 | `05e04e995a30fd269dbb5e4e4b1383bfb8382556c386f9cd653ac70e2ff0f33b` |
| `jeditor/docs/design/44-exp7-proposal-traffic.md` | 12914 | `613c54ca7d706e50c5cbb0cc1dcb7dfb19986740aafb0d7b0a5e282f7102aca5` |
| `jeditor/docs/design/44-sample-proposals.jsonl` | 4955 | `5cd1357aac2869787b69fbf9cb7c4aeeb4266f0ea0cfedced5ce21711853262e` |
| `jeditor/docs/design/45-exp7-circuit-language.md` | 10857 | `26ceb0e5c45b9fac1ce0dfc7c64cf54af04eea25fa6bb69551db622e5f18323f` |
| `jeditor/docs/design/46-exp7-container-name-audit.md` | 9387 | `265678183e96c3f9e4befcdcec2910376bf66c220e512c6253450403f8daaf11` |
| `jeditor/docs/design/47-exp7-outside-process-connection.md` | 21739 | `39459f52a47f0b3e622a0b693b21591f296250d4bfa93883ecc2e9ce1bc175e5` |
| `jeditor/docs/design/48-exp7-async-best-test.md` | 5265 | `f5cf55019fe950f63a8abbe7eb38bae2c34943a1458ccc66e495ed87bd823245` |
| `jeditor/docs/design/49-ranking-atlas-to-exp7-migration-plan.md` | 3208 | `5c2ff4885b920b9279aefa7121e0e2c65291f07d15921d84ae391c4b59dcb792` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/AGENTS.md` | 1260 | `0ef9e466bca74554a2409b29ae971f3911577a3ad49d85e86e4bc151f5996ef6` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/ABSTRACT.md` | 2172 | `6820ae0140f9edcd8d0eef4838e7ce72dfafcc7d01637404bbf5276c02146b18` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/ARCHITECTURE.md` | 2951 | `690b0093967926ae8762b2ade184c49d8d909ea62153e5467f8571e8e14f1693` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/ARXIV.md` | 3745 | `3f506c419b8e484300ebfcdc3e68fa26bdd73cd749bd07b6c85998cea8ef44ba` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/CONTRIBUTION_PATH.md` | 1468 | `59d85a132e4c00aee7576bdd9524075d935ebd8186ba276d4961a9aad40fedf9` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/PAPER.md` | 4687 | `234628745e8e7528599089e0cbc779b7ac5da6e976bc7f8551c80858a22da7ae` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/PROTOCOL_hop0.md` | 6157 | `9e026890cb895f0a7f040d298ba0c3d9a354744390d7cd572e1184387189d3e2` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/REFERENCES.md` | 3297 | `3a025421d6f38519ae0e74f3ea545a3df32a72455b9e1c03ced2126caf75759a` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/REPRO.md` | 1666 | `d41044b5ea3c8d41f6e93131f73b22d1305ef65f382cdec7f9c046edc2914b1f` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/SUBMIT.md` | 2217 | `34a2859ef2e12a16e5035362a4c1198e44660221189d6764d81ce2db93fc3df8` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/THESIS.md` | 8130 | `6ea8fb94ff056b5af96902ebd469cad86e1a86cd8d29140dd2fc477c1e2a3ef1` |
| `jeditor/docs/legacy-reference/exp6/jfactor-lab/docs/hop0_latest.txt` | 2180 | `425045a5713a52e5f6453d5f5de123631dd99135024f7cef7602db6740c56104` |
| `jeditor/docs/legacy-reference/jfactor/api/README.md` | 3695 | `546541aeba27139db2b3b66e7aaa363abf36dca2457c652dfdece9dddbf801ab` |
| `jeditor/docs/legacy-reference/jfactor/api/concepts.md` | 2541 | `0180f323d777c2ba4868e961219a5366dd016b79b4ae4ad149496e29aececf5e` |
| `jeditor/docs/legacy-reference/jfactor/api/events.md` | 2518 | `67db1fb304be7a1dde8e38bd11a3e198204573f18713aa8f19f98e4bc2e73853` |
| `jeditor/docs/legacy-reference/jfactor/api/jaction.md` | 1557 | `12cbe250a25fd156c266c581124e43b28cb78f549cb284a5a88c13510e2cd5a0` |
| `jeditor/docs/legacy-reference/jfactor/api/jblueprint.md` | 5547 | `40f6e7226b6174cc3532eab9cf169796c5155736f316c1d897ab912f2f7ab87b` |
| `jeditor/docs/legacy-reference/jfactor/api/jgroup.md` | 1797 | `f195ce884ccf032a761a8d9958947bbcdb6194a5baa20e5bce906d5f56a46809` |
| `jeditor/docs/legacy-reference/jfactor/api/joy.md` | 1000 | `a28f05598272e4ac4e746cc2b23ec288bbe6a516735acf2eb20043818474d87a` |
| `jeditor/docs/legacy-reference/jfactor/api/jrelation.md` | 2108 | `d16d76e6691adfa0a57c81d2ea5ae5a924165b7df4d14d48fe97241fe56a4275` |
| `jeditor/docs/legacy-reference/jfactor/api/jworld.md` | 2154 | `0dd9c54445de43e5a9f3297e77024938b5ac2c000ac756e340786f133bfe79bb` |
| `jeditor/docs/legacy-reference/jfactor/api/quota.md` | 1169 | `806638f7c440c1c713b415228f3dbf98642e2f97d5314da8b1fd030f51bf7f8f` |
| `jeditor/docs/legacy-reference/jfactor/api/scoring.md` | 1875 | `a33c757675d54c9d97a81ac5b8c5119de34b778966c73196ef8b3a2b94f2109c` |
| `jeditor/docs/legacy-reference/jfactor/cursor-rules/jfactor-api.mdc` | 1420 | `c42ba43f3e8262343b964ae5dc5ea8498207ff2e63c72258d1d8349d3a1f6bc9` |
| `jeditor/docs/spec/.gitkeep` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `living-core/README.md` | 4675 | `fe73a4d3ad27af4480a088e4574003962411e3e801f84f75c08bef8a402ba195` |
| `living-core/ceo_self_prompt.md` | 7713 | `42b2cfa51f82a5fd2ec44faa87105d326f5e7ea2a5b616b94910e576a393698d` |
| `living-core/docs/PUBLIC_TRY_IT.md` | 776 | `19183e07aa81c6ad9e3720d9678f744334e8096841b2b4b2f36985e68a7b2f15` |
| `living-core/docs/TRY_IT.md` | 492 | `71b55fbfea87dd808a684dcc662602e29889292c8c79482733a5131439a7ffca` |
