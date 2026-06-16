# Express → Hono Migration Plan

## Prerequisites

- Project runs on port **8080** (Docker + local dev)
- `NODE_ENV`, `JWT_SECRET`, `MONGODB_URI` etc. in `.env`
- MongoDB + MinIO via `docker compose up -d` or local equivalents
- TypeScript + `tsx` for dev, `tsc` for build

---

## Phase 1: Update Dependencies

```bash
# Install Hono
npm install hono @hono/node-server

# Remove Express and related packages
npm uninstall \
  express @types/express \
  body-parser @types/body-parser \
  cookie-parser @types/cookie-parser \
  cors @types/cors \
  morgan @types/morgan \
  helmet \
  express-async-handler \
  multer @types/multer
```

### Replacements

| Removed | Replacement |
|---|---|
| `express` | `hono` + `@hono/node-server` |
| `body-parser` | Built into `@hono/node-server` (JSON, urlencoded) |
| `cookie-parser` | `hono/cookie` (`getCookie`, `setCookie`) |
| `cors` | `hono/cors` |
| `morgan` | `hono/logger` (or keep using pino directly) |
| `helmet` | `hono/secure-headers` |
| `express-async-handler` | Not needed — Hono supports async natively |
| `multer` | `c.req.parseBody()` (native Hono multipart) |

---

## Phase 2: Type Declarations

**Delete** `@types/express/index.d.ts`.

**Add** `src/types/context.d.ts` for Hono context variables:

```typescript
import { IUser } from "../../models/User";

declare module "hono" {
  interface ContextVariableMap {
    user: IUser;
    advancedResults: {
      success: boolean;
      count: number;
      pagination: object;
      data: object;
    };
  }
}
```

---

## Phase 3: Rewrite `server.ts` (Entry Point)

| Express | Hono |
|---|---|
| `express()` | `new Hono()` |
| `app.listen(8080, cb)` | `serve({ fetch: app.fetch, port: 8080 }, cb)` |
| `app.use(helmet())` | `app.use('*', secureHeaders())` |
| `app.use(cors())` | `app.use('*', cors())` |
| `app.use(bodyParser.json())` | Not needed |
| `app.use(bodyParser.urlencoded(...))` | Not needed |
| `app.use(cookieParser())` | Not needed — use `hono/cookie` in handlers |
| `app.use(morgan("dev"))` | `app.use('*', logger())` or custom pino |
| `app.use(express.static(...))` | `serveStatic({ root: './public' })` |
| `app.use('/path', router)` | `app.route('/path', router)` |
| `app.use(errorHandler)` | `app.onError(errorHandler)` |
| `multer({...})` upload middleware | Inline `c.req.parseBody()` in bootcamp route |

### File upload changes (bootcamp photo)

Old (multer):
```typescript
const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
app.use("/api/v1/bootcamps", upload.single("file"), bootcampRoutes);
```

New (Hono native):
```typescript
// In the bootcamp controller or a middleware
const { file } = await c.req.parseBody();
// file is a File object — write to disk with fs.writeFile or fs.copyFile
```

**Delete** `config/multer.ts` and `utils/multer.ts`.

---

## Phase 4: Rewrite Middleware Files

### 4a. `middlewares/error.ts`

```typescript
// Express
function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  res.status(statusCode).json({ success: false, error: errorMessage });
}

// Hono
import { Context } from "hono";

function errorHandler(err: Error, c: Context) {
  logger.fatal(JSON.stringify(err.message));
  let statusCode = 500;
  let errorMessage = "Server Error";
  if ((err as any).statusCode && err.message) {
    statusCode = (err as any).statusCode;
    errorMessage = err.message;
  }
  return c.json({ success: false, error: errorMessage }, statusCode);
}
```

### 4b. `middlewares/auth.ts`

```typescript
// Express
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new Error(...));
  next();
};
```

Key changes for Hono:
- `c.req.header("Authorization")` instead of `req.headers.authorization`
- `c.set("user", user)` / `c.get("user")` instead of `req.user`
- Remove `express-async-handler` wrapper — just `async (c, next)`
- Return error with `c.json()` or throw

### 4c. `middlewares/advancedResults.ts`

Express: reads `req.query`, sets `res.advancedResults`, calls `next()`

Hono:
- Read query from `c.req.query()`
- Set result via `c.set("advancedResults", { ... })`
- Apply `await next()` when done
- Signature: `(model, populate?) => (c: Context, next: Next) => Promise<void>`

### 4d. `middlewares/validate.ts`

Express: validates `req.body`, `req.query`, `req.params`, `req.user`, `req.file`

Hono:
- Use `await c.req.json()` for body
- Use `c.req.param()` for params
- Use `c.req.query()` for query
- Use `c.get("user")` for user
- Use `c.req.parseBody()` for file
- Return errors with `c.json()`

---

## Phase 5: Rewrite Controllers (5 files)

Pattern: `(req: Request, res: Response)` → `(c: Context)`

| Express | Hono |
|---|---|
| `req.body` | `await c.req.json()` |
| `req.params.id` | `c.req.param("id")` |
| `req.params.bootcampId` | `c.req.param("bootcampId")` |
| `req.query` | `c.req.query()` |
| `req.user.id` | `c.get("user").id` |
| `req.file` | `await c.req.parseBody()` then access `body["file"]` |
| `req.protocol` + `req.get("host")` | `new URL(c.req.url).origin` or header |
| `res.status(x).json(obj)` | `c.json(obj, x)` |
| `res.cookie("token", val, opts)` | `setCookie(c, "token", val, opts)` |
| `asyncHandler(fn)` wrapper | Just `async (c) => { ... }` — return a Response |
| `res.advancedResults` | `c.get("advancedResults")` |

### Files to convert

- `controllers/auth.ts` (213 lines)
- `controllers/bootcamps.ts` (150 lines)
- `controllers/courses.ts` (114 lines)
- `controllers/reviews.ts` (108 lines)
- `controllers/users.ts` (68 lines)

### sendTokenResponse helper

Old: `res.status(code).cookie("token", token, opts).json({ success: true, token })`

New: uses `setCookie()` from `hono/cookie`, returns `c.json()`:

```typescript
import { setCookie } from "hono/cookie";

const sendTokenResponse = (c: Context, token: string, statusCode: number) => {
  const options = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: NODE_ENV === "production",
  };
  setCookie(c, "token", token, options);
  return c.json({ success: true, token }, statusCode);
};
```

### serverResponse helper

Old: `serverResponse.sendSuccess(res, message, data)` / `serverResponse.sendError(res, error)`

Hono: Either inline the response in each controller, or adapt the helper to accept `c: Context`:
```typescript
const serverResponse = {
  sendSuccess: (c: Context, message: Message, data: object | null) => {
    const responseMessage = {
      code: message.code ?? 500,
      success: message.success,
      message: message.message,
      ...(data ? { data } : {}),
    };
    return c.json(responseMessage, message.code);
  },
  sendError: (c: Context, error: Error) => {
    return c.json(
      { code: error.code ?? 500, success: false, message: error.message },
      error.code ?? 500
    );
  },
};
```

---

## Phase 6: Rewrite Routes (5 files)

| Express | Hono |
|---|---|
| `express.Router()` | `new Hono()` |
| `express.Router({ mergeParams: true })` | `new Hono()` — parent params accessible via route nesting |
| `router.get("/", ...)` | Same syntax |
| `router.post("/", ...)` | Same syntax |
| `router.use(async (req, res, next) => ...)` | `router.use(async (c, next) => { await next(); })` |
| `export default router` | `export default router` |

### mergeParams replacement

Express courses/reviews use `mergeParams: true` to access `:bootcampId` from parent.

In Hono, when a child router is mounted with `route()`, parent path params are accessible:
```typescript
// Express
const router = express.Router({ mergeParams: true });
router.get("/", async (req, res) => {
  req.params.bootcampId; // from parent /:bootcampId/courses
});

// Hono
const router = new Hono();
router.get("/", async (c) => {
  c.req.param("bootcampId"); // accessible naturally
});
```

### Route mounting in bootcamps

```typescript
// Express
router.use("/:bootcampId/courses", coursesRouter);
router.use("/:bootcampId/reviews", reviewsRouter);

// Hono
bootcampRoutes.route("/:bootcampId/courses", coursesRoutes);
bootcampRoutes.route("/:bootcampId/reviews", reviewsRoutes);
```

### Bottleneck rate limiter

```typescript
// Express
router.use(async (req, res, next) => {
  await limiter.schedule(async () => { next(); });
});

// Hono
router.use(async (c, next) => {
  await limiter.schedule(async () => { await next(); });
});
```

### Files to convert

- `routes/bootcamps.ts` (78 lines)
- `routes/auth.ts` (56 lines)
- `routes/courses.ts` (59 lines)
- `routes/reviews.ts` (60 lines)
- `routes/users.ts` (45 lines)

---

## Phase 7: Rewrite Utility Files

| File | Change |
|---|---|
| `utils/helpers/responses.ts` | Accept `Context` instead of `Response` (see Phase 5) |
| `utils/helpers/sendTokenResponse.ts` | Use `setCookie()` from `hono/cookie`, return `c.json()` |
| `utils/helpers/logger.ts` | No change needed (uses `pino`, not Express) |
| `config/multer.ts` | **Delete** — replaced by Hono multipart parsing |
| `utils/multer.ts` | **Delete** — replaced by Hono multipart parsing |

---

## Phase 8: File Upload (Multer Replacement)

Old (multer with diskStorage):
```typescript
// config/multer.ts — saves to public/uploads/ with custom filename
const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
// Applied in server.ts
app.use("/api/v1/bootcamps", upload.single("file"), bootcampRoutes);
// Accessed in controller
req.file.filename
```

New (Hono native):
```typescript
// In middleware or controller for bootcamp photo upload:
import { writeFile } from "fs/promises";
import path from "path";

async function handleUpload(c: Context, next: Next) {
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  if (!file) return next();

  const ext = file.type.split("/")[1]; // "png", "jpg", etc.
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join("public/uploads", filename), buffer);

  c.set("uploadedFilename", filename);
  await next();
}
```

Alternatively, keep things simpler and handle the file write directly in the `bootcampPhotoUpload` controller.

---

## Phase 9: Verify

```bash
npm run build       # TypeScript compilation (tsc)
npm run dev         # Startup — should listen on port 8080
```

### Test endpoints

- `GET /` → redirects to Postman docs
- `POST /api/v1/auth/register` → creates user
- `POST /api/v1/auth/login` → returns JWT token + cookie
- `GET /api/v1/bootcamps` → returns bootcamps with pagination
- `GET /api/v1/bootcamps/:id` → single bootcamp
- `PUT /api/v1/bootcamps/:id/photo` → file upload
- `GET /api/v1/bootcamps/:bootcampId/courses` → nested courses
- All error paths → JSON error responses

---

## Summary

| Layer | Files | Effort |
|---|---|---|
| Dependencies | `package.json` | 1 command |
| Types | Delete `@types/express`, add `src/types/context.d.ts` | Low |
| Entry point | `server.ts` | Medium |
| Routes | 5 files | Low (mostly mechanical) |
| Controllers | 5 files | Medium (property name changes) |
| Middleware | 4 files | Medium (signature changes) |
| Utilities | `responses.ts`, `sendTokenResponse.ts` | Low |
| File upload | Delete 2 files, inline in controller | Medium |
| Verification | Smoke test all endpoints | High |

**Total:** ~15 files rewritten, ~5 files deleted, ~800 lines changed.
