import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { StockRepository } from './stock.repository.js';
import { StockService } from './stock.service.js';
import type { StockListQuery, AdjustStock } from './stock.schemas.js';

const service = (req: Request) =>
  new StockService(new StockRepository(supabaseAsUser(req.accessToken!)));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as StockListQuery));

export const adjust = async (req: Request, res: Response) =>
  res.json(await service(req).adjust(req.body as AdjustStock));

export const movements = async (req: Request, res: Response) =>
  res.json(await service(req).movements(req.params.repuestoId!));
