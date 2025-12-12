import { env } from "./env.js";

const allowedOrigins = [env.accessControlOrigin, env.adminAccessControlOrigin];

export default allowedOrigins;