import '@testing-library/jest-dom'

// pointer capture is a no-op in happy-dom; stub it so drag handlers don't throw
Element.prototype.setPointerCapture = function() {}
Element.prototype.releasePointerCapture = function() {}

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
