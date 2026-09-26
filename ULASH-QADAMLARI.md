# Google Sheets va Telegramni ulash — ketma-ket yo‘riqnoma

## 1. Telegram bot yarating

1. Telegramda rasmiy **@BotFather**ni oching va `/newbot` yuboring.
2. Bot nomi va username tanlang. Berilgan **tokenni maxfiy saqlang**. Oldingi token ochiq kodga joylangan bo‘lsa, BotFather orqali uni bekor qilib yangi token oling.
3. Yaratilgan botingizni ochib **Start** bosing va biror xabar yuboring.
4. O‘z brauzeringizda `https://api.telegram.org/bot<TOKEN>/getUpdates` manzilida `<TOKEN>` o‘rniga tokenni yozing. Javobdagi `message.chat.id` sonini oling. Bu sizning **TELEGRAM_CHAT_IDS** qiymatingiz. Tokenli manzilni hech kimga yubormang, skrinshotga olmang; ish tugagach brauzer tarixidan o‘chiring.
5. Guruhga xabar olish uchun botni guruhga qo‘shing va guruhdan botga `/start@bot_username` yuboring; shu guruhning `chat.id` qiymatini oling. Guruh IDsi odatda manfiy son. Bir nechta chat kerak bo‘lsa IDlarni vergul bilan yozasiz.

`getUpdates` bo‘sh chiqsa botga yangi xabar yuboring. Bot boshqa tizimning webhookiga ulangan bo‘lsa, bu sayt uchun alohida bot yarating; mavjud integratsiyani o‘chirmang.

## 2. Google jadval yarating

1. Google Sheetsda yangi, bo‘sh jadval yarating: masalan **Fazliddin — Arizalar**.
2. Jadval havolasidagi `/d/` va keyingi `/` orasidagi qiymatni nusxalang — bu **SPREADSHEET_ID**.
3. Jadvalni internetga ochiq qilish shart emas. Faqat ishonchli hamkorlarga kirish bering.
4. **Extensions → Apps Script**ni oching.

## 3. ZIPdagi kodni Google Apps Scriptga qo‘ying

1. Apps Script ichidagi `Code.gs` mazmunini ZIPdagi `google-apps-script/Code.gs` bilan to‘liq almashtiring.
2. Chapdagi **+ → Script** orqali **PrivateSettings** nomli fayl yarating.
3. ZIPdagi `google-apps-script/PrivateSettings.example.gs` mazmunini unga ko‘chiring.
4. Aynan shu **Google ichidagi PrivateSettings** faylida qo‘shtirnoqlar orasini to‘ldiring:

| Maydon | Nima yoziladi |
|---|---|
| TELEGRAM_BOT_TOKEN | BotFather bergan yangi token |
| TELEGRAM_CHAT_IDS | Telegram chat ID, masalan bitta son; bir nechtasi vergul bilan |
| SPREADSHEET_ID | Google jadvalning IDsi |
| APPS_SCRIPT_SECRET | Parol menejerida yaratilgan tasodifiy kamida 32 belgili maxfiy kalit |
| SHEET_TIMEZONE | `Asia/Bishkek` — o‘zgarishsiz qoldiring |

Bu ma’lumotlar `index.html`ga yozilmaydi. To‘ldirilgan PrivateSettings faylini GitHubga yuklamang. GitHubga faqat bo‘sh namuna ketadi. Jadval/Apps Script muharrirlari maxfiy sozlamalarni ko‘rishi mumkin.

## 4. Google kodini ishga chiqaring

1. **Save → Deploy → New deployment**.
2. Turini **Web app** tanlang.
3. **Execute as: Me**, **Who has access: Anyone**.
4. **Deploy**ni bosing va o‘zingiz yaratgan loyiha so‘ragan Google ruxsatlarini tasdiqlang.
5. `/exec` bilan tugagan **Web app URL**ni nusxalang. `/dev` havolasini olmang.

Tashqaridan kelgan yozish so‘rovlari maxfiy kalit bilan imzosi tekshirilgandan keyin qabul qilinadi. Havolani oddiy ochishda `{"ok":false}` chiqishi normal. Apps Script muharririda `doPost`ni Run qilish orqali sinamang: unga saytdan so‘rov kelishi kerak.

Tashkilot hisobida “Anyone” taqiqlangan bo‘lsa, administratorga murojaat qiling.

## 5. Spam cheklovi uchun Upstash Redis yarating

1. Upstash konsolida Redis bazasi yarating.
2. Baza sahifasidan **REST URL** va **REST Token**ni oling. Faqat o‘qish tokeni emas, yozishga ruxsatli token kerak.
3. Ularni quyidagi Vercel sozlamalariga qo‘yasiz. Bu sozlamalarsiz forma ariza qabul qilishni yoqmaydi.

## 6. GitHub va Vercelni ulang

1. Yangilangan ZIPni oching va loyihaning ichidagi fayllarni GitHub repositoryga yuklang. `package.json`, `vercel.json`, `api` va `index.html` repositoryning loyiha ildizida bo‘lsin.
2. To‘ldirilgan maxfiy fayllar, `.env.local` va ZIP arxivlarini GitHubga yuklamang.
3. Vercelda **Add New → Project** orqali repositoryni import qiling. Framework **Other**. Build va output sozlamalari `vercel.json`da tayyor.
4. **Settings → Environment Variables**da quyidagilarni kiriting, kamida **Production** muhitini tanlang:

| Nom | Qiymat |
|---|---|
| SITE_ORIGIN | `https://fazliddinads.vercel.app` — oxirida `/`siz; domen o‘zgarsa yangisini yozing |
| APPS_SCRIPT_URL | 4-qadamdagi `/exec` havola |
| APPS_SCRIPT_SECRET | Google PrivateSettingsdagi kalitning aynan o‘zi |
| UPSTASH_REDIS_REST_URL | Upstash REST URL |
| UPSTASH_REDIS_REST_TOKEN | Upstash REST token |

5. **Deploy / Redeploy** qiling. Muhit qiymatlarini keyin o‘zgartirsangiz ham yangi deployment kerak.

## 7. Bitta sinov ariza yuboring

1. Internetdagi saytingizni oching, tarifni tanlang va o‘zingizning ma’lumotlaringiz bilan test ariza yuboring.
2. Google Sheetsda **Leads** umumiy ro‘yxati hamda shu kunning **YYYY-MM-DD** varag‘i paydo bo‘ladi.
3. Kunlik varaq ustunlari: **Ism → Telefon / Telegram → Tarif → Biznes yo‘nalishi → Xabar → Sana → Vaqt → Til → Telegram holati → Ariza ID**.
4. Sana va vaqt mijoz qurilmasidan emas, server arizani qabul qilgan paytdan, **Bishkek vaqti** bo‘yicha olinadi. Bo‘sh kunlarga varaq ochilmaydi; birinchi ariza kelganda ochiladi.
5. Sarlavha qatori qotirilgan; ustundagi filtr orqali tarif/biznesni tanlang yoki vaqt bo‘yicha saralang. Telefon va mijoz matni formula sifatida bajarilmaydi.
6. Telegramda ariza, tanlangan tarif va narx kelishini tekshiring. Jadvaldagi holat `chat 1: sent` bo‘lishi kerak.

`Leads` xizmat ro‘yxatini va ustun tartibini saqlang: takroriy arizalarni aniqlash unga tayanadi. Kunlik varaqlar saralash uchun. Oldingi arizalar avtomatik ko‘chirilmaydi; bu tartib yangi arizalarga qo‘llanadi. Bir xil ariza qayta yuborilsa, takroriy qator va xabar yaratilmaydi.

Telegramda `failed` bo‘lsa token, chat ID va botga Start bosilganini tekshiring. Ariza Sheetsda qoladi. `pending` — yuborish yoki holatni yozish yakunlanmagan bo‘lishi mumkin; botda xabar borligini tekshiring. Avtomatik qayta yuborish yo‘q.

## Oldin ulagan bo‘lsangiz

Google Apps Scriptdagi **Code.gs**ni yangilang → **Deploy → Manage deployments → Edit → Version: New version → Deploy**. Shu deploymentni yangilasangiz `/exec` manzili saqlanadi. Yangi deployment ochsangiz yangi havolani Vercelga kiriting va Redeploy qiling. PrivateSettingsdagi mavjud maxfiy qiymatlarni saqlang.

Kod avtomatik sinovlardan o‘tgan. Sizning haqiqiy Google va Telegram hisoblaringizga hali ulanmagan; yakuniy jonli tekshiruv 7-qadamda bajariladi.

Rasmiy yordam: [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web), [Telegram Bot API](https://core.telegram.org/bots/api#getupdates), [Vercel environment variables](https://vercel.com/docs/environment-variables).
