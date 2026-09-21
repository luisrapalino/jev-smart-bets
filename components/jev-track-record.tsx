import { cn } from '@/lib/utils';
import type { JevTrackRecord } from '@/lib/stats/jev-track-record';

export function JevTrackRecordPanel({ record }: { record: JevTrackRecord }) {
  const isProfitable = record.unitsProfit >= 0;

  return (
    <div className="border-rule mx-4 mt-3 flex items-center justify-between rounded-sm border px-3 py-2.5">
      <div>
        <p className="board-condensed text-xs font-semibold">Track record de Jev</p>
        <p className="text-chalk-dim mt-0.5 text-[11px]">
          {record.won}-{record.lost} en apuestas liquidadas hechas solo con sugerencias suyas
        </p>
      </div>
      <div className="text-right">
        <p className="price text-bulb text-base font-bold">
          {record.winRatePct.toFixed(0)}%
        </p>
        <p
          className={cn(
            'price text-[11px] font-semibold',
            isProfitable ? 'text-price-up' : 'text-price-down'
          )}
        >
          {isProfitable ? '+' : ''}
          {record.unitsProfit.toFixed(2)}u
        </p>
      </div>
    </div>
  );
}
