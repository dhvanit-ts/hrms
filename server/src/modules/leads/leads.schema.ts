import z from "zod";

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Valid email is required"),
    phone: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    source: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    notes: z.string().optional(),
    value: z.number().positive().optional(),
    followUpDate: z.string().optional(),
  })
});

export const updateLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    source: z.string().optional(),
    status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignedTo: z.number().int().positive().optional(),
    notes: z.string().optional(),
    value: z.number().positive().optional(),
    followUpDate: z.string().optional(),
  })
});

export const addActivitySchema = z.object({
  body: z.object({
    type: z.enum(["call", "email", "meeting", "note", "task"]),
    description: z.string().min(1, "Description is required"),
  })
});
