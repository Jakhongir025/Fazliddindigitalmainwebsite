# Fazliddin Digital — GitHub va Vercel uchun loyiha

Birinchi tashrifda sayt **KGZ (Кыргызча)** tilida ochiladi. Tanlangan UZ/KGZ/RU tili shu brauzerda eslab qolinadi va refreshdan keyin tiklanadi. Har yangi sahifa yuklanishida statistik animatsiya qayta boshlanadi. Brauzer saqlashni taqiqlasa, til tanlash ishlaydi, ammo keyingi yuklanishda KGZ qaytadi. Boshlang‘ich HTML ham qirg‘izcha: JavaScript ishga tushguncha boshqa til chaqnab ko‘rinmaydi. Brend rasmlari, rangli kontakt ikonlari, yumaloq burchaklar, `4 жыл`ning bir qatorda turishi va statistik blok animatsiyasi saqlangan.

## Paketdagi tayyor ishlar

- `index.html`, `img/`, `icons/`: sayt.
- `api/config.js`: faqat forma yoqilgan/yoqilmaganini bildiradi, sirlarni qaytarmaydi.
- `api/leads.js`, `lib/leads.js`: Vercel server funksiyasi; server validatsiyasi, origin tekshiruvi, Upstash rate limit va imzolangan so‘rov.
- `google-apps-script/Code.gs`: arizani Google Sheetsga saqlaydi, keyin Telegramga jo‘natadi.
- `.env.example`: **bo‘sh namuna**, haqiqiy kalit emas.
- `.gitignore`, `.githooks/pre-commit`, maxfiy ma’lumot tekshiruvi va GitHub tekshiruvi.
- `vercel.json`, `scripts/build.js`: tashqi foydalanuvchiga faqat `public/` ichidagi sayt fayllarini beradi; server kodi `/api` orqali bajariladi.
- `tests/`: tashqi xabar yubormaydigan 10 ta avtomatlashtirilgan tekshiruv.

**Holat:** kod tayyor, ammo sizning Google/Vercel/Telegram hisoblaringizga ulangan emas. Haqiqiy yangi tokenlar paketda yo‘q. Quyidagi sozlashni bajargandan keyin yakuniy real ariza sinovi kerak. Oddiy GitHub Pages server funksiyasini bajarmaydi; repositoryni Vercelga ulang.

## 1. Avval oshkor bo‘lgan tokenni bekor qiling

Asl HTMLda token ochiq bo‘lgan. Telegramdagi rasmiy **@BotFather** orqali eski tokenni revoke qiling va yangisini oling. Eski faylni almashtirish yoki repositoryni private qilish tokenni bekor qilmaydi.

Yangi tokenni chatga, screenshotga, HTMLga yoki GitHub fayliga yozmang. Ushbu loyihada u faqat yopiq Apps Script loyihasiga kiritiladi: `PrivateSettings` kod fayli orqali yoki **Project Settings → Script Properties** orqali. Eng qisqa kodga kiritish yo‘li `BOSHLASH.md`da.

## 2. Google Sheets va Apps Script

1. Alohida, **Restricted** ulashish holatidagi Google Sheet yarating. “Anyone with the link” qilib ochmang.
2. Jadval URLidagi `/d/` va `/edit` orasidagi qism — `SPREADSHEET_ID`. Oddiy tahrirlash URLi API endpoint emas.
3. Jadvalda **Extensions → Apps Script**ni oching.
4. Paketdagi `google-apps-script/Code.gs` mazmunini `Code.gs`ga to‘liq qo‘ying va saqlang.
5. `BOSHLASH.md`dagi `PrivateSettings` kod faylini to‘ldiring. Muqobil usul sifatida **Project Settings → Script Properties**da quyidagilarni yaratishingiz mumkin:

| Property | Qiymat qayerdan olinadi? |
|---|---|
| `SPREADSHEET_ID` | O‘zingiz yaratgan jadval URLidan ID |
| `APPS_SCRIPT_SECRET` | Kamida 32 belgilik yangi tasodifiy maxfiy qiymat; Verceldagi qiymat bilan aynan bir xil |
| `TELEGRAM_BOT_TOKEN` | BotFather bergan **yangi** token |
| `TELEGRAM_CHAT_IDS` | Bir yoki bir nechta chat ID: masalan `123456789,-1001234567890`; bo‘shliqsiz, vergul bilan |

Maxfiy qiymatni parol menejeri bilan yarating. Yoki o‘z terminalingizda `openssl rand -hex 32` ishlating va natijani faqat ikkala servisning maxfiy sozlamalariga saqlang. Natijani GitHubga qo‘ymang.

6. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone**. Google so‘ragan ruxsatlarni faqat o‘zingiz yaratgan kod uchun tasdiqlang. Agar Workspace siyosati bunga yo‘l qo‘ymasa, administrator kerak bo‘ladi; cheklovni chetlab o‘tmang.
7. Olingan `https://script.google.com/macros/s/.../exec` URLni oling. Bu Verceldagi `APPS_SCRIPT_URL`. `/dev` yoki Google Sheets `/edit` URLini ishlatmang.

“Anyone” faqat web endpointni ochadi: kiritish kod tomonidan HMAC-SHA256 imzo va 5 daqiqalik vaqt oynasi bilan tekshiriladi. Jadval ommaviy bo‘lmaydi. Scriptni tahrirlovchilarga Script Properties ham ochiq bo‘lishi mumkin; ularga kirishni cheklang.

**Kod yangilanganda:** Apps Script’da saqlashning o‘zi mavjud deploymentni yangilamaydi. Deploy → Manage deployments → Edit → New version → Deploy.

## 3. Telegram chat IDni aniqlash

1. Botga o‘zingiz **Start** bosing. Guruhga yuborilsa botni o‘sha guruhga qo‘shing va xabar yozing; botning yozish ruxsati bo‘lsin.
2. Telegram Bot API `getUpdates` javobidagi `message.chat.id` kerak. Bu bot username’i yoki `t.me/...` havolasi emas.
3. Tokenni URLga qo‘yib brauzer tarixida qoldirmaslik uchun quyidagi buyruqni **o‘z kompyuteringizda** ishlatishingiz mumkin. Token ko‘rinmaydigan kiritish orqali olinadi, saqlanmaydi; faqat chat IDlar chiqariladi:

```python
import getpass, json, urllib.request
secret = getpass.getpass('Yangi bot tokeni: ')
request = urllib.request.Request(
    'https://api.telegram.org/bot' + secret + '/getUpdates',
    data=b'', method='POST')
try:
    with urllib.request.urlopen(request, timeout=15) as response:
        data = json.load(response)
    for update in data.get('result', []):
        message = update.get('message') or update.get('channel_post') or {}
        if 'chat' in message:
            print(message['chat']['id'])
except Exception:
    print('Olinmadi. Token, botga yuborilgan xabar va ulanishni tekshiring.')
```

Agar botda mavjud webhook bo‘lsa `getUpdates` mos kelmasligi mumkin. Ishlayotgan webhookni bu loyiha uchun o‘zboshimchalik bilan o‘chirmang; shu maqsadga alohida bot ishlating yoki mavjud administrator bilan chat IDni oling.

Bir nechta chat kiritilsa kod har biriga alohida `sendMessage` jo‘natadi. Xabar plain text: foydalanuvchi matni Markdown/HTML sifatida talqin qilinmaydi.

## 4. Spam cheklovi uchun Upstash Redis

Upstashda Redis database yarating. Konsoldagi **REST URL** va **REST TOKEN**ni oling; read-only token emas, yozishga ruxsatli token kerak. Ular faqat Vercel environmentda turadi.

Kod bir IPga 10 daqiqada 5, sayt bo‘yicha 10 daqiqada 100 so‘rov chegarasini qo‘llaydi. IP xom holda Redisga yozilmaydi, server maxfiy kaliti bilan HMAC qilinadi. Kalitlar 10 daqiqada tugaydi. Bu cheklov CAPTCHA emas va taqsimlangan hujumlarning hammasini to‘xtatmaydi; katta trafikda Vercel Firewall qo‘shing. Upstash ishlamasa yuborish rad etiladi, himoya chetlab o‘tilmaydi. Servis tarif va kvotalarini o‘zingiz tanlang.

## 5. GitHubga xavfsiz yuklash

ZIPni yangi toza papkaga to‘liq oching. Eski tokenli `index.html`, backup, `.env` yoki eski repository tarixini shu papkaga qo‘shmang. GitHubga loyihaning ildizidagi fayllar, jumladan yashirin `.gitignore`, `.github/` va `.githooks/` ham yuklanishi kerak.

Lokal Git ishlatsangiz, birinchi commitdan **oldin**:

```sh
npm run check:secrets
npm test
npm run build
git config core.hooksPath .githooks
git status --short
```

`git config` repository yaratilgandan keyin ishlaydi. `.githooks/pre-commit` har commit oldidan tekshiruvni bajaradi; `--no-verify` bilan chetlab o‘tmang. GitHub workflow ham tekshiradi, lekin u pushdan **keyin** ishlaydi: allaqachon yuklangan sirni qaytarib yashirmaydi.

`.gitignore` `.env*`, private keylar, `.vercel`, backup va build fayllarini chetlatadi; `.env.example` esa bo‘sh namuna sifatida qoladi. `.gitignore` avval commit qilingan faylni tarixdan olib tashlamaydi, GitHub’ning qo‘lda upload interfeysini ham nazorat qilmaydi. Eski tarixda token bo‘lsa avval revoke qiling, keyin GitHub’ning sensitive-data removal yo‘riqnomasi bo‘yicha tarixni alohida tozalang. Bu paket eski repository tarixini o‘zgartirmaydi.

Tekshiruvchi ma’lum token/private-key formatlarini va Gitga qo‘shilgan `.env` fayllarini aniqlaydi. Har qanday maxfiy satrni aniqlashga kafolat bermaydi. Commit diffini ko‘rib chiqing; hisobingizda mavjud bo‘lsa GitHub secret scanning/push protectionni yoqing.

## 6. Vercelga ulash

1. Vercel → Add New Project → toza GitHub repositoryni import qiling.
2. Framework: **Other**. Root Directory — `package.json`, `api/`, `index.html` turgan papka. Build Command `npm run build`, Output Directory `public`; `vercel.json`da yozilgan.
3. Node.js 22.x ishlatiladi. NPM paket dependencylari yo‘q.
4. **Settings → Environment Variables**da quyidagilarni Production uchun qo‘shing. Agar sensitive/private belgisi bo‘lsa undan foydalaning:

| Vercel o‘zgaruvchisi | Qiymat |
|---|---|
| `SITE_ORIGIN` | `https://fazliddinads.vercel.app` yoki amaldagi domen, oxirida `/`siz |
| `APPS_SCRIPT_URL` | Apps Script Web app `/exec` URLi |
| `APPS_SCRIPT_SECRET` | Apps Script’dagi bilan aynan bir xil tasodifiy maxfiy qiymat |
| `UPSTASH_REDIS_REST_URL` | Upstash konsolidagi HTTPS REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

`NEXT_PUBLIC_`, `VITE_` yoki boshqa public prefiks qo‘shmang. Bot tokeni Vercelga kerak emas — u Apps Script’da. `SPREADSHEET_ID` ham faqat Apps Script’da.

Preview deploymentlarga production sirlarini avtomatik bermang. `SITE_ORIGIN` faqat bitta aniq originni qabul qiladi; previewni tekshirish uchun alohida sozlamalar va test jadvali ishlating.

5. Deploy/Redeploy qiling. Environment o‘zgarishi mavjud deploymentga avtomatik qo‘llanmasligi mumkin.
6. `/api/config` faqat `{"enabled":true}` yoki `{"enabled":false}` qaytaradi. `true` Verceldagi kerakli sozlamalar mavjudligini bildiradi; Google/Telegramning amalda ishlashini tasdiqlamaydi.

## 7. Birinchi real tekshiruv

Sozlashdan keyin o‘zingizga tegishli test ma’lumot bilan **bitta** ariza yuboring:

- Birinchi tashrifda KGZ ochiladi; UZ/RU tanlangach refreshda tanlov saqlanadi.
- Ariza `Leads` varag‘ida paydo bo‘ladi; ustunlar kod tomonidan yaratiladi.
- `Telegram status` har manzil uchun `sent` bo‘ladi.
- Bot kerakli chatga keladi; boshqa chatga bormaydi.
- Muvaffaqiyat xabari jadvalga saqlash tasdiqlangandan keyin chiqadi.

Telegram ishlamasa lead baribir jadvalda qoladi. `failed` yoki `pending` qatorlarni tekshiring. Hozir avtomatik Telegram qayta yuborish/navbat tizimi yo‘q: dublikat xabarlar bo‘lmasligi uchun bir request ID qayta yuborilganda Telegram takrorlanmaydi. Jadval sizning asosiy ariza manbangiz bo‘lib qoladi.

Timeout bo‘lsa brauzer matnlarni saqlab qoladi. Xuddi shu forma qiymatlari bilan qayta urinish bir xil request IDni ishlatadi; Sheets uni dublikat deb aniqlaydi. Sahifa yangilansa yoki qiymatlar o‘zgarsa yangi ID bo‘ladi. Hech qanday shaxsiy ma’lumot localStoragega yozilmaydi.

| Muammo | Tekshiring |
|---|---|
| Forma o‘chiq | `/api/config`, beshta Vercel environment qiymati, redeploy |
| 403 | `SITE_ORIGIN` bilan ochilgan domen aynan bir xilmi? |
| 429 | Limit; 10 daqiqa kuting |
| 503 | Upstash qiymatlari, Apps Script `/exec`, ikki tomondagi secret, Script Properties, Google ruxsatlari |
| Sheets bor, Telegram yo‘q | Chat ID, botga Start, guruh ruxsati, yangi token, `Telegram status` |
| Google login HTMLi qaytyapti | Web app access va deployment URLi |

## Xavfsizlik va cheklovlar

Server 8 KB body, maydon uzunligi, kontakt formati va xizmat/til allowlistini tekshiradi. Brauzer serverga JSON POST yuboradi. Google so‘rovi body ichida imzolanadi; shaxsiy ma’lumot query URLga yozilmaydi. Sheetsga foydalanuvchi matni literal sifatida yoziladi, formula-injectionga qarshi apostrof bilan himoyalangan. Request ID + payload hash takroriy/qarama-qarshi yuborishni nazorat qiladi.

API xatolari token, URL yoki foydalanuvchi matnini logga chiqarmaydi. HTTPS, CSP, nosniff, frame himoyasi va maxfiy fayllarni statik outputdan ajratish mavjud. Origin tekshiruvi spam-bot uchun autentifikatsiya emas; rate limit qo‘shimcha himoya.

Google Apps Script kvotalari, Telegram cheklovlari va Vercel/Upstash mavjudligi real ishlashga ta’sir qiladi. O‘nta test servislar o‘rnini bosuvchi mocklar bilan bajarilgan; hisoblaringizda real end-to-end test hali bajarilmagan.

## Kontentni tahrirlash

Ochiq `t.me`, `wa.me`, `tel:` va Instagram havolalari mijozlar ko‘rishi uchun kerak; ular sir emas va HTMLda qoladi. Bot tokeni, chat IDlari, jadval IDsi va integratsiya kalitlari ularning o‘rniga qo‘yilmaydi.

Inline JSni tahrirlasangiz CSP hashni yangilang:

```sh
node scripts/update-csp.js
npm run build
```

Brend va kontakt rasmlari `img/` va `icons/` bilan birga ko‘chiriladi. Flaticon manba/attribution havolalari saqlansin; tegishli ikon litsenziyalari amal qiladi. Dastlabki vizual audit `AUDIT.md`da, uning backend yo‘q degan bandlari oldingi variantga tegishli.

Rasmiy manbalar: [Vercel Node.js](https://vercel.com/docs/functions/runtimes/node-js), [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web), [Telegram Bot API](https://core.telegram.org/bots/api), [Upstash REST API](https://upstash.com/docs/redis/features/restapi), [GitHub sensitive data removal](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Target tariflari va Instagram uchun metateglar

Endi yagona xizmat — Instagram/Facebook target reklamasi. Tariflar: **Start $250**, **Business $350**, **Premium $650**. Har kartada xizmat tarkibi bor. Narxlarda to‘lov davri ko‘rsatilmagan; oylik deb taxmin qilinmagan. Narx va matnlar uchala tilda mos ko‘rinadi.

Forma `service: "targeting"` va `plan: "start" | "business" | "premium"` yuboradi. Server boshqa xizmat yoki noma’lum tarifni rad etadi. Google Sheetsning 11-ustunida `Tariff` yoziladi; avvalgi 10 ustun joyi o‘zgarmaydi. Telegram xabarida tarif alohida qatorga chiqadi.

**Eski backendni avval ulagan bo‘lsangiz:** bu paketdagi `google-apps-script/Code.gs`ni ham yangilang va Apps Script’da **New version → Deploy** qiling; Vercel loyihasini ham yangilang. Faqat HTMLni almashtirish yetmaydi.

`<head>` ichida targetga mos title/description, canonical, robots, Open Graph, Twitter card, rasm o‘lchami va alt matni bor. `img/og-target.jpg` — 1200×630 ulashish rasmi. Metama’lumotlar boshlang‘ich HTMLda mavjud; crawler JavaScript bajarishi talab qilinmaydi. Brauzerda tanlangan tilga qarab title va description yangilanadi; ijtimoiy preview uchun asosiy til KGZ.

Hozir canonical, `og:url` va rasm URLi **https://fazliddinads.vercel.app/** domeniga mos. Domen o‘zgarsa shu URLlarni HTMLda ham yangilang. Saytni joylashtirgandan keyin rasm URLi ommaga HTTP 200 bilan ochilishi kerak. [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) orqali live URLni tekshirib, kerak bo‘lsa cached previewni yangilang. Instagram reklamasidagi yakuniy kreativ va preview joylashuvga ham bog‘liq; metateglar barcha joyda rasm ko‘rinishiga kafolat bermaydi.

**Meta Pixel / Conversions API ulanmagan.** Metateglar konversiya o‘lchovi o‘rnini bosmaydi. Pixel ID, rozilik talablari va kuzatiladigan voqealar aniqlangach alohida ulanadi. `Lead` voqeasini tugma bosilishida emas, server `ok:true` deb saqlashni tasdiqlaganidan keyin jo‘natish kerak. Hozir sayt Meta’ga tashrifchi ma’lumotlarini yubormaydi.

Open Graph maydonlari: [rasmiy Open Graph protokoli](https://ogp.me/).

## 2026-09-26 rasm bo‘yicha yakuniy yangilanish

Start: xizmat $250, reklama budjeti $150–300. Business: xizmat $350, reklama budjeti $300–700. Premium: xizmat $650, reklama budjeti $800+. Xizmat tarkibi berilgan rasmning o‘qiladigan qismlaridan kiritildi. Premium ichidagi Google/YouTube va CRM alohida xizmat kartasi emas, shu tarif tarkibi. Rasm pastidagi oxirgi bandlar to‘liq ko‘rinmagani uchun 24/7 javob vaqti kabi tugallanmagan va’dalar qo‘shilmadi.

Qo‘lda kodga kiritish: `google-apps-script/PrivateSettings.example.gs`ni Google Apps Script ichidagi yangi `PrivateSettings` fayliga ko‘chiring. To‘ldirilgan mahalliy nusxa `PrivateSettings.gs` deb nomlanadi va Gitdan chetlatilgan. Gitga qo‘shilgan shunday fayl tekshiruvda rad etiladi. Hech bir tokenni `index.html`ga qo‘ymang.
