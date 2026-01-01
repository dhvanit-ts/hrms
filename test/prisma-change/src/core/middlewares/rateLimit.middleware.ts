import { limiters } from "@/infra/services/rate-limiter/rl.module";
import { createRateLimiterMiddleware as create } from "@/infra/services/rate-limiter/rl.create-middleware";

const auth = create(limiters.auth);
const api = create(limiters.api);

export default { api, auth };
