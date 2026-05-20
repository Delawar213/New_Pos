import type { BankAccountDropdown } from "@/types/bankAccount";
import type { CreateTransactionDetailLine, CreateTransactionRequest } from "@/types/transaction";

export type PaymentTransactionType =
  | "collect_customer"
  | "refund_customer"
  | "pay_supplier"
  | "receive_supplier"
  | "transfer";

export const PAYMENT_TYPE_OPTIONS: {
  value: PaymentTransactionType;
  label: string;
}[] = [
  { value: "collect_customer", label: "Collect from customer" },
  { value: "refund_customer", label: "Refund customer" },
  { value: "pay_supplier", label: "Pay supplier" },
  { value: "receive_supplier", label: "Receive from supplier (return)" },
  { value: "transfer", label: "Transfer (cash ↔ bank)" },
];

const CUSTOMER_RECEIVABLE = {
  accountType: "Customer",
  accountName: "Customer Receivable",
  refTable: "Customers" as const,
};

const SUPPLIER_PAYABLE = {
  accountType: "Supplier",
  accountName: "Supplier Payable",
  refTable: "Suppliers" as const,
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function bankDetailLine(
  account: BankAccountDropdown,
  side: "debit" | "credit",
  amount: number,
  description: string
): CreateTransactionDetailLine {
  const amt = roundMoney(amount);
  return {
    accountType: account.accountType,
    accountName: account.accountName,
    refTable: account.refTable ?? "Bank_Accounts",
    refId: account.refId ?? account.bankAccountId,
    bankAccountId: account.bankAccountId,
    debit: side === "debit" ? amt : 0,
    credit: side === "credit" ? amt : 0,
    description,
  };
}

function customerLine(
  customerId: number,
  side: "debit" | "credit",
  amount: number,
  description: string
): CreateTransactionDetailLine {
  const amt = roundMoney(amount);
  return {
    accountType: CUSTOMER_RECEIVABLE.accountType,
    accountName: CUSTOMER_RECEIVABLE.accountName,
    refTable: CUSTOMER_RECEIVABLE.refTable,
    refId: customerId,
    bankAccountId: null,
    debit: side === "debit" ? amt : 0,
    credit: side === "credit" ? amt : 0,
    description,
  };
}

function supplierLine(
  supplierId: number,
  side: "debit" | "credit",
  amount: number,
  description: string
): CreateTransactionDetailLine {
  const amt = roundMoney(amount);
  return {
    accountType: SUPPLIER_PAYABLE.accountType,
    accountName: SUPPLIER_PAYABLE.accountName,
    refTable: SUPPLIER_PAYABLE.refTable,
    refId: supplierId,
    bankAccountId: null,
    debit: side === "debit" ? amt : 0,
    credit: side === "credit" ? amt : 0,
    description,
  };
}

export function defaultTitleForPaymentType(type: PaymentTransactionType): string {
  switch (type) {
    case "collect_customer":
      return "Customer payment received";
    case "refund_customer":
      return "Customer refund";
    case "pay_supplier":
      return "Supplier payment";
    case "receive_supplier":
      return "Supplier return receipt";
    case "transfer":
      return "Cash / bank transfer";
    default:
      return "Payment transaction";
  }
}

export function buildPaymentTransactionDetails(params: {
  paymentType: PaymentTransactionType;
  amount: number;
  bankAccount: BankAccountDropdown;
  transferToAccount?: BankAccountDropdown;
  customerId?: number;
  supplierId?: number;
  lineDescription?: string;
}): CreateTransactionDetailLine[] {
  const { paymentType, amount, bankAccount, transferToAccount, customerId, supplierId } = params;
  const desc = params.lineDescription?.trim() || defaultTitleForPaymentType(paymentType);
  const amt = roundMoney(amount);
  if (amt <= 0) return [];

  switch (paymentType) {
    case "collect_customer":
      if (!customerId || customerId <= 0) return [];
      return [
        bankDetailLine(bankAccount, "debit", amt, desc),
        customerLine(customerId, "credit", amt, desc),
      ];
    case "refund_customer":
      if (!customerId || customerId <= 0) return [];
      return [
        customerLine(customerId, "debit", amt, desc),
        bankDetailLine(bankAccount, "credit", amt, desc),
      ];
    case "pay_supplier":
      if (!supplierId || supplierId <= 0) return [];
      return [
        supplierLine(supplierId, "debit", amt, desc),
        bankDetailLine(bankAccount, "credit", amt, desc),
      ];
    case "receive_supplier":
      if (!supplierId || supplierId <= 0) return [];
      return [
        bankDetailLine(bankAccount, "debit", amt, desc),
        supplierLine(supplierId, "credit", amt, desc),
      ];
    case "transfer":
      if (!transferToAccount) return [];
      return [
        bankDetailLine(transferToAccount, "debit", amt, desc),
        bankDetailLine(bankAccount, "credit", amt, desc),
      ];
    default:
      return [];
  }
}

export function buildPaymentTransactionRequest(params: {
  paymentType: PaymentTransactionType;
  transactionDate: string;
  title: string;
  description?: string;
  referenceNo?: string;
  amount: number;
  bankAccount: BankAccountDropdown;
  transferToAccount?: BankAccountDropdown;
  customerId?: number;
  supplierId?: number;
  createdBy?: number | null;
}): CreateTransactionRequest {
  const lineDescription = params.description?.trim() || params.title.trim();
  const details = buildPaymentTransactionDetails({
    paymentType: params.paymentType,
    amount: params.amount,
    bankAccount: params.bankAccount,
    transferToAccount: params.transferToAccount,
    customerId: params.customerId,
    supplierId: params.supplierId,
    lineDescription,
  });

  return {
    transactionDate: params.transactionDate,
    title: params.title.trim(),
    description: params.description?.trim() || undefined,
    referenceNo: params.referenceNo?.trim() || undefined,
    status: "Completed",
    createdBy: params.createdBy ?? null,
    transactionDetails: details,
  };
}

export function validatePaymentForm(params: {
  paymentType: PaymentTransactionType;
  amount: number;
  bankAccountId: number;
  transferToAccountId?: number;
  customerId?: number;
  supplierId?: number;
  title: string;
  transactionDate: string;
}): string | null {
  if (!params.transactionDate) return "Transaction date is required.";
  if (!params.title.trim()) return "Transaction title is required.";
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return "Enter an amount greater than zero.";
  }
  if (params.bankAccountId <= 0) {
    return params.paymentType === "transfer"
      ? "Select the account to transfer from."
      : "Select a bank or cash account.";
  }

  switch (params.paymentType) {
    case "collect_customer":
    case "refund_customer":
      if (!params.customerId || params.customerId <= 0) return "Select a customer.";
      break;
    case "pay_supplier":
    case "receive_supplier":
      if (!params.supplierId || params.supplierId <= 0) return "Select a supplier.";
      break;
    case "transfer":
      if (!params.transferToAccountId || params.transferToAccountId <= 0) {
        return "Select the account to transfer to.";
      }
      if (params.transferToAccountId === params.bankAccountId) {
        return "From and to accounts must be different.";
      }
      break;
    default:
      break;
  }

  return null;
}
