import { env } from "./env"

const isDebug = env.NODE_ENV === "debug"
const debug = {
  log: (...msg: string[]) => isDebug ? console.log(...msg) : null,
  warn: (...msg: string[]) => isDebug ? console.warn(...msg) : null
}

export { debug }