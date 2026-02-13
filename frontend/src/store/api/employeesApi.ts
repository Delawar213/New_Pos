// ============================================
// Employees API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<PaginatedResponse<Employee>, PaginationParams>({
      query: (params) => ({ url: "/employees", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Employees" as const, id })),
              { type: "Employees", id: "LIST" },
            ]
          : [{ type: "Employees", id: "LIST" }],
    }),

    getEmployeeById: builder.query<Employee, number>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Employees", id }],
    }),

    createEmployee: builder.mutation<ApiResponse<Employee>, CreateEmployeeRequest>({
      query: (body) => ({ url: "/employees", method: "POST", body }),
      invalidatesTags: [{ type: "Employees", id: "LIST" }],
    }),

    updateEmployee: builder.mutation<ApiResponse<Employee>, UpdateEmployeeRequest>({
      query: ({ id, ...body }) => ({ url: `/employees/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Employees", id },
        { type: "Employees", id: "LIST" },
      ],
    }),

    deleteEmployee: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/employees/${id}`, method: "DELETE" }),
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
