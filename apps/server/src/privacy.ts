import type { FastifyInstance } from 'fastify';

/** Persian privacy policy page, linked from the store listings (docs/RELEASE.md). */
const PAGE = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>حریم خصوصی چکاچک</title>
<style>body{font-family:Vazirmatn,Tahoma,sans-serif;max-width:640px;margin:0 auto;padding:16px;line-height:1.9;color:#1e293b;background:#fff}h1{font-size:1.4em}h2{font-size:1.1em;margin-top:1.4em}</style></head><body>
<h1>سیاست حریم خصوصی بازی چکاچک</h1>
<p>این صفحه توضیح می‌دهد بازی چکاچک چه اطلاعاتی از شما نگه می‌دارد و چرا.</p>
<h2>اطلاعاتی که ذخیره می‌کنیم</h2>
<ul>
<li>حساب بازی: یک شناسهٔ تصادفی، نام بازیکن و پیشرفت بازی (سکه، الماس، کارت‌ها، جام‌ها).</li>
<li>اگر شماره موبایل را وصل کنید: فقط شکل رمزنگاری‌شده (هش) شماره برای بازیابی حساب نگه داشته می‌شود.</li>
<li>آمار استفاده: رویدادهایی مثل شروع بازی، نتیجهٔ مسابقه و باز کردن صندوقچه، برای بهتر کردن بازی.</li>
<li>گزارش خطا: متن خطا و مدل گوشی، برای رفع اشکال.</li>
<li>خرید درون‌برنامه‌ای: شناسهٔ خرید فروشگاه برای تأیید خرید. اطلاعات بانکی شما هرگز به ما نمی‌رسد.</li>
</ul>
<h2>چه کاری نمی‌کنیم</h2>
<ul><li>اطلاعات شما را به هیچ شرکت یا شخص دیگری نمی‌فروشیم و نمی‌دهیم.</li>
<li>از سرویس‌های تبلیغاتی یا آماری خارجی استفاده نمی‌کنیم؛ همهٔ داده‌ها روی سرور خود بازی در ایران نگه داشته می‌شوند.</li>
<li>به مخاطبین، عکس‌ها، موقعیت مکانی یا میکروفون گوشی دسترسی نداریم.</li></ul>
<h2>سکه و الماس</h2>
<p>سکه و الماس فقط داخل بازی ارزش دارند و قابل تبدیل به پول نیستند. احتمال جوایز هر صندوقچه پیش از باز کردن در بازی نمایش داده می‌شود.</p>
<h2>حذف اطلاعات</h2>
<p>برای حذف حساب و اطلاعات خود از طریق صفحهٔ بازی در کافه‌بازار به ما پیام دهید.</p>
<p>آخرین به‌روزرسانی: آبان ۱۴۰۵</p>
</body></html>`;

export function privacyRoutes(app: FastifyInstance): void {
  app.get('/privacy', async (_req, reply) => reply.type('text/html; charset=utf-8').send(PAGE));
}
