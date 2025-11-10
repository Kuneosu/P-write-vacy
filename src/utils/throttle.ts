/**
 * Throttle function to limit execution frequency
 * @param func - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;

        // Execute with last arguments if there were calls during throttle period
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
          inThrottle = true;

          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      }, limit);
    } else {
      // Store last arguments to execute after throttle period
      lastArgs = args;
    }
  };
}
