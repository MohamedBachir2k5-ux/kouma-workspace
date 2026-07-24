// In-memory session for E2E crypto state.
// Lives for the duration of the browser session — cleared on sign-out.
// Never persisted to disk or localStorage.

class CryptoSession {
  private _userPriv: CryptoKey | null = null
  private _userPub: CryptoKey | null = null
  private _orgId: string | null = null
  private _convKeys = new Map<string, CryptoKey>()

  load(priv: CryptoKey, pub: CryptoKey, orgId: string) {
    this._userPriv = priv
    this._userPub = pub
    this._orgId = orgId
    this._convKeys.clear()
  }

  clear() {
    this._userPriv = null
    this._userPub = null
    this._orgId = null
    this._convKeys.clear()
  }

  get isLoaded(): boolean { return this._userPriv !== null }
  get userPriv(): CryptoKey | null { return this._userPriv }
  get userPub(): CryptoKey | null { return this._userPub }
  get orgId(): string | null { return this._orgId }

  setConvKey(convId: string, key: CryptoKey) { this._convKeys.set(convId, key) }
  getConvKey(convId: string): CryptoKey | undefined { return this._convKeys.get(convId) }
  deleteConvKey(convId: string) { this._convKeys.delete(convId) }
}

export const cryptoSession = new CryptoSession()
