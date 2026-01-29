import { z } from "zod";

export const CreateCollegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  emailDomain: z.email("Invalid email domain format"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  profile: z.url("Profile must be a valid URL").optional(),
});

export const UpdateCollegeSchema = z.object({
  name: z.string().min(1, "College name is required").optional(),
  emailDomain: z.email("Invalid email domain format").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  profile: z.url("Profile must be a valid URL").optional(),
});

export const CollegeIdSchema = z.object({
  id: z.uuid("Invalid college ID format"),
});

export const CollegeFiltersSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
});