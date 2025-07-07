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
    minPopularity: "",
    maxPopularity: "",
  });

  const fetchProducts = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.minPrice)
        params.append("minPrice", currentFilters.minPrice);
      if (currentFilters.maxPrice)
        params.append("maxPrice", currentFilters.maxPrice);
      if (currentFilters.minPopularity)
        params.append("minPopularity", currentFilters.minPopularity);
      if (currentFilters.maxPopularity)
        params.append("maxPopularity", currentFilters.maxPopularity);
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error(`Error! status: ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchProducts(filters);
  }, [fetchProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    const apiFilters = {
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minPopularity: filters.minPopularity
        ? parseFloat(filters.minPopularity) / 5
        : "",
      maxPopularity: filters.maxPopularity
        ? parseFloat(filters.maxPopularity) / 5
        : "",
    };
    fetchProducts(apiFilters);
  };

  return (
    <div className="App">
      <h1 className="main-title">Product List</h1>
      <div className="filter-bar">
        <div className="filter-group">
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            placeholder="Min Price"
            step="50"
          />
        </div>
        <div className="filter-group">
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            placeholder="Max Price"
            step="50"
          />
        </div>
        <div className="filter-group">
          <input
            type="number"
            name="minPopularity"
            value={filters.minPopularity}
            onChange={handleFilterChange}
            placeholder="Min Rating (1-5)"
            step="0.5"
            min="1"
            max="5"
          />
        </div>
        <div className="filter-group">
          <input
            type="number"
            name="maxPopularity"
            value={filters.maxPopularity}
            onChange={handleFilterChange}
            placeholder="Max Rating (1-5)"
            step="0.5"
            min="1"
            max="5"
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
