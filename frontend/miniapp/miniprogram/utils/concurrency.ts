
export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let nextIndex = 0;

  const _pump = async () => {
    const i = nextIndex++;
    if (i >= tasks.length) return;
    try {
      results[i] = await tasks[i]();
    } catch (err) {
      // Callers MUST check with instanceof Error; errored entries are stored in-place
      // to preserve index alignment with the input tasks array.
      results[i] = err as T;
    }
    await _pump();
  };

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => _pump());
  await Promise.all(workers);
  return results;
}
