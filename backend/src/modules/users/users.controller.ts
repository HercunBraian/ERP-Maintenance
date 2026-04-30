import type { Request, Response } from 'express';
import { supabaseAdmin, supabaseAsUser } from '../../lib/supabase.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import type {
  UserCreate, UserUpdate, ResetPassword, UserListQuery,
} from './users.schemas.js';

const service = (req: Request) =>
  new UsersService(new UsersRepository(supabaseAsUser(req.accessToken!), supabaseAdmin));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as UserListQuery));

export const get = async (req: Request, res: Response) =>
  res.json(await service(req).get(req.params.id!));

export const create = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).create(req.body as UserCreate));

export const update = async (req: Request, res: Response) =>
  res.json(await service(req).update(req.params.id!, req.body as UserUpdate));

export const resetPassword = async (req: Request, res: Response) => {
  const { password } = req.body as ResetPassword;
  await service(req).resetPassword(req.params.id!, password);
  res.status(204).end();
};

export const remove = async (req: Request, res: Response) => {
  await service(req).safeRemove(req.params.id!, req.user!.id);
  res.status(204).end();
};
