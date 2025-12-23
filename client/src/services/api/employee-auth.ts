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

export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
) {
  try {
    const res = await employeeHttp.patch("/auth/employee/change-password", {
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

export async function adminChangeEmployeePassword(
  accessToken: string,
  employeeId: number,
  newPassword: string
) {
  try {
    const res = await employeeHttp.patch(`/employees/${employeeId}/change-password`, {
      newPassword
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.message || "Failed to change employee password"
      );
    }
    throw error;
  }
}
