import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { ClientesRepository } from './clientes.repository.js';
import { ClientesService } from './clientes.service.js';
import type {
  ClienteCreate,
  ClienteUpdate,
  ClienteListQuery,
} from './clientes.schemas.js';

function service(req: Request) {
  // accessToken is set by requireAuth middleware. Per-request client lets RLS
  // policies apply naturally — defense in depth.
  return new ClientesService(new ClientesRepository(supabaseAsUser(req.accessToken!)));
}

export async function list(req: Request, res: Response) {
  const result = await service(req).list(req.query as unknown as ClienteListQuery);
  res.json(result);
}

export async function get(req: Request, res: Response) {
  const cliente = await service(req).get(req.params.id!);
  res.json(cliente);
}

export async function create(req: Request, res: Response) {
  const cliente = await service(req).create(req.body as ClienteCreate);
  res.status(201).json(cliente);
}

export async function update(req: Request, res: Response) {
  const cliente = await service(req).update(req.params.id!, req.body as ClienteUpdate);
  res.json(cliente);
}

export async function remove(req: Request, res: Response) {
  await service(req).remove(req.params.id!);
  res.status(204).end();
}
