/* ==========================================================================
   MENSIFY — data.js
   Static seed data: categories, brands, product generator, review lines.
   No backend / no external API — everything lives in JS + LocalStorage.
   ========================================================================== */

const CATEGORIES = [
  { id:'tshirts',  name:'T-Shirts',   icon:'👕' },
  { id:'polos',    name:'Polo Shirts',icon:'🎽' },
  { id:'hoodies',  name:'Hoodies',    icon:'🧥' },
  { id:'jackets',  name:'Jackets',    icon:'🧥' },
  { id:'jeans',    name:'Jeans',      icon:'👖' },
  { id:'shorts',   name:'Shorts',     icon:'🩳' },
  { id:'shoes',    name:'Shoes',      icon:'👞' },
  { id:'sneakers', name:'Sneakers',   icon:'👟' },
  { id:'caps',     name:'Caps',       icon:'🧢' },
  { id:'watches',  name:'Watches',    icon:'⌚' },
  { id:'wallets',  name:'Wallets',    icon:'👛' },
  { id:'belts',    name:'Belts',      icon:'🔗' },
  { id:'bags',     name:'Bags',       icon:'🎒' },
  { id:'accessories', name:'Accessories', icon:'🕶️' }
];

const BRANDS = ['Northline','Ironclad','Vantage','Kessler & Co','Atlas Supply','Greyhouse','Forge Denim','Meridian','Rebel Root','Oakcliff','Stonewell','Drift & Co'];

const COLOR_SWATCHES = {
  Black:'#111111', White:'#f4f4f2', Navy:'#1c2b45', Grey:'#8a8a86', Olive:'#5c5f3d',
  Gold:'#D4AF37', Blue:'#1E88E5', Brown:'#5b4130', Beige:'#d9cba9', Red:'#a5312a', Charcoal:'#333333'
};

const SIZE_SETS = {
  apparel: ['S','M','L','XL','XXL'],
  footwear: ['40','41','42','43','44','45'],
  onesize: ['One Size']
};

const PRODUCT_NOUNS = {
  tshirts:  ['Essential Tee','Graphic Tee','Crew Neck Tee','Pocket Tee','Muscle Fit Tee'],
  polos:    ['Classic Polo','Pique Polo','Slim Polo','Stripe Polo'],
  hoodies:  ['Pullover Hoodie','Zip Hoodie','Oversized Hoodie','Fleece Hoodie'],
  jackets:  ['Bomber Jacket','Denim Jacket','Windbreaker','Field Jacket','Puffer Jacket'],
  jeans:    ['Slim Fit Jeans','Straight Jeans','Tapered Jeans','Distressed Jeans'],
  shorts:   ['Cargo Shorts','Chino Shorts','Denim Shorts','Sweat Shorts'],
  shoes:    ['Leather Derby','Oxford Shoe','Chelsea Boot','Loafer'],
  sneakers: ['Street Runner','Court Sneaker','Trail Sneaker','Canvas Sneaker'],
  caps:     ['Snapback Cap','Dad Cap','Trucker Cap','Beanie'],
  watches:  ['Chrono Watch','Steel Watch','Field Watch','Leather Strap Watch'],
  wallets:  ['Bifold Wallet','Cardholder Wallet','Zip Wallet'],
  belts:    ['Leather Belt','Canvas Belt','Reversible Belt'],
  bags:     ['Canvas Backpack','Leather Duffel','Messenger Bag','Weekend Bag'],
  accessories: ['Aviator Sunglasses','Wool Scarf','Leather Gloves','Tie Clip Set']
};

const DESCRIPTIONS = [
  'Crafted from premium materials for everyday durability and a clean, modern silhouette.',
  'A wardrobe staple built for comfort, structured to move with you through the day.',
  'Minimalist detailing meets rugged construction — designed for the man who values both form and function.',
  'Finished with reinforced stitching and a tailored cut that layers effortlessly.',
  'Engineered with breathable fabric and a relaxed fit for all-day wear.',
  'A refined update on a classic silhouette, made to last season after season.'
];

function seededGlyph(name){
  return name.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase();
}

/* ---------- Product photography (real, category/product-accurate) ----------
   Uses LoremFlickr's keyword-matched photo service — no API key, no backend.
   Each product gets a deterministic set of 3 images ("lock" = fixed photo id)
   so the same product always shows the same pictures, but different products
   show different accurate photography for their category/name. ---------- */
const CATEGORY_PHOTO_KEYWORDS = {
  tshirts:  'mens,tshirt',
  polos:    'mens,polo,shirt',
  hoodies:  'mens,hoodie',
  jackets:  'mens,jacket',
  jeans:    'mens,jeans,denim',
  shorts:   'mens,shorts',
  shoes:    'mens,dress,shoes',
  sneakers: 'mens,sneakers',
  caps:     'mens,cap,hat',
  watches:  'mens,wristwatch',
  wallets:  'mens,wallet,leather',
  belts:    'mens,belt,leather',
  bags:     'mens,backpack,bag',
  accessories: 'mens,sunglasses,accessory'
};

function productPhotoSet(categoryId, noun, seedId){
  // Stable, direct image-CDN assets grouped by product category. Unlike random
  // photo-search services, a failed image is never silently replaced by a sunset.
  const photos = {
    tshirts:'photo-1521572163474-6864f9cf17ab', polos:'photo-1625910513413-5fc4b5c5f7a1',
    hoodies:'photo-1556821840-3a63f95609a7', jackets:'photo-1591047139829-d91aecb6caea',
    jeans:'photo-1542272604-787c3835535d', shorts:'photo-1517445312882-bc9910d016b7',
    shoes:'photo-1614252369475-531159fc7ada', sneakers:'photo-1542291026-7eec264c27ff',
    caps:'photo-1521369909029-2afed882baee', watches:'photo-1523275335684-37898b6baf30',
    wallets:'photo-1627123424574-724758594e93', belts:'photo-1624222247344-550fb8d3a6f7',
    bags:'photo-1553062407-98eeb64c6a62', accessories:'photo-1511499767150-a48a237f0083'
  };
  const id = photos[categoryId] || photos.tshirts;
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
  return [url,url,url];
}

function generateProducts(){
  const products = [];
  let id = 1;
  const phClasses = ['ph-1','ph-2','ph-3','ph-4','ph-5','ph-6'];
  CATEGORIES.forEach((cat, ci) => {
    const nouns = PRODUCT_NOUNS[cat.id];
    const isFootwear = cat.id === 'shoes' || cat.id === 'sneakers';
    const isSized = ['tshirts','polos','hoodies','jackets','jeans','shorts'].includes(cat.id);
    nouns.forEach((noun, ni) => {
      // create 3-4 variants per noun to comfortably exceed 50 products
      const variantCount = (ci + ni) % 2 === 0 ? 4 : 3;
      for (let v = 0; v < variantCount; v++){
        const brand = BRANDS[(id + ci) % BRANDS.length];
        // Affordable Philippine-peso retail pricing for a budget-friendly men's store.
        const priceRanges = {
          tshirts:[199,399], polos:[299,499], hoodies:[599,999], jackets:[699,1299],
          jeans:[499,899], shorts:[249,449], shoes:[699,1299], sneakers:[799,1499],
          caps:[149,299], watches:[299,899], wallets:[149,349], belts:[199,399],
          bags:[399,999], accessories:[99,499]
        };
        const [priceMin, priceMax] = priceRanges[cat.id] || [199,499];
        const basePrice = Math.round((priceMin + ((id * 37) % (priceMax - priceMin + 1))) / 10) * 10;
        const discount = [0,0,0,10,15,20,25,30][(id * 3) % 8];
        const rating = (3.6 + ((id * 13) % 14) / 10).toFixed(1);
        const reviewsCount = 5 + ((id * 17) % 180);
        const stock = (id * 9) % 40;
        const colorKeys = Object.keys(COLOR_SWATCHES);
        const colors = [colorKeys[id % colorKeys.length], colorKeys[(id+3) % colorKeys.length], colorKeys[(id+6) % colorKeys.length]];
        const sizes = isSized ? SIZE_SETS.apparel : (isFootwear ? SIZE_SETS.footwear : SIZE_SETS.onesize);
        const tags = [];
        if (discount >= 15) tags.push('sale');
        if (id % 6 === 0) tags.push('bestseller');
        if (id % 5 === 0) tags.push('new');
        if (id % 4 === 0) tags.push('featured');
        const name = `${brand} ${noun}${variantCount>1 ? ' ' + String.fromCharCode(65+v) : ''}`;
        products.push({
          id: 'MEN-' + String(id).padStart(4,'0'),
          name,
          brand,
          category: cat.id,
          categoryName: cat.name,
          description: DESCRIPTIONS[id % DESCRIPTIONS.length] + ` Part of the ${brand} ${new Date().getFullYear()} lineup.`,
          price: basePrice,
          discount,
          rating: Number(rating),
          reviewsCount,
          stock,
          sizes,
          colors,
          images: productPhotoSet(cat.id, noun, id),
          thumbClass: phClasses[id % phClasses.length],
          glyph: seededGlyph(noun),
          tags,
          sku: `SKU-${cat.id.slice(0,3).toUpperCase()}-${id}`,
          createdRank: id
        });
        id++;
      }
    });
  });
  return products;
}

const REVIEW_AUTHORS = ['Marco D.','James T.','Leo R.','Daniel K.','Ethan V.','Omar S.','Noah P.','Lucas B.','Rafael G.','Tariq M.'];
const REVIEW_LINES = [
  'Fit is exactly as described and the fabric feels premium. Ordering another one.',
  'Solid build quality — this has held up well after weekly wear.',
  'Great value for the price point. Delivery was quick too.',
  'True to size and the color matched the photos closely.',
  'My go-to now for everyday wear. Comfortable from the first wear.',
  'Good stitching and finish, feels more premium than the price suggests.'
];

function generateReviews(product){
  const count = Math.min(4, Math.max(2, product.reviewsCount % 5 + 2));
  const out = [];
  for (let i=0;i<count;i++){
    out.push({
      author: REVIEW_AUTHORS[(product.createdRank + i) % REVIEW_AUTHORS.length],
      rating: Math.max(3, Math.min(5, Math.round(product.rating) - (i % 2))),
      text: REVIEW_LINES[(product.createdRank + i) % REVIEW_LINES.length],
      date: new Date(Date.now() - (i+1) * 9 * 86400000).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})
    });
  }
  return out;
}
