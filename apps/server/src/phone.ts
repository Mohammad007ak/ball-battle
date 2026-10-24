import { createHmac } from 'node:crypto';

/** Normalize an Iranian mobile number to 989XXXXXXXXX, or null if it is not one. */
export function normalizePhone(raw: string): string | null {
  const d = raw
    .replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
    .replace(/[\s\-()+]/g, '');
  const m = /^(?:0098|98|0)?(9\d{9})$/.exec(d);
  return m ? '98' + m[1] : null;
}

/** Phones are stored only as a keyed hash; the raw number is needed just to send the SMS. */
export const phoneHash = (secret: string, phone: string) =>
  createHmac('sha256', secret)
    .update('phone:' + phone)
    .digest('hex');
