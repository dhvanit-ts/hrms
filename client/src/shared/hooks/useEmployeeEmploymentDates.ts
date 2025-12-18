import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { employeeHttp } from '@/services/api/employee-http';

export interface EmploymentDates {
  hireDate: string | null;
  terminationDate: string | null;
}

export function useEmployeeEmploymentDates() {
  const { employeeAccessToken } = useAuth();
  const [employmentDates, setEmploymentDates] = useState<EmploymentDates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeAccessToken) {
      setEmploymentDates(null);
      return;
    }

    const fetchEmploymentDates = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch employee profile to get hire and termination dates
        const response = await employeeHttp.get('/profile');
        const employee = response.data.employee;

        setEmploymentDates({
          hireDate: employee.hireDate,
          terminationDate: employee.terminationDate,
        });
      } catch (err: any) {
        console.error('Failed to fetch employment dates:', err);
        setError(err.response?.data?.message || 'Failed to fetch employment dates');
      } finally {
        setLoading(false);
      }
    };

    fetchEmploymentDates();
  }, [employeeAccessToken]);

  return { employmentDates, loading, error };
}