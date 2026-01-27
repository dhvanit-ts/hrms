import { limiters } from "@/infra/services/rate-limiter/rl.module";
import { createRateLimiterMiddleware as create } from "@/infra/services/rate-limiter/rl.create-middleware";

const authRateLimiterMiddleware = create(limiters.auth);
const apiRateLimiterMiddleware = create(limiters.api);

export default { apiRateLimiterMiddleware, authRateLimiterMiddleware };
