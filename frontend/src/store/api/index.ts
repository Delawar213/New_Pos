// ============================================
// API Services - Barrel Export
// ============================================
// Import all API services so their endpoints
// are injected into the base API.
// ============================================

export { baseApi } from "./baseApi";
export { authApi, useLoginMutation, useLogoutMutation, useGetProfileQuery } from "./authApi";
export { categoriesApi, useGetCategoriesQuery, useGetActiveCategoriesQuery, useGetCategoryByIdQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "./categoriesApi";
export { brandsApi, useGetBrandsQuery, useGetAllBrandsQuery, useGetBrandByIdQuery, useCreateBrandMutation, useUpdateBrandMutation, useDeleteBrandMutation } from "./brandsApi";
export { productsApi, useGetProductsQuery, useSearchProductsQuery, useGetProductByIdQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from "./productsApi";
export { suppliersApi, useGetSuppliersQuery, useGetActiveSuppliersQuery, useGetSuppliersDropdownQuery, useGetSupplierByIdQuery, useGetSupplierByCodeQuery, useGetSupplierLedgerQuery, useGetSupplierBalanceQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation } from "./suppliersApi";
export { customersApi, useGetCustomersQuery, useGetActiveCustomersQuery, useGetWalkingCustomerQuery, useGetCustomerTypesQuery, useGetCustomersDropdownQuery, useGetCustomerByIdQuery, useGetCustomerByCodeQuery, useGetCustomerBalanceQuery, useGetCustomerLedgerQuery, useGetCustomerLoyaltyQuery, useAddCustomerLoyaltyMutation, useRedeemCustomerLoyaltyMutation, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } from "./customersApi";
export { employeesApi, useGetEmployeesQuery, useGetEmployeeByIdQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation } from "./employeesApi";
export { bankAccountsApi, useGetBankAccountsQuery, useGetAllBankAccountsQuery, useGetCashAccountsQuery, useGetBankOnlyAccountsQuery, useGetAccountsDropdownQuery, useGetBankAccountByIdQuery, useGetAccountBalanceQuery, useGetTotalCashBalanceQuery, useGetTotalBankBalanceQuery, useCreateBankAccountMutation, useUpdateBankAccountMutation, useDeleteBankAccountMutation } from "./bankAccountsApi";
export { expenseCategoriesApi, useGetExpenseCategoriesQuery, useGetAllExpenseCategoriesQuery, useGetExpenseCategoryByIdQuery, useCreateExpenseCategoryMutation, useUpdateExpenseCategoryMutation, useDeleteExpenseCategoryMutation } from "./expenseCategoriesApi";
export { transactionsApi, useGetTransactionsQuery, useGetTransactionByIdQuery, useCreateTransactionMutation, useUpdateTransactionMutation, useDeleteTransactionMutation } from "./transactionsApi";
export { purchasesApi, useGetPurchasesQuery, useGetPurchaseByIdQuery, useCreatePurchaseMutation, useUpdatePurchaseMutation, useDeletePurchaseMutation } from "./purchasesApi";
export { salesApi, useGetSalesQuery, useGetSaleByIdQuery, useCreateSaleMutation, useUpdateSaleMutation, useDeleteSaleMutation } from "./salesApi";
export { dashboardApi, useGetDashboardStatsQuery, useGetSalesChartQuery, useGetTopSellingProductsQuery, useGetRecentTransactionsQuery } from "./dashboardApi";
