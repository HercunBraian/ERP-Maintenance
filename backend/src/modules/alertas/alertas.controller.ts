import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { AlertasRepository } from './alertas.repository.js';
import { AlertasService } from './alertas.service.js';
import type { AlertaListQuery } from './alertas.schemas.js';

const service = (req: Request) =>
  new AlertasService(new AlertasRepository(supabaseAsUser(req.accessToken!)));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as AlertaListQuery, req.user!.id));

export const resolve = async (req: Request, res: Response) =>
  res.json(await service(req).resolve(req.params.id!, req.user!.id));
