import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { KitsRepository } from './kits.repository.js';
import { KitsService } from './kits.service.js';
import type { KitCreate, KitUpdate, KitListQuery, AddKitPart } from './kits.schemas.js';

const service = (req: Request) =>
  new KitsService(new KitsRepository(supabaseAsUser(req.accessToken!)));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as KitListQuery));
export const get = async (req: Request, res: Response) =>
  res.json(await service(req).get(req.params.id!));
export const create = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).create(req.body as KitCreate));
export const update = async (req: Request, res: Response) =>
  res.json(await service(req).update(req.params.id!, req.body as KitUpdate));
export const remove = async (req: Request, res: Response) => {
  await service(req).remove(req.params.id!);
  res.status(204).end();
};

export const addPart = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).addPart(req.params.id!, req.body as AddKitPart));

export const removePart = async (req: Request, res: Response) => {
  await service(req).removePart(req.params.id!, req.params.repuestoId!);
  res.status(204).end();
};
