import type { Segment } from '../../api/types';

interface SegmentsProps {
  segments?: Segment[];
  className?: string;
  strongClassName?: string;
}

export function Segments({
  segments,
  className = '',
  strongClassName = 'text-tertiary font-semibold',
}: SegmentsProps) {
  if (!segments || segments.length === 0) return null;

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.b ? (
          <strong key={i} className={strongClassName}>
            {seg.t}
          </strong>
        ) : (
          <span key={i}>{seg.t}</span>
        )
      )}
    </span>
  );
}
