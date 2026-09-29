import hashlib, json, os, subprocess
from pathlib import Path

worktree = Path('/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919')
baseline = Path('/tmp/workflowhub-p10-fixture-baseline.8Hax8i')
evidence = worktree / 'quality/evidence/stage-quality/build-code/P10/T021-current-case-fixture-isolation-20260928'
fixture = 'tests/contract/build-code-case-reconciliation.test.mjs'
cases = {
    'reads': 'reads all bound reporter leaves, then keeps the missing business effect unknown',
    'older': 'does not turn an older matching receipt into a new run through a caller dispatch claim',
    'forged': 'does not treat a forged current fact ref as a business effect',
}
results = []
for version, cwd in [('old', baseline), ('current', worktree)]:
    for name, title in cases.items():
        for mode, pattern in [('alone', title), ('after-official', 'ORACLE-P10-OFFICIAL-FIXED|'+title)]:
            label = f'{version}-{name}-{mode}'
            argv = ['/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest', 'run', fixture, '-t', pattern, '--poolOptions.forks.singleFork', '--no-fileParallelism']
            result = subprocess.run(argv, cwd=cwd, env={**os.environ, 'TERM':'xterm'}, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=120)
            output = result.stdout
            (evidence / f'{label}.txt').write_bytes(output)
            item = {'label':label,'exit_code':result.returncode,'sha256':hashlib.sha256(output).hexdigest(),'bytes':len(output),'argv':argv,'cwd':str(cwd)}
            results.append(item)
            (evidence / 'results.json').write_text(json.dumps(results, indent=2)+'\n')
            print(f'{label}: exit={result.returncode} output_sha256={item["sha256"]}', flush=True)
