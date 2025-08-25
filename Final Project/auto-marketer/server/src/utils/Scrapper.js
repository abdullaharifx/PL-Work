const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

// Helper function to get OAuth2 access token
async function getAccessToken(clientId, clientSecret) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await axios.post(
    "https://www.reddit.com/api/v1/access_token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}

// Main function to fetch data from Reddit
async function get_data_from_reddit(subreddits, numPosts, dateRange) {
  // Validate inputs
  if (!Array.isArray(subreddits) || subreddits.length === 0) {
    throw new Error("Subreddits must be a non-empty array.");
  }
  if (typeof numPosts !== "number" || numPosts <= 0) {
    throw new Error("Number of posts must be a positive integer.");
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  // Get access token
  const accessToken = await getAccessToken(clientId, clientSecret);

  // Prepare results array
  const results = [];

  // Fetch data for each subreddit
  for (const subreddit of subreddits) {
    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/new`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "your-app-name",
          },
          params: {
            limit: 3,
            t: dateRange, // 'day', 'week', 'month', 'year', 'all'
          },
        }
      );

      // Extract relevant data from the response
      const posts = response.data.data.children.map((post, idx) => {
        const data = post.data;
        return {
          title: data.title,
          text: data.selftext,
          user: data.author,
          date: new Date(data.created_utc * 1000).toISOString(),
          subreddit: data.subreddit_name_prefixed,
          score: data.score,
          url: data.url,
          comments: data.num_comments,
        };
      });

      results.push(...posts);
    } catch (error) {
      console.error(
        `Error fetching data from subreddit /r/${subreddit}:`,
        error.message
      );
    }
  }

  return results;
}

// Function to convert data to CSV format
function convertToCSV(data) {
  if (data.length === 0) return "";

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.join(",");

  // Create CSV data rows
  const rows = data.map((obj) => {
    return headers
      .map((header) => {
        // Handle values that might contain commas by wrapping in quotes
        let value =
          obj[header] === null || obj[header] === undefined ? "" : obj[header];
        value = String(value).replace(/"/g, '""'); // Escape double quotes

        // If value contains commas, newlines, or double quotes, wrap in double quotes
        return /[,\n"]/.test(value) ? `"${value}"` : value;
      })
      .join(",");
  });

  // Combine header and data rows
  return headerRow + "\n" + rows.join("\n");
}

(async () => {
  try {
    const subreddits = ["ADHD_Programmers"];
    const numPosts = 60;
    const dateRange = "week"; // Options: 'day', 'week', 'month', 'year', 'all'

    const posts = await get_data_from_reddit(subreddits, numPosts, dateRange);

    // Convert posts to CSV format
    // const csvData = convertToCSV(posts);

    // Save to file
    // fs.writeFileSync("reddit_posts.csv", csvData);
    console.log("Data saved to reddit_posts.csv");
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
