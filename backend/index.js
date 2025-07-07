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

let cachedGoldPrice = null;
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000;

async function getGoldPrice() {
  const now = Date.now();
  if (
    cachedGoldPrice !== null &&
    now - lastFetchTimestamp < CACHE_DURATION_MS
  ) {
    console.log("Serving gold price from cache.");
    return cachedGoldPrice;
  }

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

    cachedGoldPrice = pricePerGram;
    lastFetchTimestamp = now;

    return pricePerGram;
  } catch (error) {
    console.error(
      "Error fetching gold price",
      error.response ? error.response.data : error.message
    );
    return cachedGoldPrice;
  }
}
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.get("/api/products", async (req, res) => {
  const goldPricePerGram = await getGoldPrice();
  if (goldPricePerGram === null) {
    return res.status(503).send({
      message: "Could not fetch real-time gold price",
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
  console.log(`Server working on port ${PORT}`);
});
