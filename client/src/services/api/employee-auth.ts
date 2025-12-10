import { employeeHttp } from "./employee-http";

export async function employeeLogin(identifier: string, password: string) {
  const res = await employeeHttp.post("/auth/employee/login", {
    identifier,
    password,
  });
  return res.data as { employee: any; accessToken: string };
}

export async function employeeSetupPassword(employeeId: string, password: string) {
  const res = await employeeHttp.post("/auth/employee/setup-password", {
    employeeId,
    password,
  });
  return res.data as { employee: any; accessToken: string };
}

export async function employeeLogout() {
  await employeeHttp.post("/auth/employee/logout");
}

export async function employeeMe(accessToken?: string) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await employeeHttp.get("/employees/me", { headers });
  return res.data as { employee: any };
}

export async function employeeRefresh() {
  const res = await employeeHttp.post("/auth/employee/refresh");
  return res.data as { accessToken: string };
}
