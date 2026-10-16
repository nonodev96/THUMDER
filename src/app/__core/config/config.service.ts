import { Injectable, signal } from "@angular/core";
import { loadConfig, saveConfig, type ThumderConfig, validateConfig } from "./config";

/**
 * The configuration of THUMDER (config.ts): a signal with the saved one, valid. MachineService reads it when it loads a
 * program; the view of the configuration and the multiview change it with `save`
 */
@Injectable({ providedIn: "root" })
export class ConfigService {
  private readonly current = signal<ThumderConfig>(loadConfig(localStorage));
  public readonly value = this.current.asReadonly();

  /** Saves a configuration (validated: the values out of range are adjusted) and returns what was saved */
  public save(config: ThumderConfig): ThumderConfig {
    const valid = validateConfig(config);
    saveConfig(localStorage, valid);
    this.current.set(valid);
    return valid;
  }

  public update(change: Partial<Omit<ThumderConfig, "version">>): ThumderConfig {
    return this.save({ ...this.current(), ...change });
  }
}
