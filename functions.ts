// Asynchronous (non blocking) sleep
export function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration)
  })
}

// Synchronous (blocking) prime number lookup
export function findNPrimes(iterations: number) {
  let primes = [];
  for (let i = 0; i < iterations; i++) {
    let candidate = i * (4000000000 * Math.random());
    let isPrime = true;
    for (let c = 2; c <= Math.sqrt(candidate); ++c) {
      if (candidate % c === 0) {
          // not prime
          isPrime = false;
          break;
       }
    }
    if (isPrime) {
      primes.push(candidate);
    }
  }
  return primes;
}
