import z from "zod";
import { roles } from "@/config/roles";

export const jwtPayloadSchema = z.object({
  id: z.string(),
  email: z.string(),
  roles: z.array(z.enum(Object.keys(roles) as [keyof typeof roles])),
});
