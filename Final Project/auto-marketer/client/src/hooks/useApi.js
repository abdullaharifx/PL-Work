"use client"

// Custom hook for API calls (useful for non-Redux API utilities)
import { useState, useCallback } from "react"

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const callApi = useCallback(async (url, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, this would be a fetch call
      // For now, we'll simulate API responses
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock response based on URL
      let mockResponse

      if (url.includes("reddit")) {
        mockResponse = { success: true, message: "Reddit API call successful" }
      } else if (url.includes("products")) {
        mockResponse = { success: true, data: [{ id: 1, name: "Product 1" }] }
      } else if (url.includes("outreaches")) {
        mockResponse = { success: true, data: [{ id: 1, subreddit: "r/marketing" }] }
      } else {
        mockResponse = { success: true, data: {} }
      }

      setData(mockResponse)
      setLoading(false)
      return mockResponse
    } catch (err) {
      setError(err.message || "An error occurred")
      setLoading(false)
      throw err
    }
  }, [])

  return { loading, error, data, callApi }
}
