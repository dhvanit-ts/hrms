import { ApiError } from "@/core/http"
import prisma from "@/config/db"

interface CreateHolidayData {
    name: string;
    date: string;
    description?: string;
    isRecurring?: boolean;
}

interface UpdateHolidayData {
    name?: string;
    date?: string;
    description?: string;
    isRecurring?: boolean;
}

export class HolidayService {
    static async createHoliday(data: CreateHolidayData) {
        const existingHoliday = await prisma.holiday.findFirst({
            where: {
                date: new Date(data.date),
                name: data.name,
            },
        });

        if (existingHoliday) {
            throw new ApiError({
                statusCode: 409,
                code: "HOLIDAY_EXISTS",
                message: "Holiday with this name and date already exists",
            });
        }

        return prisma.holiday.create({
            data: {
                name: data.name,
                date: new Date(data.date),
                description: data.description,
                isRecurring: data.isRecurring ?? false,
            },
        });
    }

    static async getAllHolidays(year?: number) {
        const where = year
            ? {
                date: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            }
            : {};

        return prisma.holiday.findMany({
            where,
            orderBy: {
                date: "asc",
            },
        });
    }

    static async getHolidayById(id: number) {
        const holiday = await prisma.holiday.findUnique({
            where: { id },
        });

        if (!holiday) {
            throw new ApiError({
                statusCode: 404,
                code: "HOLIDAY_NOT_FOUND",
                message: "Holiday not found",
            });
        }

        return holiday;
    }

    static async updateHoliday(id: number, data: UpdateHolidayData) {
        const holiday = await prisma.holiday.findUnique({
            where: { id },
        });

        if (!holiday) {
            throw new ApiError({
                statusCode: 404,
                code: "HOLIDAY_NOT_FOUND",
                message: "Holiday not found",
            });
        }

        if (data.date && data.name) {
            const existingHoliday = await prisma.holiday.findFirst({
                where: {
                    date: new Date(data.date),
                    name: data.name,
                    NOT: { id },
                },
            });

            if (existingHoliday) {
                throw new ApiError({
                    statusCode: 409,
                    code: "HOLIDAY_EXISTS",
                    message: "Holiday with this name and date already exists",
                });
            }
        }

        return prisma.holiday.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.date && { date: new Date(data.date) }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
            },
        });
    }

    static async deleteHoliday(id: number) {
        const holiday = await prisma.holiday.findUnique({
            where: { id },
        });

        if (!holiday) {
            throw new ApiError({
                statusCode: 404,
                code: "HOLIDAY_NOT_FOUND",
                message: "Holiday not found",
            });
        }

        return prisma.holiday.delete({
            where: { id },
        });
    }
}
