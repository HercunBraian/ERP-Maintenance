import type { StockRepository } from './stock.repository.js';
import type { StockListQuery, AdjustStock, SetThresholds } from './stock.schemas.js';

export class StockService {
  constructor(private readonly repo: StockRepository) {}
  list(opts: StockListQuery)              { return this.repo.list(opts); }
  adjust(input: AdjustStock)              { return this.repo.adjust(input); }
  setThresholds(input: SetThresholds)     { return this.repo.setThresholds(input); }
  movements(repuestoId: string, limit?: number) { return this.repo.movements(repuestoId, limit); }
}
