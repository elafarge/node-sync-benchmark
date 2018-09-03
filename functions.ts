import * as _ from 'lodash'
import * as _fp from 'lodash/fp'
import * as Bluebird from 'bluebird'

Promise = Promise || (Bluebird as any)

// Asynchronous (non blocking) sleep
export function sleep(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), duration)
  })
}

// Synchronous (blocking) prime number lookup using a for loop
export function findPrimes(iterations: number): number[] {
  let primes = []
  for (let i = 0; i < iterations; i++) {
    let candidate = i * (4000000000 * Math.random())
    let isPrime = true
    for (let c = 2; c <= Math.sqrt(candidate); ++c) {
      if (candidate % c === 0) {
        // not prime
        isPrime = false
        break
      }
    }
    if (isPrime) {
      primes.push(candidate)
    }
  }
  return primes
}

// Variant using Array.forEach
export function findPrimesForEach(iterations: number): number[] {
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  let primes = []
  fakeArray.forEach(i => {
    let candidate = i * (4000000000 * Math.random())
    let isPrime = true
    for (let c = 2; c <= Math.sqrt(candidate); ++c) {
      if (candidate % c === 0) {
        // not prime
        isPrime = false
        break
      }
    }
    if (isPrime) {
      primes.push(candidate)
    }
  })
  return primes
}

// Variant using Node's native reduce() function
export function findPrimesReduce(iterations: number): number[] {
  // Let's time that to make sure it's not the cause of the blocking
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  return fakeArray.reduce((primes, _, i) => {
    let candidate = i * (4000000000 * Math.random())
    let isPrime = true
    for (let c = 2; c <= Math.sqrt(candidate); ++c) {
      if (candidate % c === 0) {
        // not prime
        isPrime = false
        break
      }
    }
    if (isPrime) {
      primes.push(candidate)
    }
    return primes
  }, [])
}

// Variant using lodash's each() method
export function findPrimesLodashForEach(iterations: number): number[] {
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  let primes = []
  _.forEach(fakeArray, i => {
    let candidate = i * (4000000000 * Math.random())
    let isPrime = true
    for (let c = 2; c <= Math.sqrt(candidate); ++c) {
      if (candidate % c === 0) {
        // not prime
        isPrime = false
        break
      }
    }
    if (isPrime) {
      primes.push(candidate)
    }
  })
  return primes
}

// Same implementation aiming at testing the (non-?)blocking behaviour of
// lodash's reduce
export function findPrimesLodashReduce(iterations: number): number[] {
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  return _.reduce(
    fakeArray,
    (primes: any, value: number, key: number) => {
      let candidate = key * (4000000000 * Math.random())
      let isPrime = true
      for (let c = 2; c <= Math.sqrt(candidate); ++c) {
        if (candidate % c === 0) {
          // not prime
          isPrime = false
          break
        }
      }
      if (isPrime) {
        primes.push(candidate)
      }
      return primes
    },
    []
  )
}

// Same implementation aiming at testing the (non-?)blocking behaviour of
// lodash's reduce, version FP
export function findPrimesLodashFPReduce(iterations: number): number[] {
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  return _fp.reduce(
    (primes: any, value: number) => {
      let candidate = value * (4000000000 * Math.random())
      let isPrime = true
      for (let c = 2; c <= Math.sqrt(candidate); ++c) {
        if (candidate % c === 0) {
          // not prime
          isPrime = false
          break
        }
      }
      if (isPrime) {
        primes.push(candidate)
      }
      return primes
    },
    [],
    fakeArray
  )
}

// A hack to make our synchronous prime number lookup release the event loop at
// every iteration... definitely not what one would call an elegant piece of
// code.
//
// It is heavily inspired by the NodeJS docs:
// https://nodejs.org/en/docs/guides/dont-block-the-event-loop/#complex-calculations-without-blocking-the-event-loop
//
// Also, it assumes that you have some kind of control over the code running the
// computation and have the ability to split it into chunks between which you'll
// be able to release the event loop.
// The bottom line is: if the computation happens in a lib you don't control...
// you'll have to rewrite it in an asynchronous way. As seen above, that's the
// case of reduce()'s implementation (in both the standard lib and lodash).
//
export async function findPrimesAsyncHack(
  iterations: number
): Promise<number[]> {
  // Let's wrap our function into a promise that will be resolved once all
  // iterations are completed
  return new Promise<number[]>(resolve => {
    let primes = []

    // Let's use a recursive closure to fill in the primes array
    function findNextPrime(i: number) {
      // If we've iterated enough, let's resolve
      if (i >= iterations) {
        resolve(primes)
        return
      }

      // Otherwise, let's find our next prime number
      let candidate = i * (4000000000 * Math.random())
      let isPrime = true
      for (let c = 2; c <= Math.sqrt(candidate); ++c) {
        if (candidate % c === 0) {
          // not prime
          isPrime = false
          break
        }
      }
      if (isPrime) {
        primes.push(candidate)
      }

      // HERE'S THE HACK, let's find our next prime number ON THE NEXT EVENT
      // LOOP TICK. This operation yields (=releases) the event loop for one run
      setTimeout(findNextPrime.bind(null, i + 1), 0)
    }

    // Let's start our recursive function
    findNextPrime(0)
  })
}

// Making that a bit more readable using Bluebird's Promise.each(). Note that it
// works with Promise.each as well but not with promise.All
// IMPORTANT NOTE: using the Bluebird type instead of the native Promise type,
// it doesn't work at all. Still couldn't figure out why but that very
// interesting :)
export async function findPrimesBluebirdEach(
  iterations: number
): Promise<number[]> {
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  return Bluebird.each(fakeArray, i => {
    let candidate = i * (4000000000 * Math.random())
    let isPrime = true
    // Replace that with Bluebird<number>... and you'll get blocking behaviour
    // :o
    return new Promise<number>(resolve => {
      for (let c = 2; c <= Math.sqrt(candidate); ++c) {
        if (candidate % c === 0) {
          // not prime
          isPrime = false
          break
        }
      }
      if (isPrime) {
        resolve(candidate)
      }
    })
  })
}

// What about Bluebird's reduce ?
export async function findPrimesBluebirdReduce(
  iterations: number
): Promise<number[]> {
  const t0 = new Date().getTime()
  let fakeArray = new Array(iterations)
  for (let i = 0; i < iterations; ++i) {
    fakeArray.push(i)
  }
  console.log(
    `Fake array generation took ${new Date().getTime() - t0} milliseconds`
  )

  // Weirdly enough, it doesn't work when using Bluebird's promise type
  return Bluebird.reduce(
    fakeArray,
    (primes, i): Promise<number[]> => {
      // Replace that with Bluebird<number>... and you'll get blocking behaviour
      // :o
      return new Promise<number[]>(resolve => {
        let candidate = i * (4000000000 * Math.random())
        let isPrime = true

        for (let c = 2; c <= Math.sqrt(candidate); ++c) {
          if (candidate % c === 0) {
            // not prime
            isPrime = false
            break
          }
        }
        if (isPrime) {
          primes.push(candidate)
        }
        resolve(primes)
      })
    },
    []
  )
}

// And, to end up with, let's try an approach with the native Promise.all()
// function
export async function findPrimesPromiseAll(
  iterations: number
): Promise<number[]> {
  const t0 = new Date().getTime()
  let promiseArray = new Array()
  for (let i = 0; i < iterations; ++i) {
    promiseArray.push(
      new Promise<number>(async resolve => {
        if (i > 0) {
          await promiseArray[i - 1]
        }
        let candidate = i * (4000000000 * Math.random())
        let isPrime = true

        for (let c = 2; c <= Math.sqrt(candidate); ++c) {
          if (candidate % c === 0) {
            // not prime
            isPrime = false
            break
          }
        }
        // For simplicity's sake, we always resolve here, hence breaking our
        // algorithm. The goal is just to test the (non-?) blocking behaviour of
        // Promise.all(), the correction of our algorithm doesn't matter :)
        resolve(candidate)
      })
    )
  }
  console.log(
    `Promise generation took ${new Date().getTime() - t0} milliseconds`
  )

  // Weirdly enough, it doesn't work when using Bluebird's promise type
  return Promise.all(promiseArray)
}

// Ok, let's try a really last one with async/await and promises
export async function findPrimesAsyncAwait(
  iterations: number
): Promise<number[]> {
  const t0 = new Date().getTime()
  let primes = new Array()
  for (let i = 0; i < iterations; ++i) {
    primes.push(
      await new Promise<number>(resolve => {
        let candidate = i * (4000000000 * Math.random())
        let isPrime = true

        for (let c = 2; c <= Math.sqrt(candidate); ++c) {
          if (candidate % c === 0) {
            // not prime
            isPrime = false
            break
          }
        }
        // For simplicity's sake, we always resolve here, hence breaking our
        // algorithm. The goal is just to test the (non-?) blocking behaviour of
        // Promise.all(), the correction of our algorithm doesn't matter :)
        resolve(candidate)
      })
    )
    // To remove the blocking behaviour, we should yield the event loop here
  }
  console.log(
    `Promise generation took ${new Date().getTime() - t0} milliseconds`
  )

  // Weirdly enough, it doesn't work when using Bluebird's promise type
  return primes
}
