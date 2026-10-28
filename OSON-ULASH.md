# Google Sheets va Telegramni maxfiy ulash

## Google ichida bir marta sozlash

1. Kerakli Google Sheets jadvalini oching → Extensions → Apps Script.
2. Loyihadagi `google-apps-script/Code.gs`ni Google ichidagi `Code.gs`ga to‘liq ko‘chiring.
3. Apps Script → Project Settings → Script Properties bo‘limiga quyidagilarni kiriting:

| Property | Value |
|---|---|
| TELEGRAM_BOT_TOKEN | BotFather bergan haqiqiy token |
| TELEGRAM_CHAT_IDS | Xabar oladigan odamlarning shaxsiy raqamli IDlari, vergul bilan; ko‘pi bilan 5 kishi |
| SPREADSHEET_URL | Google Sheetsning to‘liq tahrirlash havolasi; kod aynan jadvalning Extensions menyusidan ochilgan bo‘lsa, bu maydonni kiritmasangiz ham bo‘ladi |

4. Saqlang. Muharrirdagi funksiya ro‘yxatidan `setupConnection`ni tanlab Run bosing va Google ruxsatlarini tasdiqlang. Bu amal Telegramga xabar yubormaydi. Jadval aniqlanadi, `SPREADSHEET_ID` hamda avval mavjud bo‘lmasa `APPS_SCRIPT_SECRET` avtomatik saqlanadi. Kod ichiga token yoki URL yozish kerak emas.
5. Project Settingsni yangilang. Yaratilgan `APPS_SCRIPT_SECRET`ni Vercelga aynan ko‘chiring. Bu maxfiy kalitni chatga yoki GitHubga yubormang.
6. Deploy → New deployment → Web app → Execute as Me → Who has access Anyone → Deploy. `/exec` manzilini oling. Avvalgi deployment bo‘lsa Manage deployments → Edit → New version → Deploy.

Telegramdagi har bir qabul qiluvchi avval botni ochib Start bosishi kerak. Bu Telegram xabari, telefon SMSi emas. Guruh/kanal IDlari qabul qilinmaydi. Mijoz formadan qabul qiluvchi IDni o‘zgartira olmaydi. Takroriy IDlar olib tashlanadi.

## Vercelda

Settings → Environment Variables → Production:

- `APPS_SCRIPT_URL`: Google deploymentning `/exec` havolasi.
- `APPS_SCRIPT_SECRET`: Google Script Propertiesdagi aynan bir xil kalit.
- `SITE_ORIGIN`: saytning haqiqiy HTTPS domeni. Vercelning avtomatik production domeni mavjud bo‘lsa, kiritilmaganda o‘sha ishlatiladi.
- `UPSTASH_REDIS_REST_URL` va `UPSTASH_REDIS_REST_TOKEN`: mavjud spam cheklovi uchun hali ham kerak. Oldin sozlangan bo‘lsa o‘zgartirmang; hali yo‘q bo‘lsa Upstash Redis konsolidan oling.

Saqlagach Redeploy qiling. Formadan test ariza yuboring: `Leads` va kunlik varaqda qator, faqat tanlangan odamlarda bot xabari paydo bo‘lishi kerak. Bot ishlamasa ariza Sheetsda qoladi, Telegram holati failed/pending bo‘ladi; avtomatik qayta yuborish yo‘q.

## GitHubga nimalar ketadi?

Faqat umumiy kod va bo‘sh namunalar. Haqiqiy Google Sheets havolasi, bot tokeni va shaxsiy IDlar faqat Google Script Propertiesda; server kalitlari faqat Vercelda. Apps Script loyihasi muharrirlariga faqat ishonchli odamlarga ruxsat bering.

Eski `PrivateSettings`dan foydalangan bo‘lsangiz uni Google ichida saqlash mumkin. Yangi Script Properties qiymatlari undan ustun turadi. To‘ldirilgan nusxani repositoryga qo‘ymang.

`npm run check:secrets` token, Sheets havolasi va kodga to‘g‘ridan-to‘g‘ri yozilgan Telegram IDlarini tekshiradi. `.gitignore` private fayllarni chetlatadi. Tekshiruv barcha ko‘rinishdagi sirlarni topishga kafolat bermaydi, Git tarixidagi oldingi nusxalarni ham tozalamaydi. Ilgari oshkor qilingan tokenni yangilang.

Animatsiyalar: hisoblagichlar tugagan kadrlarni tozalaydi, reduced-motion holatida darhol yakuniy raqamlarni ko‘rsatadi, eski Safari uchun tinglovchi mavjud. Tarif hoverlari saqlangan. Brauzerda jonli vizual sinov va haqiqiy hisoblarda yuborish alohida tekshirilishi kerak.

Manbalar: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app va https://core.telegram.org/bots.
