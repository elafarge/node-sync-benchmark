// 3p
import * as express from 'express'

import * as f from './functions'

const app = express()

// Just a simple asynchronous sleep function to begin with. Calling this route
// won't block the event loop
app.get('/sleep/:duration', async (req, res) => {
  await f.sleep(req.params.duration)

  res.json({ 'duration slept in background': `${req.params.duration}ms` })
})

// A simple health check that can be called to see if the event loop is blocked
// during the execution of another Express route
app.get('/healthz', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' })
})

// For each of our synchronous functions, let's create a route
const functions = [
  'findPrimes',
  'findPrimesForEach',
  'findPrimesReduce',
  'findPrimesLodashForEach',
  'findPrimesLodashReduce',
  'findPrimesLodashFPReduce',
]

functions.forEach(func => {
  app.get(`/${func}/:iterations`, (req, res) => {
    // NOTE: on real production systems, one may prefer process.hrtime...
    const t0 = new Date().getTime()
    const primes = f[func](req.params.iterations)
    const delta = new Date().getTime() - t0
    res.json({
      message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
    })
  })
})

// Let's do the same (with an additional await) for our asynchronous prime
// number lookup function
app.get('/findPrimesAsyncHack/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesAsyncHack(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// Another non-blocking implementation using bluebird's each() function
app.get('/findPrimesBluebirdEach/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesBluebirdEach(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// And another one using bluebird's reduce() function
app.get('/findPrimesBluebirdReduce/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesBluebirdReduce(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// And the last one using the native Promise.all() method... spoiler alert, it's
// blocking
app.get('/findPrimesPromiseAll/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesPromiseAll(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// Ok, that's the last one, using async/await and promises
app.get('/findPrimesAsyncAwait/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesAsyncAwait(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// Ok, that's one more, trying with awaity
app.get('/findPrimesAwaity/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesAwaity(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// With a b it of abstraction
app.get('/findPrimesCustom/:iterations', async (req, res) => {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const t0 = new Date().getTime()
  const primes = await f.findPrimesCustom(req.params.iterations)
  const delta = new Date().getTime() - t0
  res.json({
    message: `found ${primes.length} prime numbers in ${delta} milliseconds`,
  })
})

// This little piece of code detects when the event loop is blocked (by creating
// a timer that SHOULD be executed every 1ms and measuring the lag between the
// expected execution time and the actual execution time
// It is heavily inspired by: https://github.com/tj/node-blocked/blob/master/index.js
const pingInterval = 1
const alertThreshold = 100
let nextELPing = new Date().getTime()
function pingEL() {
  // NOTE: on real production systems, one may prefer process.hrtime...
  const now = new Date().getTime()
  if (now - nextELPing >= alertThreshold) {
    console.error(`Event loop was blocked for ${now - nextELPing}ms`)
  }
  nextELPing = new Date().getTime() + pingInterval
  setTimeout(pingEL, pingInterval)
}
pingEL()
// ------- End of our Event Loop lock detector code -------

// Let's have a server listening on these routes
app.listen(8080, () => {
  console.log('Node server listening on port 8080')
})
