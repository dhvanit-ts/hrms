import { http } from "./http";

export async function login(email: string, password: string) {
  const res = await http.post("/auth/login", {
    email,
    password,
  });
  return res.data as { user: any; accessToken: string };
}

export async function register(payload: { email: string; password: string }) {
  const res = await http.post("/auth/register", payload);
  return res.data as { user: any; accessToken: string };
}

export async function logout() {
  await http.post("/auth/logout");
}

export async function me(accessToken?: string) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await http.get("/users/me", { headers });
  return res.data as { user: any };
}

export async function refresh() {
  const res = await http.post("/auth/refresh");
  return res.data as { accessToken: string };
}

export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
) {
  try {
    const res = await http.patch("/auth/change-password", {
      currentPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.message || "Failed to change password"
      );
    }
    throw error;
  }
}
