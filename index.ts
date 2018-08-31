// 3p
import * as express from 'express'

import * as f from './functions'

const app = express()
app.get('/sleep/:duration', async (req, res) => {
  await f.sleep(req.params.duration)

  res.json({ 'duration slept in background': `${req.params.duration}ms` })
})

app.get('/find-n-primes/:primecount', (req, res) => {
  res.json({ message: `found ${f.findNPrimes(req.params.primecount).length} prime numbers` })
})

app.get('/healthz', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' })
})

app.listen(8080, () => {
  console.log('Node server listening on port 8080')
})

