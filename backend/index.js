require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- CACHING İÇİN YENİ DEĞİŞKENLER ---
let cachedGoldPrice = null;
let lastFetchTimestamp = 0;
// Fiyatı 10 dakika boyunca hafızada tut (milisaniye cinsinden)
const CACHE_DURATION_MS = 10 * 60 * 1000;

// --- GÜNCELLENMİŞ getGoldPrice FONKSİYONU ---
async function getGoldPrice() {
  const now = Date.now();

  // 1. Önbelleği kontrol et: Eğer hafızada fiyat varsa ve 10 dakikadan daha yeniyse, onu kullan.
  if (
    cachedGoldPrice !== null &&
    now - lastFetchTimestamp < CACHE_DURATION_MS
  ) {
    console.log("Serving gold price from cache.");
    return cachedGoldPrice;
  }

  // 2. Eğer önbellek boş veya eskiyse, API'den yeni fiyatı çek.
  console.log("Fetching new gold price from API.");
  try {
    const apiKey = process.env.GOLD_API_KEY;
    const response = await axios.get(
      `https://api.metalpriceapi.com/v1/latest?`,
      {
        headers: {
          "X-API-KEY": apiKey,
        },
      }
    );

    const pricePerOunce = 1 / response.data.rates.XAU;
    const pricePerGram = pricePerOunce / 31.1035;

    // 3. Yeni çekilen fiyatı ve zaman damgasını önbelleğe kaydet.
    cachedGoldPrice = pricePerGram;
    lastFetchTimestamp = now;

    return pricePerGram;
  } catch (error) {
    console.error(
      "Error fetching gold price from metalpriceapi:",
      error.response ? error.response.data : error.message
    );
    // Hata durumunda, eğer önbellekte hala eski bir fiyat varsa (sistem tamamen çökmesin diye) onu kullan.
    return cachedGoldPrice;
  }
}

// BU KISIMDAN SONRASI DEĞİŞMEDİ
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.get("/api/products", async (req, res) => {
  const goldPricePerGram = await getGoldPrice();
  if (goldPricePerGram === null) {
    return res.status(503).send({
      message: "Could not fetch real-time gold price and no cache available.",
    });
  }
  // ... gerisi aynı ...
  const filePath = path.join(__dirname, "products.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occurred while reading the product data.");
    }
    const products = JSON.parse(data);
    const productsWithPrice = products.map((product) => {
      const price =
        (product.popularityScore + 1) * product.weight * goldPricePerGram;
      return { ...product, price: parseFloat(price.toFixed(2)) };
    });
    const { minPrice, maxPrice, minPopularity, maxPopularity } = req.query;
    let filteredProducts = productsWithPrice;
    if (minPrice) {
      filteredProducts = filteredProducts.filter(
        (p) => p.price >= parseFloat(minPrice)
      );
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(
        (p) => p.price <= parseFloat(maxPrice)
      );
    }
    if (minPopularity) {
      filteredProducts = filteredProducts.filter(
        (p) => p.popularityScore >= parseFloat(minPopularity)
      );
    }
    if (maxPopularity) {
      filteredProducts = filteredProducts.filter(
        (p) => p.popularityScore <= parseFloat(maxPopularity)
      );
    }
    res.json(filteredProducts);
  });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
