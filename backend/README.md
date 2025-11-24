┌─────────────────────────┐
│ 1. User clicks "Login"   │
└─────────────┬───────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│ Frontend sends user to Google OAuth page         │
│ https://accounts.google.com/o/oauth2/v2/auth     │
└─────────────────────────┬────────────────────────┘
                          │
                          ▼
┌─────────────────────────┐
│ 2. User authenticates   │
│    with Google          │
└─────────────┬───────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ Google redirects BACK to your backend        │
│ /api/v1/users/google/callback?code=XXX       │
└─────────────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────┐
         │ 3. Backend exchanges code   │
         │    for Google access token  │
         └─────────────┬──────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │ 4. Backend fetches          │
         │    Google user info         │
         └─────────────┬──────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 5. Check if user exists      │
        └───────┬──────────────────────┘
                │
       ┌────────┴─────────┐
       │                  │
       ▼                  ▼
┌───────────────┐   ┌───────────────────────────┐
│ Existing user  │   │  New user (first time)   │
└──────┬─────────┘   └───────────┬──────────────┘
       │                         │
       ▼                         ▼
┌───────────────────────┐   ┌───────────────────────────────────────────┐
│ 6a. Generate JWTs     │   │ 6b. Redirect to frontend with email only  │
│     (access+refresh)  │   │     /auth/oauth/callback?email=...        │
└───────────┬───────────┘   └───────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│ 7. Store tokens in Redis under tempToken    │
│    tempToken → { accessToken, refreshToken }│
└───────────────┬─────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────┐
│ 8. Redirect user to frontend:                              │
│    /auth/oauth/signin?tempToken=XXXX                       │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────┐
│ 9. Frontend reads ?tempToken=XXXX             │
│    and sends it to your backend:              │
│ POST /auth/temp-token { tempToken }           │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│ 10. Backend calls handleTempToken():          │
│     - retrieve tokens from Redis              │
│     - delete the tempToken (one-time use)     │
│     - set HttpOnly cookies (access, refresh)  │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌────────────────────────────┐
│ 11. User is now logged in │
│     with proper cookies   │
└────────────────────────────┘

---
Alright Dhvanit — here’s the **real**, no-BS list of decorator use cases that actually make sense in a Node + Express app.
Not the theoretical academic junk — the stuff that **actually saves time** and doesn’t turn your codebase into NestJS’s abandoned cousin.

Let’s go.

---

# 🔥 1. **Async Error Wrapping (your current one)**

Why?
Your brain should write business logic, not `.catch(next)` boilerplate.

```ts
@AsyncHandler()
async getUser(req, res) { … }
```

Saves hundreds of repeated wrappers.

---

# 🔥 2. **Input Validation (Zod / Yup / custom)**

Instead of manually validating inside routes, you slap a decorator:

```ts
@ValidateBody(UserSchema)
async createUser(req, res) {}
```

This automatically:

* parses body
* validates
* throws clean errors
* aborts if invalid

Your controller stays clean.

---

# 🔥 3. **Authentication / Authorization**

Stop copy-pasting JWT checks everywhere like a rookie.

```ts
@RequireAuth()
async updateProfile(req, res) {}

@AllowRoles("admin")
async deleteUser(req, res) {}
```

This centralizes your auth logic and removes duplicated garbage.

---

# 🔥 4. **Rate limiting per route**

Want different rate limits for different endpoints? Decorator. Done.

```ts
@RateLimit({ windowMs: 60000, max: 10 })
async sensitiveAction(req, res) {}
```

Way cleaner than scattering middleware config across your routes.

---

# 🔥 5. **Caching decorators (Redis / Memory)**

Useful for "list" endpoints.

```ts
@Cache(30) // seconds
async listProducts(req, res) {}
```

Decorator handles:

* check cache
* return cached
* set cache

You write zero repeated Redis code.

---

# 🔥 6. **Auto-binding methods**

Express loses `this` all the time. Decorator fixes that:

```ts
@Autobind()
async sendEmail() {}
```

Never again do you need:
`this.sendEmail = this.sendEmail.bind(this);`

---

# 🔥 7. **Logging / Debugging**

If you’re sick of console.logs everywhere:

```ts
@LogRequest()
async getOrder(req, res) {}
```

Decorator logs:

* route
* params
* duration
* response status

Zero duplication.

---

# 🔥 8. **Throttling expensive calls (debounce/queue)**

Useful for:

* PDF generators
* background triggers
* payment processes

```ts
@Throttle(2000)
async generateInvoice() {}
```

---

# 🔥 9. **Metadata for Auto-Generating Routes**

If you're going full nerd, you can let decorators auto-generate Express routes.

```ts
@Controller("/users")
class UserController {
  @Get("/")
  getUsers() {}

  @Post("/")
  createUser() {}
}
```

Then auto-mount everything with reflection.
Congrats, you built half of NestJS.

---

# 🔥 10. **Response Normalization**

Wrap methods so all responses follow a unified structure.

```ts
@JsonResponse()
async getProfile(req, res) {
  return { id: 1, name: "Dhvanit" };
}
```

Outputs:

```json
{ "success": true, "data": { ... }, "timestamp": ... }
```

No more manual response formatting.

---

# 🔥 11. **Permission checks (fine-grained ACL)**

Perfect for SaaS apps.

```ts
@Permission("users:view")
async getUser() {}
```

Centralized permission logic → zero repeated checks.

---

# 🔥 BONUS: **Method-level Feature Flags**

Roll out features safely per endpoint.

```ts
@FeatureFlag("new-dashboard")
async getDashboard() {}
```

You decouple feature rollout from code complexity.

---

# 🧨 Brutal Truth

Decorators are AMAZING **only** if:

* your controllers are class-based
* your team actually respects conventions
* you don’t go full NestJS without the infrastructure to support it

Use decorators for **cross-cutting concerns**, not business logic.

---

If you want, I can give you **ready-to-use decorators** for any of the above (RateLimit, Auth, Validate, Cache, etc.).
Just tell me which ones you want and I’ll drop production-grade versions.
