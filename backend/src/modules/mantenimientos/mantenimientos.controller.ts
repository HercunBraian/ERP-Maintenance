import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { MantenimientosRepository } from './mantenimientos.repository.js';
import { MantenimientosService } from './mantenimientos.service.js';
import type { MantCreate, MantUpdate, MantListQuery, AddPart } from './mantenimientos.schemas.js';

const service = (req: Request) =>
  new MantenimientosService(new MantenimientosRepository(supabaseAsUser(req.accessToken!)));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as MantListQuery));

export const get = async (req: Request, res: Response) =>
  res.json(await service(req).get(req.params.id!));

export const create = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).create(req.body as MantCreate));

export const update = async (req: Request, res: Response) =>
  res.json(await service(req).update(req.params.id!, req.body as MantUpdate));

export const remove = async (req: Request, res: Response) => {
  await service(req).remove(req.params.id!);
  res.status(204).end();
};

export const start = async (req: Request, res: Response) =>
  res.json(await service(req).start(req.params.id!));

export const complete = async (req: Request, res: Response) =>
  res.json(await service(req).complete(req.params.id!));

export const cancel = async (req: Request, res: Response) =>
  res.json(await service(req).cancel(req.params.id!));

export const addPart = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).addPart(req.params.id!, req.body as AddPart));

export const removePart = async (req: Request, res: Response) => {
  await service(req).removePart(req.params.id!, req.params.partId!);
  res.status(204).end();
};
