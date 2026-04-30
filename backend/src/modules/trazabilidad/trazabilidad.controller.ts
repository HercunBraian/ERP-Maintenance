import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { TrazabilidadRepository } from './trazabilidad.repository.js';
import { TrazabilidadService } from './trazabilidad.service.js';

const service = (req: Request) =>
  new TrazabilidadService(new TrazabilidadRepository(supabaseAsUser(req.accessToken!)));

export const byEquipo = async (req: Request, res: Response) =>
  res.json(await service(req).byEquipo(req.params.id!));

export const byCliente = async (req: Request, res: Response) =>
  res.json(await service(req).byCliente(req.params.id!));
