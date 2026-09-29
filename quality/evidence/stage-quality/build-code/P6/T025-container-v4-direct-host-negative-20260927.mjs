fetch('http://172.29.0.254:48173/sentinel.txt', { signal: AbortSignal.timeout(3000) })
  .then(async (response) => console.log(JSON.stringify({ status: response.status, oracleReadable: (await response.text()).includes('AC17_ORACLE_SENTINEL') })))
  .catch((error) => console.log(JSON.stringify({ error: error.cause?.code || error.name })));
