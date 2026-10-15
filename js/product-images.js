/* ==========================================================================
   MENSIFY — product-images.js
   A curated "dummy" image lookup table. Instead of auto-generating search
   keywords from a product's name, every specific product type below is
   hand-mapped to precise, product-accurate photo tags — so a "Chelsea Boot"
   actually pulls Chelsea boot photos, a "Bomber Jacket" pulls bomber jacket
   photos, etc., rather than a loose guess.

   Structure: { "Product Noun": "comma,separated,accurate,photo,tags" }
   Loaded before data.js so productPhotoSet() can look products up here first,
   falling back to auto-generated tags only for custom/admin-added products
   that aren't in this table.
   ========================================================================== */

const PRODUCT_IMAGE_KEYWORDS = {
  // T-Shirts
  "Essential Tee":      "mens,tshirt,plain,white",
  "Graphic Tee":        "mens,tshirt,graphic,print",
  "Crew Neck Tee":      "mens,tshirt,crewneck",
  "Pocket Tee":         "mens,tshirt,pocket",
  "Muscle Fit Tee":     "mens,tshirt,fitted,athletic",

  // Polo Shirts
  "Classic Polo":       "mens,polo,shirt",
  "Pique Polo":         "mens,polo,pique",
  "Slim Polo":          "mens,polo,slimfit",
  "Stripe Polo":        "mens,polo,striped",

  // Hoodies
  "Pullover Hoodie":    "mens,hoodie,pullover",
  "Zip Hoodie":         "mens,hoodie,zipup",
  "Oversized Hoodie":   "mens,hoodie,oversized,streetwear",
  "Fleece Hoodie":      "mens,hoodie,fleece",

  // Jackets
  "Bomber Jacket":      "mens,bomberjacket,jacket",
  "Denim Jacket":       "mens,denimjacket,jacket",
  "Windbreaker":        "mens,windbreaker,jacket",
  "Field Jacket":       "mens,fieldjacket,military,jacket",
  "Puffer Jacket":      "mens,pufferjacket,jacket",

  // Jeans
  "Slim Fit Jeans":     "mens,jeans,slimfit,denim",
  "Straight Jeans":     "mens,jeans,straightleg,denim",
  "Tapered Jeans":      "mens,jeans,tapered,denim",
  "Distressed Jeans":   "mens,jeans,ripped,denim",

  // Shorts
  "Cargo Shorts":       "mens,cargoshorts,shorts",
  "Chino Shorts":       "mens,chinoshorts,shorts",
  "Denim Shorts":       "mens,denimshorts,shorts",
  "Sweat Shorts":       "mens,sweatshorts,athletic",

  // Dress Shoes
  "Leather Derby":      "mens,derbyshoes,leathershoes",
  "Oxford Shoe":        "mens,oxfordshoes,dressshoes",
  "Chelsea Boot":       "mens,chelseaboots,boots",
  "Loafer":             "mens,loafers,dressshoes",

  // Sneakers
  "Street Runner":      "mens,sneakers,running,shoes",
  "Court Sneaker":      "mens,sneakers,court,shoes",
  "Trail Sneaker":      "mens,sneakers,trail,hiking",
  "Canvas Sneaker":     "mens,sneakers,canvas,shoes",

  // Caps
  "Snapback Cap":       "mens,snapback,cap,hat",
  "Dad Cap":            "mens,dadhat,cap",
  "Trucker Cap":        "mens,truckerhat,cap",
  "Beanie":             "mens,beanie,hat,winter",

  // Watches
  "Chrono Watch":       "mens,chronographwatch,wristwatch",
  "Steel Watch":        "mens,steelwatch,wristwatch",
  "Field Watch":        "mens,fieldwatch,wristwatch",
  "Leather Strap Watch":"mens,leatherwatch,wristwatch",

  // Wallets
  "Bifold Wallet":      "mens,bifoldwallet,leatherwallet",
  "Cardholder Wallet":  "mens,cardholder,leather",
  "Zip Wallet":         "mens,zipwallet,leather",

  // Belts
  "Leather Belt":       "mens,leatherbelt,belt",
  "Canvas Belt":        "mens,canvasbelt,belt",
  "Reversible Belt":    "mens,belt,leather",

  // Bags
  "Canvas Backpack":    "mens,canvasbackpack,backpack",
  "Leather Duffel":     "mens,leatherduffelbag,duffelbag",
  "Messenger Bag":      "mens,messengerbag,bag",
  "Weekend Bag":        "mens,weekenderbag,travelbag",

  // Accessories
  "Aviator Sunglasses": "mens,aviatorsunglasses,sunglasses",
  "Wool Scarf":         "mens,woolscarf,scarf",
  "Leather Gloves":     "mens,leathergloves,gloves",
  "Tie Clip Set":       "mens,tieclip,necktie"
};
