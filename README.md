Node sync benchmark
===================

This little benchmark helps at understanding how and when (for, reduce, each...)
the NodeJS event loop may be completely partially locked on a Webserver.

It runs a simple (but CPU & time consuming) algorithm that finds N prime numbers
between 0 and 4 billion, in different flavors, using different
NodeJS/Lodash/BlueBird primitives.

NOTE: we automatically detect when the NodeJS event loop is locked for more
than 100ms and display that information on `stderr`. The script doing that is at
the end of `index.js`.

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
curl http://localhost:8080/findPrimes/1200

# (in yet another sheel) Watch the event loop being blocked and released when
# the call to the first route completes
curl http://localhost:8080/healthz
```

Blocking-behaviour benchmark of native, Lodash and Bluebird's functions
-----------------------------------------------------------------------

### Some simple, non-blocking endpoints to start with
 * `http://localhost:8080/healthz`: simple health check, replies instantly if
   the NodeJS event loop isn't blocked

 * `http://localhost:8080/sleep/:duration`
   Replies to the request after N seconds in a Promise-based *non-blocking* way
   - `:duration` number of milliseconds to wait for

### 1. Node and Lodash primitives are all blocking, use them with caution !!

NOTE: on my computer, setting `1200` for the `:primecount` value gives good
results (it takes ~10s for the algoritm to run to completion). Feel free to tune
that parameter to match your hardware ;-)

 * `http://localhost:8080/findPrimes/:primecount` find `:primecount` prime
   numbers between 0 and 4,000,000,000 using `Math.random()` in a *blocking*
   way, using a simple `for` loop.

 * `http://localhost:8080/findPrimesForEach/:primecount`: a variant to see if
   Node's native `Array.forEach()` is blocking... the answer is *yes*.

 * `http://localhost:8080/findPrimesReduce/:primecount`: a variant to see if
   Node's native `reduce()` is blocking... the answer is *yes, it blocks*.

 * `http://localhost:8080/findPrimesLodashForEach/:primecount`: a variant to see
   if lodash's `forEach()` function is blocking... the answer is *yes*.

 * `http://localhost:8080/findPrimesLodashFPReduce/:primecount`: a variant to
   see if Lodash FP's `reduce()` function is blocking... the answer is *yes, it
   blocks*.

The bottom line is: **be cautious when using these methods over big objects or
arrays**. They may block your server's event loop (and therefore all of your
clients) for quite some time.

This case (locking the event loop for seconds) is a bit extreme of course but
when running `reduce` ovec big JSON files, the event loop can be locked for a
few milliseconds/dozen milliseconds/hundred milliseconds (that really all
depends on the size of the data structures you're working with).

At scale (potentially hundreds of request in parallel per server, or even
thousands), just a few milliseconds of event loop lag (let's say 10ms) on an
endpoint called often (let's say 100 times per second) will result in the even
loop being blocked 1 second... every second. In other words, your server simply
won't work as the event loop will never be free for it to perform other tasks.

### 2. Working around the event loop

#### Requirements
To begin with, reading the [related article in the official docs](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
will probably help you understand what we're trying to do here.

Also, any NodeJS developer should be aware of [how the event loop works](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/).
In addition to understanding locks, this document may also help understanding a
completely different set of synchronization errors, especially when using
`nextTick()`, `setImmediate()` and `setTimeout()`.


#### The solution

As highlighted in the [first article](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/#complex-calculations-without-blocking-the-event-loop),
there are two solutions to avoid blocking the event loop when performing
intensize computations on the backend:

 - **partitionning** the computation over multiple cycles of the event loop (by
   releasing the event loop *explicitely* at the end of each computation step)

 - **offloading** the computation somewhere else (the only limit to what this
   "somewhere else" is is your imagination and common sense: it can be a
   subprocess written in node or any other language, a [serverless
   function](https://en.wikipedia.org/wiki/Serverless_computing#Further_reading),
   a server/container created in the cloud just to run that particular
   computation, etc...

Let's just focus on **partionning here** for now.

##### API enpoints

 * `http://localhost:8080/findPrimesAsyncHack/:primecount`: a re-implementation
   of our algorithm (we yield the event loop every time we find a prime number)
   in a non-blocking way... verbose, but efficient.
   Suprisingly, the performance drop wrt. the synchronous version is rather
   acceptable (~30-40%).

 * `http://localhost:8080/findPrimesBluebirdEach/:primecount`: using Bluebird's
   each (but the **native** `Promise` object ! it doesn't work with Bluebird's,
   sadly), it's possible to get the same behaviour

 * `http://localhost:8080/findPrimesBluebirdReduce/:primecount`: Bluebird's
   `reduce` method works as well, with the same restriction of having a reducer
   that returns a **native** `Promise` object.

### Other methods

As you can see, working around the blocking aspect of long computation in NodeJS
is totally possible. However, all these approaches are a bit cumbersome. We've
tried other things... and still hope to come accross a better solution one day
:/

##### Unsuccessful attempts

 * `http://localhost:8080/findPrimesPromiseAll/:primecount`: using the native
   `Promise.all()` on Promises all launched in parallel doesn't work.

 * `http://localhost:8080/findPrimesAsyncAwait/:primecount`: using async/await
   on native `Promise`s sequentially, hoping for the event loop to be released
   at the end of each Promise resolution turned out to be unsuccessful as well
   :(

Going further
-------------

* [what happens when the event loop is blocked on a production server](http://www.juhonkoti.net/2015/12/01/problems-with-node-js-event-loop)
* [a simpler way to block the event loop in nodeJS](https://gist.github.com/ghaiklor/9682b79353aade8a1e59)
* [an (old and unmaintained) NPM package that contains array methods which
  release the event loop](https://www.npmjs.com/package/nonblocking), I didn't
  test it but, looking at the code, the approach relies on `setImmediate` just
  like the one we tested above

Authors
-------
 * Étienne Lafarge <etienne.lafarge _at_ gmail.com>
