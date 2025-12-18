import { Request, Response } from "express";
import { z } from "zod";
import { ApiResponse, asyncHandlerCb as asyncHandler } from "@/core/http";
import { validate } from "../../core/middlewares/validate.js";
import { HolidayService } from "./holiday.service.js";

const createHolidaySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Holiday name is required"),
        date: z.iso.datetime("Invalid date format"),
        description: z.string().optional(),
        isRecurring: z.boolean().optional().default(false),
    })
});

const updateHolidaySchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        date: z.iso.datetime().optional(),
        description: z.string().optional(),
        isRecurring: z.boolean().optional(),
    })
});

export class HolidayController {
    static createHoliday = [
        validate(createHolidaySchema),
        asyncHandler(async (req: Request, res: Response) => {
            const data = req.body;
            const holiday = await HolidayService.createHoliday(data);
            return ApiResponse.ok(res, holiday, "Holiday created successfully");
        }),
    ];

    static getAllHolidays = asyncHandler(async (req: Request, res: Response) => {
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const holidays = await HolidayService.getAllHolidays(year);
        return ApiResponse.ok(res, holidays);
    });

    static getHolidayById = asyncHandler(async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const holiday = await HolidayService.getHolidayById(id);
        return ApiResponse.ok(res, holiday);
    });

    static updateHoliday = [
        validate(updateHolidaySchema),
        asyncHandler(async (req: Request, res: Response) => {
            const id = parseInt(req.params.id);
            const data = req.body;
            const holiday = await HolidayService.updateHoliday(id, data);
            return ApiResponse.ok(res, holiday, "Holiday updated successfully");
        }),
    ];

    static deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        await HolidayService.deleteHoliday(id);
        return ApiResponse.ok(res, null, "Holiday deleted successfully");
    });
}
