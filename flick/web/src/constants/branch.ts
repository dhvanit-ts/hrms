import { z } from "zod";

export const branch = z.enum(["CSE", "BCA", "ECE", "IT", "ME"]);