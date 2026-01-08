import { pgEnum } from "drizzle-orm/pg-core";

export const AuthTypeEnum = pgEnum("authType", ["manual", "oauth"]);
