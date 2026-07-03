/**
 * DTO shapes returned by /api/v1/* routes, as consumed by client components.
 * These mirror the Prisma models but keep Decimal/Date as strings (JSON).
 */

export type HallDTO = {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  capacity: number;
  isActive: boolean;
};

export type RoomDTO = {
  id: string;
  number: string;
  floor?: number | null;
  capacity: number;
  hallId: string;
  hall?: HallDTO | null;
};

export type StudentDTO = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  roomId?: string | null;
  room?: RoomDTO | null;
  isActive: boolean;
  createdAt: string;
};

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "STUDENT";
    phone?: string | null;
    image?: string | null;
  };
  student:
    | (StudentDTO & { room?: (RoomDTO & { hall?: HallDTO | null }) | null })
    | null;
};

export type MachineDTO = {
  id: string;
  serialNumber: string;
  qrToken?: string | null;
  brand?: string | null;
  model?: string | null;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY" | "DECOMMISSIONED";
  hallId?: string | null;
  hall?: HallDTO | null;
  notes?: string | null;
};

export type PaymentDTO = {
  id: string;
  studentId: string;
  amount: string;
  currency: string;
  method: "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CARD" | "OTHER";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  reference?: string | null;
  description?: string | null;
  paidAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
  student?: { firstName: string; lastName: string; studentId: string } | null;
};

export type FaultDTO = {
  id: string;
  machineId: string;
  reportedById: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "WONT_FIX";
  imageUrls: string[];
  resolution?: string | null;
  createdAt: string;
  machine?: { serialNumber: string } | null;
  reportedBy?: { firstName: string; lastName: string } | null;
};

/** Rotation intelligence computed from MachineSchedule. */
export type RotationInfo = {
  dayOfWeek: string;
  room: { id: string; number: string } | null;
  hall: { code: string; name: string } | null;
  startTime: string; // "HH:MM"
  endTime: string;
  windowStartAt: string; // ISO — when this room's window opened
  windowEndAt: string; // ISO — when it moves to the next room
  minutesToNextRotation: number;
  nextRoom: { id: string; number: string } | null;
};

/** Result of scanning a machine QR. */
export type ScanResult = {
  session: {
    id: string;
    scannedAt: string;
    expectedStartAt: string;
    dueBackAt: string;
    minutesLate: number | null;
    status: "IN_USE" | "RETURNED" | "EXPIRED";
  };
  machine: { id: string; serialNumber: string };
  room: { id: string; number: string } | null;
  hall: { code: string; name: string } | null;
  minutesToNextRotation: number;
};

export type StudentRotation = {
  machine: { id: string; serialNumber: string };
  myRoom: { id: string; number: string };
  hall: { code: string; name: string } | null;
  myDay: string;
  myStartTime: string;
  isHereNow: boolean;
  nextTurnAt: string;
  currentRoom: { id: string; number: string } | null;
  windowEndAt: string | null;
  minutesToNextRotation: number;
} | null;

export type ActiveSession = {
  id: string;
  scannedAt: string;
  expectedStartAt: string;
  dueBackAt: string;
  minutesLate: number | null;
  status: "IN_USE" | "RETURNED" | "EXPIRED";
  machine: { id: string; serialNumber: string };
  room: { id: string; number: string } | null;
  hall: { code: string; name: string } | null;
} | null;

export type DashboardStats = {
  activeStudents: number;
  machines: { total: number; active: number; faulty: number; maintenance: number };
  activeContracts: number;
  revenue: number;
};

export type ContactConfig = {
  whatsapp: string;
  email: string;
  phone: string;
};
