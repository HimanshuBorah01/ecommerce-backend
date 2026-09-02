import ApiError from "../utils/ApiError.js";
import {
  MIN_SEARCH_QUERY_LENGTH,
  DEFAULT_AUTOCOMPLETE_LIMIT,
  MAX_AUTOCOMPLETE_LIMIT,
} from "../constants/search.constants.js";

import Product from "../models/product.model.js";

class ProductSearchService {
  async autocomplete({ query, limit = DEFAULT_AUTOCOMPLETE_LIMIT }) {
    // Ensure query is a string
    if (typeof query !== "string") {
      throw new ApiError(400, "Search query must be a string");
    }

    // Remove leading and trailing spaces and normalize case
    const searchQuery = query.trim();

    // Minimum query length
    if (searchQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      throw new ApiError(
        400,
        `Search query must be at least ${MIN_SEARCH_QUERY_LENGTH} characters long`,
      );
    }

    // Validate limit
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_AUTOCOMPLETE_LIMIT
    ) {
      throw new ApiError(
        400,
        `Limit must be an integer between 1 and ${MAX_AUTOCOMPLETE_LIMIT}`,
      );
    }

    // Escape regex special characters to prevent unintended regex patterns.
    const escapedSearchQuery = searchQuery.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    // Search matching products by name or category.
    const products = await Product.find({
      $or: [
        {
          name: {
            $regex: escapedSearchQuery,
            $options: "i",
          },
        },
        {
          category: {
            $regex: escapedSearchQuery,
            $options: "i",
          },
        },
      ],
    })
      // Fetch only required fields for autocomplete.
      .select("_id name category")
      .limit(limit)
      // Return plain JavaScript objects for better performance.
      .lean();

    // Return early if no matching products are found.
    if (products.length === 0) {
      return [];
    }

    // Keep category suggestions unique.
    const categorySuggestions = [];
    const seenCategories = new Set();

    for (const product of products) {
      // Skip duplicate categories
      if (!seenCategories.has(product.category)) {
        seenCategories.add(product.category);

        categorySuggestions.push({
          _id: null,
          name: product.category,
          type: "category",
        });
      }
    }

    // Convert products into autocomplete suggestions.
    const productSuggestions = products.map((product) => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      type: "product",
    }));

    // Show categories first, followed by matching products.
    return [...categorySuggestions, ...productSuggestions];
  }
}

const productSearchService = new ProductSearchService();

export default productSearchService;
