// Sarlavhadan URL uchun "slug" yasaydi: "Ma'lumotlar bazasi (SQL)" -> "malumotlar-bazasi-sql"
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, '') // o'zbekcha tutuq belgilari
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

// Slug band bo'lsa oxiriga -2, -3 ... qo'shadi. `exists` — slug bazada bormi tekshiruvchi funksiya.
async function uniqueSlug(text, exists) {
  const base = slugify(text);
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await exists(slug)) slug = `${base}-${n++}`;
  return slug;
}

module.exports = { slugify, uniqueSlug };
