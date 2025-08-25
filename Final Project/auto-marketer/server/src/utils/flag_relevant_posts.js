const { get_data_from_reddit } = require("./Scrapper");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzePostsBatch(posts, product) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const formattedPosts = posts
    .map((post, i) => {
      const content = `${post.title}\n\n${post.text || post.content || ""}`;
      return `Post #${i + 1}:\n${content}`;
    })
    .join("\n\n---\n\n");

  const prompt = `
You are an intelligent assistant helping with customer support.

Below is a list of Reddit posts separated by "---".

Your task is to determine for EACH post:
- Is the post related to the product "${product}"?

Return ONLY a list of "true" or "false", one for each post, in order. Example: true, false, false, true
---

${formattedPosts}
`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim().toLowerCase();

    const flags = rawText
      .split(/[\s,]+/)
      .filter((v) => v === "true" || v === "false")
      .map((v) => v === "true");

    return flags;
  } catch (error) {
    console.error("Gemini API error:", error);
    return posts.map(() => false); // fallback
  }
}

async function flagRelevantPosts(posts, product) {
  const BATCH_SIZE = 1000;
  const flaggedPosts = [];
  const startTime = Date.now();

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const flags = await analyzePostsBatch(batch, product);

    const combined = batch.map((post, idx) => ({
      ...post,
      flag: flags[idx] || false,
    }));

    flaggedPosts.push(...combined);
  }

  // const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  // console.log(` Total API processing time: ${totalTime} seconds`);

  return flaggedPosts;
}

/// Demo
async function main() {
  const product = "iphone";
  const subreddits = ["phone", "apple"];
  const numPosts = 2000;
  const dateRange = "week";

  const posts = await get_data_from_reddit(subreddits, numPosts, dateRange);
  const analyzedPosts = await flagRelevantPosts(posts, product);

  console.log(analyzedPosts);
}

main().catch(console.error);
