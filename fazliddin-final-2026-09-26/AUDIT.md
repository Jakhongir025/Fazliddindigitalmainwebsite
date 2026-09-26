# Fazliddin Digital — vizual va kod auditi

**Backend yangilanishi:** KGZ boshlang‘ich til, Vercel API, imzolangan Apps Script/Sheets/Telegram integratsiyasi, rate limit va GitHub sirlar tekshiruvi qo‘shildi. Quyidagi “backend mavjud emas” xulosalari dastlabki versiyaga tegishli. Amaldagi sozlash yo‘riqnomasi `README.md`da. Real hisob ulanishi hali bajarilmagan.

**Keyingi yangilanish:** foydalanuvchi bergan papkadan 12 brend logotipi, Flaticon kontakt ikonlari va statistik blok animatsiyasi qo‘shildi. Quyidagi dastlabki auditdagi “tasvirsiz” va fayl hajmi haqidagi bandlar oldingi variantga tegishli.

Sana: 2026-09-24. Sayt: https://fazliddinads.vercel.app/

## Qamrov va dalillar

Asl `index.html` avvalgi suhbatdagi biriktirmadan olindi: bu muhitda `/mnt/data/index.html` mavjud emas. Qatorlar o‘sha 778 qatorli biriktirmaga tegishli. Sayt brauzerda ochildi; 1440 va 390 px ko‘rinishlari, til tanlash, logotiplar va forma tuzilishi ko‘rildi. Asl fayl bilan jonli saytning baytma-bayt tengligi tasdiqlanmadi. Kod haqidagi topilmalar biriktirmaga, vizual kuzatuvlar jonli sahifaga tegishli.

Hech qanday haqiqiy ariza yuborilmadi, bot tokeni ishlatilmadi va tashqi tizimlarga xabar jo‘natilmadi. Lighthouse, real foydalanuvchi Core Web Vitals, ekran o‘quvchi va Safari/Firefox sinovlari bajarilmadi. HTTP sarlavhalarini alohida olish muvaffaqiyatsiz bo‘ldi; CSP/HSTS kabi server himoyalari yo‘q deb xulosa qilinmaydi.

## Asosiy xulosa

Saytning yaxshi asosi bor: aniq xizmatlar, sodda struktura, uch til, aloqa kanallari va yengil JavaScript. Eng katta muammo dizayndan oldin integratsiyada: frontendga joylangan bot tokeni va tasdiqlanmagan muvaffaqiyat xabari. Premium ko‘rinishga erishish uchun kattaroq elementlar qo‘shishdan ko‘ra, sarlavha ierarxiyasini soddalashtirish, isbotlarni tartiblash va forma holatlarini ishonchli qilish muhim.

Ustuvorlik: P0 — zudlik bilan; P1 — keyingi nashrdan oldin; P2 — takomillashtirish.

## 1. Forma va integratsiya xavfsizligi

| Daraja | Dalil | Ta’siri | Tuzatish |
|---|---|---|---|
| P0 | 660–685: `TELEGRAM_BOT_TOKEN` frontend ichida | Faylni olgan odam tokenni ham oladi va bot API imkoniyatlaridan foydalanishi mumkin | Amaldagi tokenni BotFather orqali bekor qilib yangilang. Yangi token faqat server muhitida saqlansin. HTMLdan o‘chirishning o‘zi eski tokenni yaroqsiz qilmaydi |
| P1 | 662, 685: ikkita chat ID bitta vergulli satrda | `sendMessage` bitta chat manzilini kutadi; ushbu qiymat ikki manzilga tarqatish emas | Serverda manzillarni tekshirish va har biriga alohida yuborish; qisman xatoni qayd etish |
| P1 | 683–687: HTTP status va Telegram `ok` tekshirilmaydi | HTTP 400/401 javob ham transport xatosi bo‘lmasligi mumkin | `response.ok` hamda API javobini tekshirish |
| P1 | 699, 749–753, 766–770: xatolar yutiladi, keyin muvaffaqiyat ko‘rsatiladi | Murojaat yo‘qoladi, lekin foydalanuvchi kutib qoladi; kiritgan ma’lumot ham o‘chadi | Tasdiqlangan saqlashdan keyingina muvaffaqiyat, aks holda xato va ma’lumotni saqlab qolish |
| P1 | 663, 690–696: Google Sheets tahrirlash URLi integratsiya endpointi sifatida ishlatilgan | Bu Apps Script `/exec` endpointi emas; `no-cors` natijani tasdiqlash imkonini bermaydi | Serverdan Sheets API yoki himoyalangan integratsiya; frontendda `no-cors`ni olib tashlash |
| P1 | 692–695: ism, telefon, xabar GET query ichiga yoziladi | Shaxsiy ma’lumot so‘rov URLi va tegishli loglarda qolishi mumkin | O‘z domenidagi HTTPS POST, kam ma’lumot yig‘ish va loglarda PII saqlamaslik |
| P1 | 25–30: ko‘rsatma sifatidagi Apps Script foydalanuvchi satrini `appendRow`ga bevosita beradi | Agar shu namuna o‘rnatilgan bo‘lsa, formula sifatida talqin qilinadigan qiymatlar xavfi bor | Sheets API uchun `RAW` yozish yoki formula-injectionga qarshi server normalizatsiyasi; namunaning amalda o‘rnatilgani tasdiqlanmagan |
| P1 | 740–770: faqat bo‘sh ism/telefon tekshiriladi | Uzoq yoki yaroqsiz kiritish, spam; frontend tekshiruvini chetlab o‘tish oson | Server schema, uzunlik limiti, allowlist, tana hajmi limiti, rate limit va bot himoyasi |
| P2 | 612–646: ma’lumotdan foydalanish izohi yo‘q | Ism/telefon nima uchun olinayotgani noaniq | Qisqa izoh va amaldagi jarayonga mos maxfiylik siyosati |

Yangi HTMLda token, chat ID va Sheets URLi yo‘q. Tashqi integratsiya so‘rovlari olib tashlandi. Forma server ulanmaguncha o‘chirilgan va bu foydalanuvchiga aytiladi. Bu xavfsiz statik variant; ishlayotgan backend yaratildi yoki joylashtirildi degani emas. Faqat brauzerda tokenni yashirish, obfuscation yoki `.env` qiymatini frontendga build qilish xavfsiz yechim bo‘lmaydi.

Telegram parametrlarining rasmiy tavsifi: [Telegram Bot API — sendMessage](https://core.telegram.org/bots/api#sendmessage).

## 2. UI/UX va premium ko‘rinish

**Sarlavha haddan tashqari og‘ir.** Asl mobil ko‘rinishda ikkita savol bir xil katta `h1` ichida. Ikkinchi savol bir necha qatorni egallab, asosiy harakatni pastga suradi. Taklif: bir asosiy savolni h1da qoldirish, ikkinchisini kichik yordamchi jumlaga ajratish. Yangi faylda shu bajarildi.

**Ishonch bloklari ko‘p joy oladi.** 390 px da logotiplar ikki ustunda katta kvadrat bo‘lib joylashadi; to‘qqizta logo xizmatlargacha sezilarli masofa hosil qiladi. Yangi mustaqil HTMLda kompaniya nomlari ixcham matnli blokda saqlandi. Tasvir fayllari biriktirmada bo‘lmagani uchun lokal `./img` yo‘llari ko‘chirilmadi. Asl logotiplar kerak bo‘lsa, optimallashtirilgan fayllar bilan qaytarish mumkin.

**To‘rtta ish kartasi uch ustunga tushgan.** Desktopda 3+1 joylashuv katta bo‘sh maydon yaratadi. Yangi variant 4 ustun → 2 ustun → 1 ustun tamoyilidan foydalanadi. Besh xizmat esa desktopda 3+2 qilib muvozanatlandi.

**Ko‘p element bir xil ko‘rinadi.** Aslda badge, CTA, oq kartalar va katta yumaloq burchaklar deyarli barcha joyda takrorlanadi. Yangi dizaynda och fon, to‘q statistik blok, vazmin ko‘k aksent va turli darajadagi sarlavhalar ierarxiyani aniqroq qiladi.

**Dalilli portfolio kerak.** `$300,000+`, `100+` va `4 yil` saqlandi, lekin mustaqil tekshirilmagan. Ularga davr, vazifa va tekshiriladigan dalil qo‘shish tavsiya etiladi. 2–3 haqiqiy case: biznes turi → muammo → muddat/budjet → bajarilgan ish → CPL/ROAS natijasi. Mijoz roziligisiz identifikatsiya qiluvchi kabinet screenshotlarini e’lon qilmang. Yangi faylga uydirma sharh yoki natija qo‘shilmadi.

**Kontaktlar bir xil emas.** Asosiy Telegram `@fazliddin_ads`, footerda `@metaresultfaza`. Ikkalasi ham saqlandi; qaysi biri asosiy savdo kanali ekanini aniqlashtirib, bir xil qilish kerak.

**Taklifni aniqlashtirish kerak.** Har xizmatda natija sifatida nima berilishi, ish bosqichlari va hisobot muddati ko‘rsatilsa, ishonch oshadi. Narx, javob vaqti yoki kafolat tasdiqlanmagan bo‘lsa, ularni taxminan yozmang.

## 3. Responsivlik

- Asl 390 px ko‘rinishda hujjat eni 390 px bo‘ldi; shu holatda tashqariga chiqish o‘lchanmadi. Barcha ekranda muammo yo‘q degan xulosa emas: `overflow-x:hidden` ayrim xatolarni yashirishi mumkin.
- 400 px breakpointida logo to‘ri 3 ustundan 2 ustunga o‘tadi. Aynan kichikroq ekranda logotiplar vizual kattalashadi va sahifa cho‘ziladi.
- Mobil inputlar 13–14 px gacha kichrayadi; bu o‘qishni qiyinlashtiradi va ayrim mobil brauzerlarda fokus zoomini keltirishi mumkin. Yangi inputlar 16 px.
- Navigatsiyada brend, uch til va CTA bir qatorda siqiladi. Yangi variantda kichik ekranda yuqori CTA yashiriladi, hero va kontakt CTA havolalari qoladi.
- Modalning eski `vh` chegarasi o‘rniga yangi variantda `dvh` ishlatiladi, ichki kontent skrollanadi. Haqiqiy mobil klaviatura bilan alohida qurilma testi hali kerak.
- Yangi variant 320/390/768/1440 px kengliklarda UZ/KG/RU uchun tekshirildi: 12 holatning barchasida `scrollWidth === innerWidth`.

## 4. Accessibility

| Muammo | Dalil | Yangi variant |
|---|---|---|
| Label va input bog‘lanmagan | 551–578, 612–643: `label for` yo‘q | Har bir maydonda noyob ID va unga mos `for` |
| Xizmat kartalari klaviatura tugmasi emas | 493–540: `div onclick` | Native `button`, Enter/Space va ko‘rinadigan fokus |
| Modal semantikasi va fokus boshqaruvi yetishmaydi | 542–583, 729–738 | Native `dialog`, sarlavha bilan nomlash, boshlang‘ich fokus, Escape, fokusni qaytarish |
| Forma semantikasi yo‘q | Maydonlar `div` ichida, click-handler bilan yuborish | Native `form`, `submit`, `required`, maxlength va browser validation |
| Til atributi noto‘g‘ri | `html lang="uz"`, lekin 715, 775 qirg‘iz tilini ochadi; 723–727 `lang`ni o‘zgartirmaydi | Ko‘rinayotgan til bilan `html.lang` birga yangilanadi |
| Holat e’lon qilinmaydi | `success-msg` faqat ko‘rsatib/yashiriladi | `role=status`, `aria-live=polite`, xato uchun doimiy matn |
| Harakatni kamaytirish yo‘q | fade/transform/smooth-scroll global | `prefers-reduced-motion` hisobga olindi |
| JSsiz kontent yashirin qolishi mumkin | `.fade-up {opacity:0}`, 773–775 observer | Kontent boshidan ko‘rinadi; JSsiz o‘zbekcha matn va kontaktlar qoladi |
| Main landmark va skip-link yo‘q | Asl body tuzilishi | `main`, skip-link, tartibli h1/h2/h3 |

Asl mobil til tugmalari taxminan 36×22 px. Kattaroq nishon tavsiya qilinadi. WCAG 2.5.8 mezonida 24×24 px yoki yetarli ajratish kabi istisnolar bor; faqat 22 px balandlikka qarab avtomatik buzilish deb baholanmadi. Yangi tugmalar odatda kamida 44 px balandlikda. [W3C — Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Kod ranglaridan hisoblanganda eski `#1877F2`/oq kontrasti 4.23:1: oddiy kichik matn uchun 4.5:1 mezoniga yetmaydi. Yangi `#1559C9`/oq 6.36:1. Bu faqat shu rang juftliklarining hisobidir, barcha elementlar avtomatik accessibility auditidan o‘tdi degani emas.

Native dialog xatti-harakatlari uchun: [MDN — dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## 5. Performance

Ijobiy tomonlar: frontend framework yo‘q, tasvirlarda `loading=lazy` mavjud, murakkab video yoki katta JS kutubxonasi yo‘q.

Takomillashtirishlar:

1. Google Fonts orqali oltita vazn so‘raladi. Faqat ishlatilgan 2–3 vazn, lokal WOFF2 yoki system font tanlang. Yangi variant system font ishlatadi va tashqi font so‘rovi yo‘q.
2. Logotiplarda aniq width/height atributlari yo‘q, lekin konteyner o‘lchami qisman joy ajratadi. Real CLS balini o‘lchamasdan yuqori deb aytib bo‘lmaydi. Logolar qaytsa, o‘lcham va aspect-ratio bering.
3. JPG/PNG o‘rniga mos siqilgan WebP/AVIF variantlarini ko‘rib chiqing; logo tiniqligini vizual tekshiring. Bu auditda tasvir baytlari o‘lchanmadi.
4. Statik matnni IntersectionObserver ishlaguncha yashirmang. Bu ayniqsa h1 va asosiy CTA uchun kerak.
5. Yangi HTML taxminan 38.9 KB, niqoblangan asl nusxa 50.3 KB. Bu xom fayl o‘lchami; gzip yoki butun sahifa trafik o‘lchovi emas. Yangi faylda tashqi font/tasvir kutubxonalari yo‘q.
6. Nashrdan so‘ng mobil Lighthouse va haqiqiy trafik bo‘yicha LCP/INP/CLS o‘lchang. Tavsiya etiladigan maqsadlar: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; ushbu audit natijasi sifatida berilmayapti. Manba: [Google — Web Vitals](https://web.dev/articles/vitals).

## 6. Code quality va i18n

- Bitta fayl kichik landing uchun maqbul; lekin inline click-handler, dublikat submit funksiyalar va integratsiya kodi tuzatishni qiyinlashtiradi. Yangi variant umumiy form handler va `addEventListener`dan foydalanadi.
- `innerHTML` bilan tarjima qo‘yish (726) hozir statik lug‘atda to‘g‘ridan-to‘g‘ri ekspluatatsiya isboti emas, lekin keyin tashqi tarjima kiritilsa xavfli. Yangi variant `textContent` ishlatadi.
- Option qiymatlari matnga bog‘langan: til almashtirilsa backendga yuboriladigan qiymat ham o‘zgaradi. Yangi variant `targeting`, `smm`, `google`, `digital`, `website` kabi barqaror IDlar yuboradi.
- Ruscha `form_budget` “oylik reklama budjeti” degan, lekin maydon servis tanlaydi. Tuzatildi.
- Modal va asosiy formadagi Website/SMM tartibi turlicha; ayni i18n kalitlari ularni qayta nomlaydi. Endi bitta xizmat xaritasi bor.
- `form_biz` “xizmat turi” deb nomlangan, lekin e-commerce/ta’lim kabi biznes yo‘nalishlari turibdi. Uch tilda moslashtirildi.
- 5 ta xizmatdan Digital Marketing eski asosiy selectda yo‘q. Endi beshalasi ham mavjud.
- Qirg‘izcha hamkorlar sarlavhasi “O‘zbekistonda tugallangan loyihalar”, boshqa tillarda “hamkor va mijozlar”. Mazmuniy farq saqlandi; egasi bir ma’noni tanlab tekshirtirsin.
- Ruscha Google Ads kartasida Yandex ham bor, boshqa tillarda yo‘q. Mavjud matn saqlandi; xizmat doirasini aniqlashtirish tavsiya etiladi.
- Faqat `title` bor, description va ijtimoiy ulashish metama’lumotlari yetishmaydi. Yangi description qo‘shildi; lokalizatsiyalangan URLlar, canonical/hreflang va Open Graph rasmi keyingi nashr vazifasi.
- Yangi faylda CSP script hash mavjud. JS o‘zgartirilsa hash qayta hisoblanishi kerak. Inline style uchun ruxsat bor; script uchun `unsafe-inline` yo‘q. HTTP `frame-ancestors` alohida serverda berilishi kerak.

## Bajarilgan o‘zgarishlar va tekshiruv chegarasi

Tayyor: premium layout, uch til, semantic forms/buttons/dialog, fokus, Escape, label, status, kontrastli asosiy rang, reduced-motion, xavfsiz statik holat, sirlarning olib tashlanishi, CSP hash, tashqi dependencylarning olib tashlanishi.

Tekshirildi: JavaScript sintaksisi; CSP hash mosligi; ochiq bot tokeni va inline event-handler yo‘qligi; 12 til/ekran kombinatsiyasi; maydon label bog‘lanishlari; modalning boshlang‘ich va qaytuvchi fokusi; brauzer konsolida tekshiruv payti error/warn yo‘qligi.

Tekshirilmagan: real server yuborishi, Telegram/Sheets qabul qilishi, rate limit, CAPTCHA, success/error tarmoq ssenariylari, real mobil klaviatura, screen reader, Core Web Vitals. Backend mavjud emasligi sabab forma ataylab faol emas.

## Keyingi ishlar tartibi

1. **Darhol:** oshkor bo‘lgan tokenni bekor qilish, yangi tokenni faqat serverda saqlash, eski public buildlarni ham tekshirish.
2. **Keyingi nashr:** xavfsiz lead API, server validatsiyasi, rate limit, real qabul qilish testi, foydalanuvchi xato/success holatlari.
3. **Ishonch:** 2–3 haqiqiy case, ko‘rsatkichlar davri, yagona asosiy Telegram va xizmat doirasini aniqlashtirish.
4. **Sifat:** uch tilni ona tili muharriri bilan tekshirish, real qurilma/accessibility/Lighthouse tekshiruvi, SEO metama’lumotlari.
