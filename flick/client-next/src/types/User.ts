import { ICollege } from "./College"

export interface IUser {
  _id: string
  username: string
  branch: string
  college: string | ICollege
  isBlocked: boolean
  suspension: {
    ends: Date
    reason: string
    howManyTimes: number
  }
}