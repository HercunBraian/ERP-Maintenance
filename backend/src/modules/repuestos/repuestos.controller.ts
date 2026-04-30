import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { RepuestosRepository } from './repuestos.repository.js';
import { RepuestosService } from './repuestos.service.js';
import type { RepuestoCreate, RepuestoUpdate, RepuestoListQuery } from './repuestos.schemas.js';

const service = (req: Request) =>
  new RepuestosService(new RepuestosRepository(supabaseAsUser(req.accessToken!)));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as RepuestoListQuery));
export const get = async (req: Request, res: Response) =>
  res.json(await service(req).get(req.params.id!));
export const create = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).create(req.body as RepuestoCreate));
export const update = async (req: Request, res: Response) =>
  res.json(await service(req).update(req.params.id!, req.body as RepuestoUpdate));
export const remove = async (req: Request, res: Response) => {
  await service(req).remove(req.params.id!);
  res.status(204).end();
};
