import { env } from "@/config/env";
import { MailService, ProviderManager, TemplateEngine, createEmailProvider } from "./core";

const providers = new ProviderManager(await createEmailProvider());
const templateEngine = new TemplateEngine();
const from = env.MAIL_FROM;

export default new MailService(
  providers,
  templateEngine,
  from
);
