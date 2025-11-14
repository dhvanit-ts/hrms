import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { updateOwnProfile, assignRoles } from '../services/userService.js';
import { z } from 'zod';
import type { AppRole } from '../config/constants.js';

export async function me(req: AuthenticatedRequest, res: Response) {
  res.json({ user: req.user });
}

export const updateMeSchema = z.object({
  body: z.object({
    email: z.string().email().optional()
  })
});

export async function updateMe(req: AuthenticatedRequest, res: Response) {
  const updated = await updateOwnProfile(req.user!.id, req.body);
  res.json({ user: updated });
}

export const assignRolesSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    roles: z.array(z.enum(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const))
  })
});

export async function assignUserRoles(req: AuthenticatedRequest, res: Response) {
  const targetId = req.params.id;
  const roles = req.body.roles as AppRole[];
  const updated = await assignRoles(req.user!.id, targetId, roles);
  res.json({ user: updated });
}


