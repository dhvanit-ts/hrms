import z from "zod"

const VoteTypeSchema = z.enum(["upvote", "downvote"])
const TargetTypeSchema = z.enum(["post", "comment"])
const UUIDSchema = z.uuid()

export const DeleteVoteSchema = z.object({ targetType: TargetTypeSchema, targetId: UUIDSchema })
export const InsertVoteSchema = DeleteVoteSchema.extend({ targetId: UUIDSchema, targetType: TargetTypeSchema, voteType: VoteTypeSchema })