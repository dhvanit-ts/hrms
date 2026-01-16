import z from "zod"

const voteTypeSchema = z.enum(["upvote", "downvote"])
const targetTypeSchema = z.enum(["post", "comment"])

export const deleteVoteSchema = z.object({ voteType: voteTypeSchema, targetType: targetTypeSchema })
export const insertVoteSchema = deleteVoteSchema.extend({ targetId: z.uuid() })