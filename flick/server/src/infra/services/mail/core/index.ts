import { MailService } from "./mail.service";
import { TemplateEngine } from "./template.engine";
import { ProviderManager } from "./provider.manager";
import { createEmailProvider } from "./provider.factory";

const provider = await createEmailProvider()

const mailService = new MailService(
  new ProviderManager(provider),
  new TemplateEngine(),
  `"flick" <no-reply@flick.com>`
)

export { MailService, TemplateEngine, ProviderManager, createEmailProvider };
export default mailService
