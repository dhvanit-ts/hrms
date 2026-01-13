import { MailTemplate, MailType, MailDetails } from "../types/mail.types";
import { mailTemplates } from "../templates";

export class TemplateEngine {
  private cache = new Map<string, MailTemplate>();

  async render<T extends MailType>(type: T, details: MailDetails<T>) {
    const key = `${type}:${JSON.stringify(details)}`;

    if (this.cache.has(key)) return this.cache.get(key)!;

    try {
      const tpl = await mailTemplates[type](details);
      this.cache.set(key, tpl);
      return tpl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Template rendering failed: ${msg}`);
    }
  }
}
