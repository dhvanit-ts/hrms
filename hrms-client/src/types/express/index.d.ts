
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        password?: string;
        refreshToken: string;
      };
      admin?: {
        id: string;
      };
    }
  }
}