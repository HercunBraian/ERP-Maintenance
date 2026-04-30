import type { StockRepository } from './stock.repository.js';
import type { StockListQuery, AdjustStock } from './stock.schemas.js';

export class StockService {
  constructor(private readonly repo: StockRepository) {}
  list(opts: StockListQuery) { return this.repo.list(opts); }
  adjust(input: AdjustStock) { return this.repo.adjust(input); }
  movements(repuestoId: string, limit?: number) { return this.repo.movements(repuestoId, limit); }
}
