/**
 * Shared admin location filter: hostel → floor → block → group.
 * Used across Machines, Payments, Students, Faults, Rotation.
 */

export type AdminLocationFilter = {
  hallId: string;
  floor: string;
  block: string;
  groupId: string;
};

export const EMPTY_LOCATION_FILTER: AdminLocationFilter = {
  hallId: "",
  floor: "",
  block: "",
  groupId: "",
};

export function isLocationFilterActive(f: AdminLocationFilter): boolean {
  return !!(f.hallId || f.floor || f.block || f.groupId);
}

/** Minimal shape to match a student (or unpaid row with group/room). */
export type LocationStudentLike = {
  groupId?: string | null;
  group?: {
    id?: string;
    hallId?: string;
    floor?: string;
    block?: string;
    hall?: { id?: string } | null;
  } | null;
  room?: {
    hallId?: string;
    hall?: { id?: string; code?: string } | null;
  } | null;
  roomNumber?: string | null;
};

export function matchStudentLocation(
  s: LocationStudentLike | null | undefined,
  f: AdminLocationFilter
): boolean {
  if (!isLocationFilterActive(f)) return true;
  if (!s) return false;

  const groupId = s.groupId ?? s.group?.id ?? null;
  const hallId =
    s.group?.hallId ??
    s.group?.hall?.id ??
    s.room?.hallId ??
    s.room?.hall?.id ??
    null;
  const floor = s.group?.floor ?? null;
  const block = s.group?.block ?? null;

  if (f.groupId && groupId !== f.groupId) return false;
  if (f.hallId && hallId !== f.hallId) return false;
  if (f.floor && (floor ?? "").toLowerCase() !== f.floor.toLowerCase()) return false;
  if (f.block && (block ?? "").toLowerCase() !== f.block.toLowerCase()) return false;
  return true;
}

export type LocationMachineLike = {
  hallId?: string | null;
  hall?: { id?: string } | null;
  /** Groups served by this machine (schedule rooms or same-hall) */
  groups?: Array<{
    id: string;
    hallId?: string;
    floor?: string;
    block?: string;
  }> | null;
};

export function matchMachineLocation(
  m: LocationMachineLike | null | undefined,
  f: AdminLocationFilter
): boolean {
  if (!isLocationFilterActive(f)) return true;
  if (!m) return false;

  const hallId = m.hallId ?? m.hall?.id ?? null;
  const groups = m.groups ?? [];

  if (f.groupId) {
    if (!groups.some((g) => g.id === f.groupId)) return false;
  }
  if (f.hallId) {
    const hallMatch =
      hallId === f.hallId || groups.some((g) => g.hallId === f.hallId);
    if (!hallMatch) return false;
  }
  if (f.floor) {
    if (
      !groups.some(
        (g) => (g.floor ?? "").toLowerCase() === f.floor.toLowerCase()
      )
    )
      return false;
  }
  if (f.block) {
    if (
      !groups.some(
        (g) => (g.block ?? "").toLowerCase() === f.block.toLowerCase()
      )
    )
      return false;
  }
  return true;
}

export type LocationGroupLike = {
  id: string;
  hallId: string;
  floor: string;
  block: string;
};

export function matchGroupLocation(
  g: LocationGroupLike | null | undefined,
  f: AdminLocationFilter
): boolean {
  if (!isLocationFilterActive(f)) return true;
  if (!g) return false;
  if (f.groupId && g.id !== f.groupId) return false;
  if (f.hallId && g.hallId !== f.hallId) return false;
  if (f.floor && g.floor.toLowerCase() !== f.floor.toLowerCase()) return false;
  if (f.block && g.block.toLowerCase() !== f.block.toLowerCase()) return false;
  return true;
}
