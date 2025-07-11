import React, { useState } from "react";
import "./ProductCard.css";
import Rating from "./Rating";

const colorMap = {
  yellow: { colorName: "Yellow Gold", colorHex: "#E6CA97" },
  rose: { colorName: "Rose Gold", colorHex: "#E1A4A9" },
  white: { colorName: "White Gold", colorHex: "#D9D9D9" },
};

function ProductCard({ product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!product) {
    return null;
  }
  let imageList = [];
  if (product.images && typeof product.images === "object") {
    imageList = Object.keys(product.images).map((key) => ({
      colorName: colorMap[key]?.colorName || key,
      colorHex: colorMap[key]?.colorHex || "#FFFFFF",
      imageUrl: product.images[key],
    }));
  }

  const { name, popularityScore } = product;
  const price = product.price;
  const ratingScore = popularityScore * 5;

  return (
    <div className="product-card">
      <div className="product-image-container">
        {imageList.length > 0 ? (
          <img
            src={imageList[activeIndex].imageUrl}
            alt={`${name} - ${imageList[activeIndex].colorName}`}
            className="product-image"
          />
        ) : (
          <div className="no-image-placeholder">No Image Available</div>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-name">{name}</h3>
        <p className="product-price">${price.toFixed(2)} USD</p>
        <div className="color-picker">
          <div className="color-swatches">
            {imageList.map((image, index) => (
              <div
                key={index}
                className={`color-swatch ${
                  index === activeIndex ? "active" : ""
                }`}
                style={{ backgroundColor: image.colorHex }}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <p className="color-name">
            {imageList[activeIndex] ? imageList[activeIndex].colorName : ""}
          </p>
        </div>
        <Rating score={ratingScore} />
      </div>
    </div>
  );
}

export default ProductCard;
