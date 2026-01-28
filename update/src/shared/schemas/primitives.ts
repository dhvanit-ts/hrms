import z from "zod";

export const EmailSchema = z.email("Email is required")
