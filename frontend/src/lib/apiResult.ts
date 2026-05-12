/**
 * Many backends return HTTP 200 with `{ success: false, message, errors }`.
 * Axios resolves those as success unless we inspect the envelope.
 */
export function getApiErrorMessage(body: {
  success?: boolean;
  message?: string;
  errors?: string[] | null;
}): string | null {
  if (body == null || typeof body !== "object") return null;
  if (body.success !== false) return null;
  const errList = body.errors?.filter((e): e is string => Boolean(e && String(e).trim()));
  if (errList?.length) return errList.join(", ");
  const msg = typeof body.message === "string" ? body.message.trim() : "";
  return msg || "Request failed";
}
