/** SMS sender behind an interface so the Iranian provider can be swapped (or faked in tests). */
export interface SmsProvider {
  /** Codes reach the player's phone (false: only printed to the log). */
  readonly real: boolean;
  sendOtp(phone: string, code: string): Promise<void>;
}

/** Development/test provider: prints the code to the server log. */
export class ConsoleSms implements SmsProvider {
  readonly real = false;
  sent: { phone: string; code: string }[] = [];
  async sendOtp(phone: string, code: string) {
    this.sent.push({ phone, code });
    console.log(`[sms] OTP for ${phone}: ${code}`);
  }
}

/** Kavenegar "verify lookup" (template-based OTP). Configure KAVENEGAR_KEY and KAVENEGAR_TEMPLATE. */
export class KavenegarSms implements SmsProvider {
  readonly real = true;
  constructor(
    private key: string,
    private template: string,
  ) {}
  async sendOtp(phone: string, code: string) {
    const url =
      `https://api.kavenegar.com/v1/${encodeURIComponent(this.key)}/verify/lookup.json` +
      `?receptor=0${phone.slice(2)}&token=${code}&template=${encodeURIComponent(this.template)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`kavenegar ${r.status}`);
  }
}
