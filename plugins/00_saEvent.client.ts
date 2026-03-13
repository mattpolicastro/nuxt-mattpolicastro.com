// Initialize SA's official placeholder queue if the SA script hasn't loaded yet.
// Calls are queued in window.sa_event.q and flushed automatically by SA on load.
// See: https://docs.simpleanalytics.com/events
export default defineNuxtPlugin(() => {
  type SaFn = typeof window.sa_event & { q?: unknown[][] }

  if (!window.sa_event) {
    const stub: SaFn = (...args) => {
      stub.q ? stub.q.push([...args]) : (stub.q = [[...args]])
    }
    window.sa_event = stub
  }
})
