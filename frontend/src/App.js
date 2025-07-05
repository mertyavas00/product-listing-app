import React, { useState, useEffect, useCallback } from "react";
import ProductList from "./components/ProductList";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
  });

  const fetchProducts = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.minPrice)
        params.append("minPrice", currentFilters.minPrice);
      if (currentFilters.maxPrice)
        params.append("maxPrice", currentFilters.maxPrice);
      const response = await fetch(
        `http://localhost:5000/api/products?${params.toString()}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  //Bileşen ilk yüklendiğinde tüm ürünleri çek
  useEffect(() => {
    fetchProducts(filters);
  }, [fetchProducts]); //fetchProducts'a bağlı

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchProducts(filters);
  };

  return (
    <div className="App">
      <h1 className="main-title">Product List</h1>
      {/* Filtre kontrol barı */}
      <div className="filter-bar">
        <div className="filter-group">
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            placeholder="Min Price"
          />
        </div>
        <div className="filter-group">
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            placeholder="Max Price"
          />
        </div>
        <button onClick={handleApplyFilters} className="filter-button">
          Apply Filters
        </button>
      </div>
      {loading ? (
        <div className="status-message">Loading products...</div>
      ) : error ? (
        <div className="status-message"> Error: {error} </div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  );
}

export default App;
