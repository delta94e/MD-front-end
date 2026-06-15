// Web Worker for calculating prime numbers to run CPU-intensive tasks off the main thread.
self.onmessage = (event: MessageEvent) => {
  const { limit = 2000000 } = event.data;
  
  console.log(`[Worker] Starting heavy calculation up to ${limit}...`);
  const startTime = performance.now();
  
  let count = 0;
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      count++;
    }
  }
  
  const duration = performance.now() - startTime;
  console.log(`[Worker] Finished. Found ${count} primes in ${duration.toFixed(2)}ms`);
  
  self.postMessage({ count, duration });
};
