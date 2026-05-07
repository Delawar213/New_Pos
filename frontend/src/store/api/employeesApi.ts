// ============================================
// Employees API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const employeesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getEmployees: builder.query<
      ApiResponse<{
        data: Employee[];
        totalRecords: number;
        pageNumber: number;
        pageSize: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
      }>,
      PaginationParams
    >({
      query: (params) => ({ url: "/proxy/employees", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.data.map(({ employeeId }) => ({ type: "Employees" as const, id: employeeId })),
              { type: "Employees", id: "LIST" },
            ]
          : [{ type: "Employees", id: "LIST" }],
    }),

    getEmployeeById: builder.query<Employee, number>({
      query: (id) => `/proxy/employees/${id}`,
      transformResponse: (response: ApiResponse<Employee>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Employees", id }],
    }),

    createEmployee: builder.mutation<ApiResponse<Employee>, CreateEmployeeRequest>({
      query: (body) => ({ url: "/proxy/employees", method: "POST", body }),
      invalidatesTags: [{ type: "Employees", id: "LIST" }],
    }),

    updateEmployee: builder.mutation<ApiResponse<Employee>, UpdateEmployeeRequest>({
      query: ({ employeeId, ...body }) => ({ url: `/proxy/employees/${employeeId}`, method: "PUT", body: { employeeId, ...body } }),
      invalidatesTags: (_r, _e, { employeeId }) => [
        { type: "Employees", id: employeeId },
        { type: "Employees", id: "LIST" },
      ],
    }),

    deleteEmployee: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/employees/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Employees", id: "LIST" }],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi;
