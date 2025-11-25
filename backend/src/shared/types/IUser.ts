export interface IUser {
  id?: string;
  username: string;
  email: string;
  password: string;
  authType: "manual" | "oauth";
  refreshToken?: string;
}
