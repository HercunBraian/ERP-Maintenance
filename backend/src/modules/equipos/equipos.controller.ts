import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { env } from '../../env.js';
import { EquiposRepository } from './equipos.repository.js';
import { EquiposService } from './equipos.service.js';
import { generateQRPng, generateQRSvg, buildScanUrl } from '../qr/qr.service.js';
import type { EquipoCreate, EquipoUpdate, EquipoListQuery, QRQuery } from './equipos.schemas.js';

const service = (req: Request) =>
  new EquiposService(new EquiposRepository(supabaseAsUser(req.accessToken!)));

export const list = async (req: Request, res: Response) =>
  res.json(await service(req).list(req.query as unknown as EquipoListQuery));

export const get = async (req: Request, res: Response) =>
  res.json(await service(req).get(req.params.id!));

export const create = async (req: Request, res: Response) =>
  res.status(201).json(await service(req).create(req.body as EquipoCreate));

export const update = async (req: Request, res: Response) =>
  res.json(await service(req).update(req.params.id!, req.body as EquipoUpdate));

export const remove = async (req: Request, res: Response) => {
  await service(req).remove(req.params.id!);
  res.status(204).end();
};

export const getFull = async (req: Request, res: Response) =>
  res.json(await service(req).getFull(req.params.id!));

export const qr = async (req: Request, res: Response) => {
  const opts = req.query as unknown as QRQuery;
  const token = await service(req).getQRToken(req.params.id!);
  const url = buildScanUrl(env.PUBLIC_APP_URL, token);

  if (opts.format === 'svg') {
    const svg = await generateQRSvg(url, { size: opts.size, margin: opts.margin });
    res.type('image/svg+xml').send(svg);
  } else {
    const png = await generateQRPng(url, { size: opts.size, margin: opts.margin });
    res.type('image/png').send(png);
  }
};
