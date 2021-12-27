export namespace UtilsDataStructures {
  export class THUMDER_Map<K, V> {

    private _defaultValue: V;
    private readonly _map: Map<string, V>;

    constructor() {
      this._map = new Map();
    }

    set(key: K, data: V) {
      const k = JSON.stringify(key);
      this._map.set(k, data);
    }

    setDefaultValue(defaultValue: V): void {
      this._defaultValue = defaultValue;
    }

    get(key: K) {
      const k = JSON.stringify(key);
      return this._map.get(k);
    }

    getOrDefaultValue(key: K) {
      const k = JSON.stringify(key);
      if (this._map.has(k)) {
        return this._map.get(k);
      } else {
        return this._defaultValue;
      }
    }

    has(key: K): boolean {
      const k = JSON.stringify(key);
      return this._map.has(k);
    }

    delete(key: K): boolean {
      const k = JSON.stringify(key);
      return this._map.delete(k);
    }

    clear(): void {
      this._map.clear();
    }

    getMap(): Map<string, V> {
      return this._map;
    }
  }
}
