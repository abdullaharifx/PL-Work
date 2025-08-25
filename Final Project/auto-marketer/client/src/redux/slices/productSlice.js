import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createProductApiCall,
  deleteProductByIdApiCall,
  getAllProductsApiCall,
  getProductByIdApiCall,
  updateProductByIdApiCall,
} from "../../api/product.api";

// Mock data for products
const mockProducts = [
  {
    id: 1,
    name: "Product 1",
    description: "Description for product 1",
    keyword: "marketing, sales",
    domain: "ecommerce",
    location: {
      city: "New York",
      country: "United States",
    },
    price: 19.99,
  },
  {
    id: 2,
    name: "Product 2",
    description: "Description for product 2",
    keyword: "technology, software",
    domain: "saas",
    location: {
      city: "San Francisco",
      country: "United States",
    },
    price: 29.99,
  },
  {
    id: 3,
    name: "Product 3",
    description: "Description for product 3",
    keyword: "health, wellness",
    domain: "healthcare",
    location: {
      city: "London",
      country: "United Kingdom",
    },
    price: 39.99,
  },
];

// Async thunks for product CRUD operations
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllProductsApiCall();
      return response.data.map((p) => {
        return { id: p._id, ...p };
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getProductByIdApiCall(id);

      const product = {
        ...response.data,
        keywords: response.data.keywords.join(","),
        id: response.data._id,
      };

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      // Create a new product with a mock ID
      const newProduct = {
        id: Date.now(),
        ...productData,
        keywords: productData.keywords.split(",").map((word) => word.trim()),
      };

      // api call
      const response = await createProductApiCall(newProduct);

      if (response.status == "fail") {
        console.error(response.message);
      }

      return newProduct;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const updatedProduct = {
        ...productData,
        keywords: productData.keywords.split(",").map((word) => word.trim()),
      };

      const response = await updateProductByIdApiCall(
        updatedProduct.id,
        updatedProduct
      );

      if (response.status == "fail") {
        console.error(response.message);
      }

      return updatedProduct;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteProductByIdApiCall(id);

      if (response.status == "fail") {
        console.error(response.message);
      }

      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  success: false,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    clearProductSuccess: (state) => {
      state.success = false;
    },
    resetCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch products";
      })

      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch product";
      })

      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        state.success = true;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create product";
      })

      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.currentProduct = action.payload;
        state.success = true;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update product";
      })

      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
        state.success = true;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete product";
      });
  },
});

export const { clearProductError, clearProductSuccess, resetCurrentProduct } =
  productSlice.actions;
export default productSlice.reducer;
