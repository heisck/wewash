"use client";

import { useMemo } from "react";
import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  EMPTY_LOCATION_FILTER,
  type AdminLocationFilter,
  isLocationFilterActive,
} from "@/lib/admin/location-filter";
import type { HallDTO, StudentGroupDTO } from "@/lib/types/client";

/**
 * Shared persisted location filter for admin pages (hostel / floor / block / group).
 * Keyed so all admin pages share the same filter selection.
 */
export function useAdminLocationFilter() {
  const [filter, setFilter] = usePersistedState<AdminLocationFilter>(
    "admin/locationFilter",
    EMPTY_LOCATION_FILTER
  );

  const setHallId = (hallId: string) =>
    setFilter((f) => ({
      ...f,
      hallId,
      // Reset narrower scopes when hostel changes
      floor: "",
      block: "",
      groupId: "",
    }));

  const setFloor = (floor: string) =>
    setFilter((f) => ({ ...f, floor, groupId: "" }));

  const setBlock = (block: string) =>
    setFilter((f) => ({ ...f, block, groupId: "" }));

  const setGroupId = (groupId: string) =>
    setFilter((f) => ({ ...f, groupId }));

  const clear = () => setFilter(EMPTY_LOCATION_FILTER);

  const active = isLocationFilterActive(filter);

  return {
    filter,
    setFilter,
    setHallId,
    setFloor,
    setBlock,
    setGroupId,
    clear,
    active,
  };
}

/** Unique floors / blocks from groups, optionally scoped to selected hall. */
export function useLocationOptions(
  halls: HallDTO[] | null | undefined,
  groups: StudentGroupDTO[] | null | undefined,
  filter: AdminLocationFilter
) {
  return useMemo(() => {
    const hallList = halls ?? [];
    const groupList = groups ?? [];
    const inHall = filter.hallId
      ? groupList.filter((g) => g.hallId === filter.hallId)
      : groupList;

    const floors = [
      ...new Set(
        inHall
          .map((g) => g.floor)
          .filter((x): x is string => !!x?.trim())
      ),
    ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const inFloor = filter.floor
      ? inHall.filter(
          (g) => g.floor.toLowerCase() === filter.floor.toLowerCase()
        )
      : inHall;

    const blocks = [
      ...new Set(
        inFloor
          .map((g) => g.block)
          .filter((x): x is string => !!x?.trim())
      ),
    ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const inBlock = filter.block
      ? inFloor.filter(
          (g) => g.block.toLowerCase() === filter.block.toLowerCase()
        )
      : inFloor;

    return {
      halls: hallList,
      floors,
      blocks,
      groups: inBlock,
    };
  }, [halls, groups, filter.hallId, filter.floor, filter.block]);
}
