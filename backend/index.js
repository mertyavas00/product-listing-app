require("dotenv").config(); // .env dosyasındaki değişkenleri yükler (en üstte olmalı)

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // API isteği için axios'u ekledik
const { channel } = require("diagnostics_channel");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

let cachedGoldPrice = null;
let lastFetchtTimestamp = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000;

// --- Helper Function: Get Real-time Gold Price ---
async function getGoldPrice() {
  const now = Date.now();

  if (
    cachedGoldPrice !== null &&
    now - lastFetchtTimestamp < CACHE_DURATION_MS
  ) {
    return cachedGoldPrice;
  }

  try {
    const apiKey = process.env.GOLD_API_KEY;
    const apiUrl = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`;
    const response = await axios.get(apiUrl);

    const pricePerOunce = 1 / response.data.rates.XAU;
    const pricePerGram = pricePerOunce / 31.1035;

    cachedGoldPrice = pricePerGram;
    lastFetchtTimestamp = now;

    return pricePerGram;
  } catch (error) {
    return cachedGoldPrice;
  }
}

// Main route (for testing purposes)
app.get("/", (req, res) => {
  res.send("API is running!");
});

// --- API Endpoint: List products with calculated real-time prices ---
// Rotayı 'async' olarak işaretliyoruz çünkü içinde 'await' kullanacağız
app.get("/api/products", async (req, res) => {
  // Altın fiyatını anlık olarak çekiyoruz
  const goldPricePerGram = await getGoldPrice();

  // Eğer altın fiyatı çekilemezse (API hatası vb.), istemciye bir hata mesajı gönder
  if (goldPricePerGram === null) {
    return res.status(503).send({
      message: "Could not fetch real-time gold price. Please try again later.",
    });
  }

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

      return {
        ...product,
        price: parseFloat(price.toFixed(2)),
      };
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
  console.log(`Server is running on port ${PORT}...`);
});
