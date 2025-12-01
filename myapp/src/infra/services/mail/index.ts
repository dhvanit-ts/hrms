import { MailService } from "./mail.service";
import { createEmailProvider } from "./provider.config";

export const mailService = new MailService(createEmailProvider());
export default mailService;
