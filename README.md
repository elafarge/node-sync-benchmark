Node sync benchmark
===================

This little benchmark helps at understanding how and when (for, reduce, each...)
the NodeJS event loop may be completely partially locked on a Webserver.

Getting started
---------------

#### Requirements
 * `yarn`
 * `typescript` in a decently recent version
 * `curl`

#### Building and running the code
```shell
# Install express
yarn

# Compile the code
tsc --build tsconfig.json

# Run the benchmark
node dist/index.js

# (in another shell) Block the event loop
curl http://localhost:8080/find-n-primes/1200

# (in yet another sheel) Watch the event loop being blocked and released
curl http://localhost:8080/healthz
```

API endpoints (add yours as you wish)
-------------------------------------
 * `http://localhost:8080/healthz`: simple health check, replies instantly
 * `http://localhost:8080/sleep/:duration`
   Replies to the request after N seconds in a Promise-based *non-blocking* way
   - `:duration` number of milliseconds to wait for
 * `http://localhost:8080/find-n-primes/:primecount` find `:primecount` prime
   numbers between 0 and 4,000,000,000 using `Math.random()` in a *blocking*
   way.
 * ... TODO ... reimplement the above endpoint using `each`, `reduce` or other
   methods we want to check for blocking behaviour

Authors
-------
 * Étienne Lafarge <etienne.lafarge _at_ gmail.com>
