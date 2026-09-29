# P10 current read-only case selection

- Method: `capture.mjs` opens the real CARD04 TaskHandle and current task worktree, then calls `capturePreExecutionTaskChangeScope`, `readCurrentTestAssetRegistry`, and `selectAffectedCases`. It reads the current business catalog and checks each of its three source/rule SHA-256 bindings. It does not call the fixed test launcher or run tests. Complete returned objects and path lists are in `raw.json`.
- Identity: HEAD `ef920f1fbd415fe87d50930359059b661e141acd`; snapshot tree `4381e90d43a7072ba12d1a4359ba757c3ddd5786`; material revision `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`; catalog SHA-256 `a16fd876ad2935fd812835c56f863a4b91bd33ac4f618b3edca32d5d763a32d9`, revision `2026-09-28.card04-current-source-rebind.11`; registry SHA-256 `b5f7c79668c9fcaa91b6fa4beea96b292e878534fe5e32ca13938fcb79f0e957`. Pre/post scope, material, catalog, and registry matched; all three catalog source/rule hashes matched.
- Changed paths: **217**. Exact catalog trigger matches: **9**. Unmapped: **208**. Selection returns `unavailable / unmapped_changed_path`, with all three existing cases retained as candidates. The selector labels its supplied inputs `supplied_unverified` and `test_execution_status=not_run`; no unknown path is excluded or called passed.

| Path group | Changed | Mapped | Unmapped |
| --- | ---: | ---: | ---: |
| CARD05 archived material | 51 | 0 | 51 |
| CARD04 current material | 16 | 3 | 13 |
| runtime | 22 | 6 | 16 |
| tests | 74 | 0 | 74 |
| skills | 21 | 0 | 21 |
| workflows | 15 | 0 | 15 |
| docs | 11 | 0 | 11 |
| tools | 3 | 0 | 3 |
| core | 1 | 0 | 1 |
| other root files | 3 | 0 | 3 |

- The three candidate cases are `CARD04-ACCEPTANCE-MACHINE-CLASSES`, `CARD04-DEFERRED-ACCEPTANCE-REGRESSION`, and `CARD04-DECISION-LOG-CENSUS`. The nine mapped paths are six `runtime/**` files and three CARD04 decision/phase materials; their exact names are in `raw.json`.
- The external Task `facts.jsonl` SHA-256 remained `4ba4ddbf38c6f480ea29be0dbab7705c031d38cce58bd9b5afe2328d2d7402a6`, matching the earlier P7 read-only identity record. This capture wrote only this evidence directory.
