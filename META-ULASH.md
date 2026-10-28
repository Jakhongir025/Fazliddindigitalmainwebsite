# Facebook Ads / Meta ulanishi

Pixel ID hali yo‘q: Meta kuzatuvi o‘chiq, Facebookga hodisalar yuborilmaydi. Canonical va OG havolalari fazliddindigitalmainwebsite.vercel.app domeniga moslandi.

Keyin Vercel → Settings → Environment Variables → Production:

- META_PIXEL_ID: Events Managerdagi raqamli Pixel/Dataset ID.
- META_DOMAIN_VERIFICATION: Meta bergan facebook-domain-verification tegi content qiymati; to‘liq HTMLni emas, faqat qiymatni yozing.

Save → Redeploy. ID va verification kodi ochiq HTMLda ko‘rinadi, ular maxfiy access token emas. Bot tokeni yoki Meta access tokenini bu maydonlarga kiritmang. Faqat kerakli maydonni to‘ldirish ham mumkin; qolganini bo‘sh qoldiring.

Pixel yoqilsa PageView sahifa ochilganda, Lead esa ariza API tomonidan muvaffaqiyatli qabul qilingandan keyin yuboriladi. Tarif tugmasini bosish Lead hisoblanmaydi. Telefon, ism va xabar matni event parametrlariga kiritilmaydi; avtomatik hodisa sozlamasi o‘chirilgan. Bu brauzer Pixel integratsiyasi; Conversions API ulanmagan. Ad blocker yoki tarmoq cheklovlari hodisani to‘sishi mumkin.

ID kiritilgach Events Manager → Test Events orqali PageView va muvaffaqiyatli arizadan keyin bitta Lead kelishini tekshiring. Xato ariza Lead yubormasligi kerak. Maxfiylik matni va auditoriyangiz uchun rozilik talablarini Pixelni faollashtirishdan oldin moslang.

Haqiqiy ID bo‘lmagani sabab Meta hisobida jonli sinov hali bajarilmagan.
