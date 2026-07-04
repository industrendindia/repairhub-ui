import { storage } from "@/lib/storage/storage";
import type { AuthSession } from "@/features/auth/types/auth.types";

const sessionKey = "repairhub.auth.session";

export const authTokenStore = {
  getSession() {
    return storage.get<AuthSession>(sessionKey);
  },
  setSession(session: AuthSession) {
    storage.set(sessionKey, session);
  },
  clearSession() {
    storage.remove(sessionKey);
    storage.removeByPrefix("repairhub.intake.draft.");
    window.sessionStorage.clear();
  },
  getAccessToken() {
    return this.getSession()?.accessToken ?? null;
  },
};
