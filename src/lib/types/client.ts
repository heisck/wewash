/**
 * DTO shapes returned by /api/v1/* routes, as consumed by client components.
 * These mirror the Prisma models but keep Decimal/Date as strings (JSON).
 */

export type HallDTO = {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  description?: string | null;
  capacity: number;
  isActive: boolean;
  rooms?: RoomDTO[];
  _count?: { rooms: number; machines: number };
};

export type RoomDTO = {
  id: string;
  number: string;
  block?: string | null;
  floor?: number | null;
  section?: string | null;
  capacity: number;
  hallId: string;
  hall?: HallDTO | null;
  students?: StudentDTO[];
  _count?: { students: number };
};

export type StudentGroupDTO = {
  id: string;
  name: string;
  hallId: string;
  floor: string;
  block: string;
  notes?: string | null;
  isActive: boolean;
  hall?: Pick<HallDTO, "id" | "name" | "code"> | null;
  _count?: { students: number };
  /** Unique rooms in this group (rotation assigns days to rooms, not students) */
  rooms?: Array<{
    id: string;
    number: string;
    block?: string | null;
    floor?: number | null;
    studentCount: number;
    students: { id: string; firstName: string; lastName: string }[];
  }>;
  students?: Array<{
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    roomNumber?: string | null;
    roomId?: string | null;
    isActive: boolean;
  }>;
};

export type StudentDTO = {
  id: string;
  studentId: string;
  indexNumber?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  secondaryPhone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  roomId?: string | null;
  roomNumber?: string | null;
  groupId?: string | null;
  room?: RoomDTO | null;
  group?: StudentGroupDTO | null;
  weeklyAmount?: string | number;
  /** Confirmed COMPLETED sum this Mon–Sun week (list enrichment) */
  paidThisWeek?: number;
  remaining?: number;
  isPaidInFull?: boolean;
  /** Active rotation days for the student's room */
  scheduleDays?: string[];
  scheduleSlots?: Array<{
    dayOfWeek: string;
    startTime: string;
    machineLabel?: string | null;
  }>;
  profileImageUrl?: string | null;
  documentUrls?: string[];
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
    notifySms?: boolean;
    notifyEmail?: boolean;
  };
  student:
    | (StudentDTO & { room?: (RoomDTO & { hall?: HallDTO | null }) | null })
    | null;
};

export type WeekDuesStatus = {
  studentId: string;
  weeklyAmount: number;
  paidThisWeek: number;
  remaining: number;
  isPaidInFull: boolean;
  weekStart: string;
  weekEnd: string;
};

export type PaymentReviewBoard = {
  weekStart: string;
  pendingProofs: PaymentDTO[];
  unpaidThisWeek: Array<{
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    weeklyAmount: number;
    /** Sum of COMPLETED pieces this Mon–Sun week */
    paidThisWeek: number;
    remaining: number;
    isPaidInFull: boolean;
    roomNumber?: string | null;
    userId?: string | null;
    groupId?: string | null;
    rotationDayPassed: boolean;
    scheduleDays: string[];
    group?: {
      id: string;
      name: string;
      hallId: string;
      floor: string;
      block: string;
      hall?: { id: string; code: string; name: string } | null;
    } | null;
    room?: {
      id: string;
      number: string;
      hallId?: string;
      hall?: { id?: string; code: string; name: string } | null;
    } | null;
  }>;
  counts: { pending: number; unpaid: number; paid: number };
};

export type MachineScheduleDTO = {
  id: string;
  machineId: string;
  roomId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
  isActive: boolean;
  room?: RoomDTO | null;
};

export type MachineGroupBrief = {
  id: string;
  name: string;
  hallId: string;
  floor: string;
  block: string;
  /** At least one of this group's rooms is on the machine schedule */
  scheduled: boolean;
};

export type MachineDTO = {
  id: string;
  serialNumber: string;
  name?: string | null;
  code?: string | null;
  qrToken?: string | null;
  brand?: string | null;
  model?: string | null;
  capacityKg?: number | null;
  machineType?: string | null;
  purchaseDate?: string | null;
  installationDate?: string | null;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY" | "DECOMMISSIONED";
  hallId?: string | null;
  hall?: HallDTO | null;
  notes?: string | null;
  schedules?: MachineScheduleDTO[];
  /** Student groups this machine serves / can serve (schedule + same hostel) */
  groups?: MachineGroupBrief[];
  /** From schedule estimate (fallback) or QR scan room */
  currentRoom?: { id: string; number: string; block?: string | null; floor?: number | null; section?: string | null } | null;
  previousRoom?: { id: string; number: string } | null;
  nextRoom?: { id: string; number: string } | null;
  hoursToNextTransfer?: number | null;
  /**
   * Who scanned the machine QR last (live). Admin “who has it” view.
   * Only set while WashSession status is IN_USE.
   */
  heldBy?: {
    studentId: string;
    firstName: string;
    lastName: string;
    universityId: string;
    roomId: string;
    roomNumber: string;
    scannedAt: string;
    dueBackAt: string;
  } | null;
};

export type PaymentDTO = {
  id: string;
  studentId: string;
  amount: string;
  amountDue?: string | null;
  amountPaid?: string | null;
  currency: string;
  method: "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CARD" | "OTHER";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  reference?: string | null;
  momoTransactionId?: string | null;
  description?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  dueDate?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  student?: {
    firstName: string;
    lastName: string;
    studentId: string;
    weeklyAmount?: string | number | null;
    roomNumber?: string | null;
    room?: RoomDTO | null;
  } | null;
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
  estimatedCost?: string | number | null;
  actualCost?: string | number | null;
  resolvedAt?: string | null;
  createdAt: string;
  machine?: {
    serialNumber: string;
    name?: string | null;
    code?: string | null;
    status?: string;
  } | null;
  reportedBy?: {
    firstName: string;
    lastName: string;
    studentId?: string;
    roomNumber?: string | null;
    room?: { number: string } | null;
  } | null;
};

/** Rotation intelligence computed from MachineSchedule. */
export type RotationInfo = {
  dayOfWeek: string;
  room: { id: string; number: string } | null;
  hall: { code: string; name: string } | null;
  startTime: string;
  endTime: string;
  windowStartAt: string;
  windowEndAt: string;
  minutesToNextRotation: number;
  hoursToNextRotation: number;
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
  machine: {
    id: string;
    serialNumber: string;
    name?: string | null;
    code?: string | null;
    label?: string;
  };
  student?: { id: string; firstName: string; lastName: string };
  room: { id: string; number: string } | null;
  hall: { code: string; name: string } | null;
  minutesToNextRotation: number;
  message?: string;
};

export type StudentRotation = {
  machine: { id: string; serialNumber: string; name?: string | null; code?: string | null };
  myRoom: { id: string; number: string };
  hall: { code: string; name: string } | null;
  myDay: string;
  myStartTime: string;
  /** All wash days for the student's room */
  slots?: Array<{ dayOfWeek: string; startTime: string }>;
  isHereNow: boolean;
  nextTurnAt: string;
  currentRoom: { id: string; number: string } | null;
  windowEndAt: string | null;
  minutesToNextRotation: number;
  hoursToNextRotation: number;
} | null;

export type ActiveSession = {
  id: string;
  scannedAt: string;
  expectedStartAt: string;
  dueBackAt: string;
  minutesLate: number | null;
  status: "IN_USE" | "RETURNED" | "EXPIRED";
  feedbackRating?: string | null;
  machine: { id: string; serialNumber: string; name?: string | null; code?: string | null };
  room: { id: string; number: string } | null;
  hall: { code: string; name: string } | null;
} | null;

export type TransferTimelineItem = {
  machineId: string;
  machineLabel: string;
  currentRoom: string | null;
  nextRoom: string | null;
  hallCode: string | null;
  hoursRemaining: number;
  windowEndAt: string;
};

export type MachineLocationItem = {
  machineId: string;
  machineLabel: string;
  status: string;
  hallCode: string | null;
  currentRoom: string | null;
  /** Student who scanned the QR (live hold) */
  heldBy?: string | null;
  previousRoom: string | null;
  nextRoom: string | null;
  hoursToNextTransfer: number | null;
};

export type DashboardStats = {
  totalIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  amountCollected: number;
  outstandingBalance: number;
  activeStudents: number;
  registeredStudents: number;
  registeredRooms: number;
  machines: {
    total: number;
    active: number;
    faulty: number;
    maintenance: number;
  };
  activeContracts: number;
  openFaults: number;
  /** @deprecated use totalIncome / amountCollected */
  revenue?: number;
  upcomingTransfers: TransferTimelineItem[];
  machineLocations: MachineLocationItem[];
  recentFaults: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
    studentName?: string;
    machineLabel?: string;
  }>;
};

export type ContactConfig = {
  whatsapp: string;
  email: string;
  phone: string;
  defaultWeeklyAmount?: number;
  rotationHandoffTime?: string;
};
