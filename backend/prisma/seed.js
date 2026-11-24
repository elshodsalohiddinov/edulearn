// Test ma'lumotlari: 1 super admin, 3 o'qituvchi, 4 talaba, 5 kategoriya, 10 kurs, darslar, yozilishlar.
// Ishga tushirish: npm run db:seed   (bazadagi eski ma'lumotlar o'chiriladi!)
//
// Parollar .env dagi SEED_ADMIN_PASSWORD va SEED_DEMO_PASSWORD dan olinadi — kodda yozilmagan.
// Productionda bu skript standart parollar bilan ishlamaydi.
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { slugify } = require('../src/utils/slugify');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@edulearn.uz';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD;

if (!ADMIN_PASSWORD || !DEMO_PASSWORD) {
  console.error('.env da SEED_ADMIN_PASSWORD va SEED_DEMO_PASSWORD ni belgilang.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && ['Admin12345', 'Parol12345'].includes(ADMIN_PASSWORD)) {
  console.error('Productionda standart seed parolini ishlatib bo\'lmaydi.');
  process.exit(1);
}

const categories = ['Dasturlash', 'Dizayn', 'Marketing', 'Ingliz tili', 'Biznes'];

const teachers = [
  ['Sardor', 'Jo\'rayev', 'sardor@edulearn.uz', 'Full-stack dasturchi, 8 yillik tajriba. JavaScript va Python bo\'yicha kurslar muallifi.'],
  ['Dilnoza', 'Karimova', 'dilnoza@edulearn.uz', 'UI/UX dizayner. Figma va dizayn tizimlari bo\'yicha mutaxassis.'],
  ['Malika', 'Ismoilova', 'malika@edulearn.uz', 'Ingliz tili o\'qituvchisi, IELTS 8.5. Marketing bo\'yicha ham dars beradi.'],
];

const students = [
  ['Azizbek', 'Karimov', 'talaba@edulearn.uz'],
  ['Nodira', 'Aliyeva', 'nodira@edulearn.uz'],
  ['Jamshid', 'Norboyev', 'jamshid@edulearn.uz'],
  ['Sevara', 'Ikromova', 'sevara@edulearn.uz'],
];

// [nom, tavsif, kategoriya, daraja, holat, o'qituvchi email, [[dars nomi, qisqa mazmuni], ...]]
const courses = [
  ['Web dasturlash (Frontend)', 'HTML, CSS va JavaScript yordamida zamonaviy, moslashuvchan veb-sahifalar yaratishni noldan o\'rganing. Kurs oxirida o\'z portfolio saytingizni yaratasiz.', 'Dasturlash', 'BEGINNER', 'PUBLISHED', 'sardor@edulearn.uz', [
    ['HTML asoslari', 'Teglar, atributlar va sahifa tuzilmasi: <html>, <head>, <body>, sarlavhalar va paragraflar.'],
    ['HTML formalar', '<form>, <input>, <label> va <button> elementlari; forma ma\'lumotlarini tekshirish atributlari.'],
    ['CSS selektorlar', 'Teg, klass va ID selektorlari, kaskad va o\'ziga xoslik (specificity) qoidalari.'],
    ['Flexbox', 'display:flex, justify-content va align-items yordamida elementlarni bir qatorda joylashtirish.'],
    ['CSS Grid', 'grid-template-columns va gap yordamida ikki o\'lchamli sahifa tuzilmasi.'],
    ['Moslashuvchan dizayn', 'Media querylar va mobile-first yondashuv: sahifa telefon va kompyuterda to\'g\'ri ko\'rinishi.'],
    ['JavaScript o\'zgaruvchilar', 'let, const, ma\'lumot turlari va operatorlar.'],
    ['Funksiyalar', 'Funksiya e\'lon qilish, parametrlar, return va arrow funksiyalar.'],
    ['DOM bilan ishlash', 'querySelector, elementlarni o\'zgartirish va yangi element yaratish.'],
    ['Hodisalar (events)', 'addEventListener, click va submit hodisalari, event obyekti.'],
    ['Fetch va API', 'fetch() yordamida serverdan JSON ma\'lumot olish, async/await.'],
    ['Yakuniy loyiha', 'O\'rganilganlar asosida shaxsiy portfolio sahifasini yaratish.'],
  ]],
  ['Python dasturlash asoslari', 'Python tilining sintaksisi, ma\'lumot turlari, funksiyalar va fayllar bilan ishlash. Har bir darsda amaliy mashqlar.', 'Dasturlash', 'BEGINNER', 'PUBLISHED', 'sardor@edulearn.uz', [
    ['Python o\'rnatish', 'Python va VS Code o\'rnatish, birinchi dastur: print("Salom").'],
    ['O\'zgaruvchilar va turlar', 'int, float, str, bool va turlarni o\'zgartirish.'],
    ['Shartlar', 'if, elif, else va mantiqiy operatorlar.'],
    ['Sikllar', 'for va while sikllari, range() funksiyasi.'],
    ['Ro\'yxatlar', 'list yaratish, element qo\'shish, o\'chirish va saralash.'],
    ['Lug\'atlar', 'dict: kalit-qiymat juftliklari bilan ishlash.'],
    ['Funksiyalar', 'def, argumentlar va qiymat qaytarish.'],
    ['Fayllar', 'open() bilan faylni o\'qish va yozish.'],
  ]],
  ['React.js bilan veb-ilovalar', 'Komponentlar, holat (state), hooks va API bilan ishlaydigan bir sahifali ilovalar yaratish.', 'Dasturlash', 'INTERMEDIATE', 'PUBLISHED', 'sardor@edulearn.uz', [
    ['React nima?', 'Komponentlarga asoslangan yondashuv va Vite bilan loyiha yaratish.'],
    ['JSX', 'JavaScript ichida HTML ko\'rinishidagi sintaksis va uning qoidalari.'],
    ['Komponentlar va props', 'Qayta ishlatiladigan komponentlar va ularga ma\'lumot uzatish.'],
    ['useState', 'Komponent holatini saqlash va yangilash.'],
    ['useEffect', 'Yon ta\'sirlar: API dan ma\'lumot yuklash.'],
    ['React Router', 'Bir nechta sahifali ilova va marshrutlar.'],
  ]],
  ['Ma\'lumotlar bazasi (SQL)', 'Jadvallar, munosabatlar, SELECT, JOIN va indekslar. Amaliy misollar PostgreSQL da.', 'Dasturlash', 'INTERMEDIATE', 'PUBLISHED', 'sardor@edulearn.uz', [
    ['Relyatsion baza nima?', 'Jadval, satr, ustun va birlamchi kalit tushunchalari.'],
    ['CREATE TABLE', 'Jadval yaratish, ma\'lumot turlari va cheklovlar (NOT NULL, UNIQUE).'],
    ['SELECT va WHERE', 'Ma\'lumotlarni tanlash va filtrlash.'],
    ['JOIN', 'Bog\'langan jadvallarni birlashtirish: INNER va LEFT JOIN.'],
    ['GROUP BY', 'Guruhlash va agregat funksiyalar: COUNT, SUM, AVG.'],
    ['Indekslar', 'So\'rovlarni tezlashtirish va indeks qachon kerak bo\'lishi.'],
  ]],
  ['Git va GitHub', 'Versiyalarni boshqarish, branch, pull request va jamoada ishlash tartibi.', 'Dasturlash', 'BEGINNER', 'PUBLISHED', 'sardor@edulearn.uz', [
    ['Git nima?', 'Versiyalarni boshqarish tizimi va git init.'],
    ['commit va log', 'git add, git commit va tarixni ko\'rish.'],
    ['Branch', 'Alohida tarmoqda ishlash: git switch -c feature/...'],
    ['GitHub va push', 'Masofaviy repo, git push va git pull.'],
    ['Pull Request', 'PR ochish, review va merge jarayoni.'],
  ]],
  ['UI/UX dizayn asoslari', 'Foydalanuvchi tajribasi, wireframe, Figma bilan prototip yaratish va dizayn tizimlari.', 'Dizayn', 'INTERMEDIATE', 'PUBLISHED', 'dilnoza@edulearn.uz', [
    ['UX nima?', 'Foydalanuvchi tajribasi va UI o\'rtasidagi farq.'],
    ['Foydalanuvchi tadqiqoti', 'Intervyu va persona yaratish.'],
    ['Wireframe', 'Sahifa sxemasini qog\'ozda va Figma da chizish.'],
    ['Rang va tipografiya', 'Rang palitrasi, kontrast va shriftlar.'],
    ['Prototip', 'Figma da interaktiv prototip yaratish.'],
  ]],
  ['Figma: noldan professionalgacha', 'Figma interfeysi, Auto Layout, komponentlar va jamoaviy dizayn.', 'Dizayn', 'BEGINNER', 'PUBLISHED', 'dilnoza@edulearn.uz', [
    ['Figma interfeysi', 'Frame, layer va asosiy asboblar.'],
    ['Auto Layout', 'Moslashuvchan tugma va kartalar yaratish.'],
    ['Komponentlar', 'Komponent va variantlar bilan ishlash.'],
    ['Eksport', 'Dizaynni dasturchiga topshirish.'],
  ]],
  ['Raqamli marketing va SMM', 'Ijtimoiy tarmoqlarda brendni rivojlantirish, kontent reja va reklama kampaniyalari.', 'Marketing', 'BEGINNER', 'PUBLISHED', 'malika@edulearn.uz', [
    ['Marketing asoslari', 'Bozor, mijoz va qiymat taklifi.'],
    ['Maqsadli auditoriya', 'Auditoriyani segmentlash.'],
    ['Kontent reja', 'Bir oylik kontent rejasi tuzish.'],
    ['Tahlil', 'Natijalarni o\'lchash va hisobot.'],
  ]],
  ['Ingliz tili: A1 dan B1 gacha', 'Grammatika, so\'z boyligi va amaliy muloqot. Har bir dars oxirida mashqlar.', 'Ingliz tili', 'BEGINNER', 'PUBLISHED', 'malika@edulearn.uz', [
    ['Present Simple', 'Hozirgi oddiy zamon: tuzilishi va ishlatilishi.'],
    ['Present Continuous', 'Hozirgi davomli zamon.'],
    ['Past Simple', 'O\'tgan oddiy zamon va noto\'g\'ri fe\'llar.'],
    ['Future', 'will va going to.'],
    ['Kundalik muloqot', 'Tanishish, yo\'l so\'rash va xarid qilish dialoglari.'],
  ]],
  ['Biznes va startap asoslari', 'G\'oyani tekshirish, biznes model, moliya va investor bilan ishlash.', 'Biznes', 'ADVANCED', 'PENDING', 'malika@edulearn.uz', [
    ['G\'oya va muammo', 'Haqiqiy muammoni topish.'],
    ['Biznes model', 'Lean Canvas to\'ldirish.'],
    ['MVP', 'Minimal mahsulotni tez sinash.'],
  ]],
  ['Node.js va Express (qoralama)', 'Backend dasturlash: REST API, middleware va ma\'lumotlar bazasi.', 'Dasturlash', 'ADVANCED', 'DRAFT', 'sardor@edulearn.uz', [
    ['Node.js nima?', 'Server tomonida JavaScript.'],
    ['Express marshrutlari', 'GET, POST, PATCH, DELETE.'],
  ]],
];

// [talaba email, kurs nomi, nechta dars tugatilgan]
const enrollments = [
  ['talaba@edulearn.uz', 'Web dasturlash (Frontend)', 7],
  ['talaba@edulearn.uz', 'Python dasturlash asoslari', 3],
  ['talaba@edulearn.uz', 'Git va GitHub', 5],
  ['nodira@edulearn.uz', 'UI/UX dizayn asoslari', 2],
  ['nodira@edulearn.uz', 'Web dasturlash (Frontend)', 2],
  ['nodira@edulearn.uz', 'Figma: noldan professionalgacha', 4],
  ['jamshid@edulearn.uz', 'Python dasturlash asoslari', 8],
  ['jamshid@edulearn.uz', 'Ma\'lumotlar bazasi (SQL)', 1],
  ['sevara@edulearn.uz', 'Ingliz tili: A1 dan B1 gacha', 2],
  ['sevara@edulearn.uz', 'React.js bilan veb-ilovalar', 0],
];

function lessonContent(title, summary) {
  return [
    `${title}`,
    '',
    `Mavzu: ${summary}`,
    '',
    'Darsning maqsadi',
    `Ushbu darsdan so'ng siz "${title}" mavzusidagi asosiy tushunchalarni bilasiz va ularni amaliyotda qo'llay olasiz.`,
    '',
    'Mustaqil mashq',
    'Darsda ko\'rilgan misolni o\'zingiz qayta yozing va unga bitta yangi imkoniyat qo\'shing.',
  ].join('\n');
}

async function main() {
  console.log('Eski ma\'lumotlar o\'chirilmoqda...');
  // TRUNCATE ... RESTART IDENTITY — jadvallarni tozalaydi va ID larni yana 1 dan boshlaydi
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE lesson_progress, enrollments, lessons, courses, categories, contact_messages, users RESTART IDENTITY CASCADE',
  );

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.create({
    data: { firstName: 'Super', lastName: 'Admin', email: ADMIN_EMAIL, passwordHash: adminHash, role: 'SUPER_ADMIN' },
  });

  const userId = {};
  for (const [firstName, lastName, email, bio] of teachers) {
    const u = await prisma.user.create({ data: { firstName, lastName, email, bio, passwordHash: demoHash, role: 'TEACHER' } });
    userId[email] = u.id;
  }
  for (const [firstName, lastName, email] of students) {
    const u = await prisma.user.create({ data: { firstName, lastName, email, passwordHash: demoHash, role: 'STUDENT' } });
    userId[email] = u.id;
  }

  const categoryId = {};
  for (const name of categories) {
    const c = await prisma.category.create({ data: { name, slug: slugify(name) } });
    categoryId[name] = c.id;
  }

  const courseId = {};
  const lessonIds = {};
  for (const [title, description, cat, level, status, teacherEmail, lessons] of courses) {
    const course = await prisma.course.create({
      data: {
        title,
        slug: slugify(title),
        description,
        level,
        status,
        teacherId: userId[teacherEmail],
        categoryId: categoryId[cat],
        lessons: {
          create: lessons.map(([lt, summary], i) => ({
            title: lt,
            content: lessonContent(lt, summary),
            durationMinutes: 8 + ((i * 7) % 20),
            orderIndex: i + 1,
            isPreview: i === 0, // birinchi dars hamma uchun ochiq
          })),
        },
      },
      include: { lessons: { orderBy: { orderIndex: 'asc' }, select: { id: true } } },
    });
    courseId[title] = course.id;
    lessonIds[title] = course.lessons.map((l) => l.id);
  }

  // Yozilishlar turli oylarga tarqatiladi — admin grafigida ko'rinishi uchun
  const now = Date.now();
  for (const [i, [email, title, done]] of enrollments.entries()) {
    const enrolledAt = new Date(now - (i % 5) * 30 * 24 * 3600 * 1000 - i * 86400000);
    await prisma.enrollment.create({ data: { studentId: userId[email], courseId: courseId[title], enrolledAt } });
    if (done > 0) {
      await prisma.lessonProgress.createMany({
        data: lessonIds[title].slice(0, done).map((lessonId) => ({ studentId: userId[email], lessonId })),
      });
    }
  }

  await prisma.contactMessage.create({
    data: { name: 'Bekzod', email: 'bekzod@example.com', subject: 'Sertifikat haqida', message: 'Kurs yakunida sertifikat beriladimi? Rahmat.' },
  });

  console.log('Tayyor! Foydalanuvchilar:');
  console.log(`  SUPER_ADMIN: ${ADMIN_EMAIL}  (parol: .env -> SEED_ADMIN_PASSWORD)`);
  console.log(`  TEACHER:     ${teachers.map((t) => t[2]).join(', ')}`);
  console.log(`  STUDENT:     ${students.map((s) => s[2]).join(', ')}`);
  console.log('  O\'qituvchi va talabalar paroli: .env -> SEED_DEMO_PASSWORD');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
