"use client";

import { Filter, X } from "lucide-react";
import {
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelLabel,
  PixelSelect,
} from "@/components/pixel/pixel-ui";
import {
  useAdminLocationFilter,
  useLocationOptions,
} from "@/hooks/use-admin-location-filter";
import type { HallDTO, StudentGroupDTO } from "@/lib/types/client";

type Props = {
  halls: HallDTO[] | null | undefined;
  groups: StudentGroupDTO[] | null | undefined;
  /** Optional compact layout (no card chrome) */
  compact?: boolean;
  className?: string;
};

/**
 * Hostel → Floor → Block → Group filter shared across admin pages.
 * Selection is persisted under `admin/locationFilter`.
 */
export function LocationFilterBar({
  halls,
  groups,
  compact = false,
  className = "",
}: Props) {
  const {
    filter,
    setHallId,
    setFloor,
    setBlock,
    setGroupId,
    clear,
    active,
  } = useAdminLocationFilter();
  const opts = useLocationOptions(halls, groups, filter);

  const body = (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-teal-900/45 dark:text-teal-100/45">
          <Filter className="h-3.5 w-3.5" />
          Filter by location
          {active && <PixelBadge tone="teal">Active</PixelBadge>}
        </p>
        {active && (
          <PixelButton size="sm" variant="ghost" type="button" onClick={clear}>
            <X className="h-3 w-3" /> Clear
          </PixelButton>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <PixelLabel htmlFor="loc-hall">Hostel</PixelLabel>
          <PixelSelect
            id="loc-hall"
            value={filter.hallId}
            onChange={(e) => setHallId(e.target.value)}
          >
            <option value="">All hostels</option>
            {opts.halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.code} — {h.name}
              </option>
            ))}
          </PixelSelect>
        </div>
        <div className="space-y-1.5">
          <PixelLabel htmlFor="loc-floor">Floor</PixelLabel>
          <PixelSelect
            id="loc-floor"
            value={filter.floor}
            onChange={(e) => setFloor(e.target.value)}
            disabled={opts.floors.length === 0}
          >
            <option value="">All floors</option>
            {opts.floors.map((fl) => (
              <option key={fl} value={fl}>
                Floor {fl}
              </option>
            ))}
          </PixelSelect>
        </div>
        <div className="space-y-1.5">
          <PixelLabel htmlFor="loc-block">Block</PixelLabel>
          <PixelSelect
            id="loc-block"
            value={filter.block}
            onChange={(e) => setBlock(e.target.value)}
            disabled={opts.blocks.length === 0}
          >
            <option value="">All blocks</option>
            {opts.blocks.map((bl) => (
              <option key={bl} value={bl}>
                Block {bl}
              </option>
            ))}
          </PixelSelect>
        </div>
        <div className="space-y-1.5">
          <PixelLabel htmlFor="loc-group">Group</PixelLabel>
          <PixelSelect
            id="loc-group"
            value={filter.groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={opts.groups.length === 0}
          >
            <option value="">All groups</option>
            {opts.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g._count?.students != null
                  ? ` (${g._count.students})`
                  : ""}
              </option>
            ))}
          </PixelSelect>
        </div>
      </div>
    </div>
  );

  if (compact) return body;
  return <PixelCard className="p-4">{body}</PixelCard>;
}
