> Yangi ketma-ket yo‘riqnoma: [ULASH-QADAMLARI.md](ULASH-QADAMLARI.md). Arizalar endi Bishkek vaqti bo‘yicha YYYY-MM-DD kunlik varaqlarga ham yoziladi, forma tartibidagi ustunlar va filtr bilan. Umumiy Leads saqlanadi. Google Code.gsni yangilab, deploymentning yangi versiyasini chiqaring.

# Qaysi faylning qaysi joyiga ma’lumot yoziladi?

## 1. Telegram va Google Sheets ma’lumotlarini kodga kiritish

ZIPdagi `google-apps-script/PrivateSettings.example.gs` — siz to‘ldiradigan kod namunasi.

1. Google jadvalingiz → Extensions → Apps Script.
2. U yerdagi `Code.gs`ga ZIPdagi `google-apps-script/Code.gs`ning butun kodini qo‘ying.
3. Chapda **+ → Script** bosing, yangi faylga **PrivateSettings** deb nom bering.
4. `PrivateSettings.example.gs` mazmunini o‘sha yangi faylga qo‘ying.
5. Quyidagi to‘rtta bo‘sh qo‘shtirnoq orasini to‘ldiring:

```javascript
var PRIVATE_SETTINGS = {
  TELEGRAM_BOT_TOKEN: '', // Shu yerga YANGI bot tokeni
  TELEGRAM_CHAT_IDS: '', // Shu yerga chat ID; bir nechta bo‘lsa vergul bilan
  SPREADSHEET_ID: '', // Jadval URLidagi /d/ va /edit orasidagi ID
  APPS_SCRIPT_SECRET: '' // O‘zingiz yaratgan kamida 32 belgilik maxfiy kalit
};
```

Bu kod **Google Apps Script’dagi yopiq loyiha ichida** turadi, sayt HTMLida emas. Bot tokenini GitHubga yuklamang. Bo‘sh namunani GitHubga yuklash mumkin; to‘ldirilganini mumkin emas. Lokal to‘ldirilgan nusxa `PrivateSettings.gs` deb nomlansa `.gitignore` uni chetlatadi.

Eski token ochiq faylda bo‘lgan: avval BotFather orqali uni bekor qilib yangilang. Botga Start bosing, chat IDni tekshiring. Xususiy Google jadvalni hammaga ochish kerak emas.

Apps Script’da **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone**. Nusxalangan `/exec` bilan tugagan havola keyingi bosqichga kerak. So‘rovni maxfiy imzo tekshiradi; oddiy tashrifchi jadvalga yozolmaydi.

## 2. Sayt serveri sozlamalari

GitHubga ulangan Vercel loyihasi uchun quyidagi qiymatlar **Vercel → Settings → Environment Variables**ga yoziladi:

```dotenv
SITE_ORIGIN=https://fazliddinads.vercel.app
APPS_SCRIPT_URL=GOOGLE_APPS_SCRIPT_DAN_OLINGAN_EXEC_HAVOLA
APPS_SCRIPT_SECRET=PRIVATE_SETTINGS_DAGI_BILAN_BIR_XIL_KALIT
UPSTASH_REDIS_REST_URL=UPSTASH_REST_URL
UPSTASH_REDIS_REST_TOKEN=UPSTASH_REST_TOKEN
```

Mahalliy sinov uchun ZIPdagi `.env.example`dan `.env.local` nusxa yarating va shu qiymatlarni `=`dan keyin yozing. `vercel dev` shu lokal sinov uchun ishlatiladi; oddiy HTMLni ikki marta bosib ochish backendni ishga tushirmaydi. `.env.local` GitHubga ketmaydi. Shu sabab GitHubdan internetga deploy qilganda Vercel Environment Variables ham baribir kerak.

Upstash Redis — spam cheklovi uchun. REST URL va yozishga ruxsatli REST token Upstash konsolidan olinadi. Kod bu sozlamalarsiz ariza qabul qilishni yoqmaydi.

## 3. Ishga tushirish

- Toza ZIPni oching, bo‘sh konfiguratsiya namunalari bilan GitHubga yuklang.
- Vercelda shu repositoryni import qiling; Framework: Other. `vercel.json`dagi build/output sozlamalari ishlatiladi.
- Environment qiymatlarini kiritgach Redeploy qiling.
- Saytdan bitta test ariza yuboring: `Leads` jadvali → Telegram status `sent` → bot xabari.

Ariza avval Sheetsga saqlanadi, keyin Telegramga yuboriladi. Telegram xatosida qator yo‘qolmaydi, `failed` yoki `pending` ko‘rinadi. Bu holat uchun avtomatik xabar qayta yuborish hali yo‘q.

Oldingi paketni ulagan bo‘lsangiz `Code.gs`ni ham almashtiring va **Manage deployments → Edit → New version → Deploy** qiling. Server va sahifani birga yangilang: yangi arizada tanlangan tarif yuboriladi.

Kod va testlar tayyor. Haqiqiy token/IDlar hali kiritilmagan; sizning hisoblaringizda jonli qabul qilish sinovi bajarilmagan. Metateglar va ulashish rasmi tayyor, Meta Pixel ID berilmagani uchun Pixel ulanmagan. Batafsil: `README.md`.
