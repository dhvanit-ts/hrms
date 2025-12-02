import { http } from "./http";

export async function login(email: string, password: string) {
  const res = await http.post("http://localhost:4000/api/auth/login", {
    email,
    password,
  });
  return res.data as { user: any; accessToken: string };
}

export async function register(payload: { email: string; password: string }) {
  const res = await http.post(
    "http://localhost:4000/api/auth/register",
    payload
  );
  return res.data as { user: any; accessToken: string };
}

export async function logout() {
  await http.post("http://localhost:4000/api/auth/logout");
}

export async function me(accessToken: string) {
  const res = await http.get("/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data as { user: any };
}

export async function refresh() {
  const res = await http.post("http://localhost:4000/api/auth/refresh");
  return res.data as { accessToken: string };
}
