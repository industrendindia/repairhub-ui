export const storage = {
  get<T>(key: string): T | null {
    const value = window.localStorage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    window.localStorage.removeItem(key);
  },
  removeByPrefix(prefix: string) {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => window.localStorage.removeItem(key));
  },
};
