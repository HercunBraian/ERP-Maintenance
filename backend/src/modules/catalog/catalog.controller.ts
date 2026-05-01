import type { Request, Response } from 'express';
import { supabaseAsUser } from '../../lib/supabase.js';
import { mapPgError } from '../../lib/errors.js';

const db = (req: Request) => supabaseAsUser(req.accessToken!);

// ─── Equipment Types ──────────────────────────────────────────────────────────

export const listEquipmentTypes = async (req: Request, res: Response) => {
  const { data, error } = await db(req).from('equipment_types').select('*').order('name');
  if (error) throw mapPgError(error);
  res.json(data ?? []);
};

export const createEquipmentType = async (req: Request, res: Response) => {
  const { data, error } = await db(req)
    .from('equipment_types').insert({ name: req.body.name }).select().single();
  if (error) throw mapPgError(error);
  res.status(201).json(data);
};

export const deleteEquipmentType = async (req: Request, res: Response) => {
  const { error } = await db(req).from('equipment_types').delete().eq('id', req.params.id!);
  if (error) throw mapPgError(error);
  res.status(204).end();
};

// ─── Equipment Categories ─────────────────────────────────────────────────────

export const listEquipmentCategories = async (req: Request, res: Response) => {
  const { data, error } = await db(req).from('equipment_categories').select('*').order('name');
  if (error) throw mapPgError(error);
  res.json(data ?? []);
};

export const createEquipmentCategory = async (req: Request, res: Response) => {
  const { data, error } = await db(req)
    .from('equipment_categories').insert({ name: req.body.name }).select().single();
  if (error) throw mapPgError(error);
  res.status(201).json(data);
};

export const deleteEquipmentCategory = async (req: Request, res: Response) => {
  const { error } = await db(req).from('equipment_categories').delete().eq('id', req.params.id!);
  if (error) throw mapPgError(error);
  res.status(204).end();
};

// ─── Depositos ────────────────────────────────────────────────────────────────

export const listDepositos = async (req: Request, res: Response) => {
  const { data, error } = await db(req).from('depositos').select('*').order('name');
  if (error) throw mapPgError(error);
  res.json(data ?? []);
};

export const createDeposito = async (req: Request, res: Response) => {
  const { data, error } = await db(req).from('depositos').insert(req.body).select().single();
  if (error) throw mapPgError(error);
  res.status(201).json(data);
};

export const updateDeposito = async (req: Request, res: Response) => {
  const { data, error } = await db(req)
    .from('depositos').update(req.body).eq('id', req.params.id!).select().maybeSingle();
  if (error) throw mapPgError(error);
  res.json(data);
};

export const deleteDeposito = async (req: Request, res: Response) => {
  const { error } = await db(req).from('depositos').delete().eq('id', req.params.id!);
  if (error) throw mapPgError(error);
  res.status(204).end();
};
