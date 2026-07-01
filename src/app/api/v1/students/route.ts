import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { studentService } from "@/lib/services/student.service";
import { createStudentSchema, studentFilterSchema } from "@/lib/validators";
import { parsePagination, parseSort } from "@/lib/utils/pagination";
import { successResponse, createdResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const searchParams = req.nextUrl.searchParams;

    const pagination = parsePagination(searchParams);
    const filters = studentFilterSchema.parse(Object.fromEntries(searchParams));

    const { data, total } = await studentService.getStudents(
      session?.user ?? null,
      filters,
      pagination
    );

    return successResponse(data, 200, {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json().catch(() => ({}));
    
    const validatedData = createStudentSchema.parse(body);
    
    const student = await studentService.createStudent(
      session?.user ?? null,
      validatedData
    );

    return createdResponse(student);
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit("READ", getHandler);
export const POST = withRateLimit("WRITE", postHandler);
