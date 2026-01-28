import z from "zod";
import { roles } from "@/config/roles";
import { defineSchema } from "@/lib/define-zod-schema";

export const JwtPayloadSchema = defineSchema("JwtPayloadSchema",{
  id: z.string(),
  email: z.string(),
  roles: z.array(z.enum(Object.keys(roles) as [keyof typeof roles])),
});
