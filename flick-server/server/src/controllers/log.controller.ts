import { Request, Response } from "express";
import { LogModel } from "../models/log.model.js";
import { toObjectId } from "../utils/toObject.js";
import { Types } from "mongoose";

export const getLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      role,
      action,
      platform,
      status,
      sessionId,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query object
    const query: {
      userId?: Types.ObjectId;
      role?: string;
      action?: string;
      platform?: string;
      status?: string;
      sessionId?: string;
      timestamp?: { $gte?: Date; $lte?: Date };
    } = {};

    if (userId) query.userId = toObjectId(userId.toString());
    if (role) query.role = role.toString();
    if (action) query.action = action.toString();
    if (platform) query.platform = platform.toString();
    if (status) query.status = status.toString();
    if (sessionId) query.sessionId = sessionId.toString();

    if (fromDate) {
      const parsed = new Date(fromDate.toString());
      if (!isNaN(parsed.getTime())) {
        query.timestamp = query.timestamp || {};
        query.timestamp.$gte = parsed;
      }
    }
    if (toDate) {
      const parsed = new Date(toDate.toString());
      if (!isNaN(parsed.getTime())) {
        query.timestamp = query.timestamp || {};
        query.timestamp.$lte = parsed;
      }
    }

    const numerifiedPage = Math.max(1, parseInt(page.toString()) || 1);
    const numerifiedLimit = Math.min(
      Math.max(1, parseInt(limit.toString()) || 20),
      100
    );

    const skip = (numerifiedPage - 1) * numerifiedLimit;

    const allowedSortFields = [
      "createdAt",
      "timestamp",
      "userId",
      "action",
      "platform",
      "status",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy.toString())
      ? sortBy.toString()
      : "createdAt";

    let queryBuilder = LogModel.find(query);

    if (req.query.populate) {
      const fields = req.query.populate.toString().split(",");
      for (const field of fields) {
        queryBuilder = queryBuilder.populate(field.trim());
      }
    }

    const logs = await queryBuilder
      .sort({ [safeSortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(numerifiedLimit);

    const total = await LogModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: numerifiedPage,
        limit: numerifiedLimit,
        pages: Math.ceil(total / numerifiedLimit),
      },
    });
  } catch (error) {
    console.error("[fetchLogs] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching logs.",
    });
  }
};
