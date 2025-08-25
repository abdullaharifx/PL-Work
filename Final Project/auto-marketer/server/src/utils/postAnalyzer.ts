import { GoogleGenerativeAI } from "@google/generative-ai";
import { IPost } from "../models/Post";
import { IProduct } from "../models/Product";
import { config } from "../config";

class PostAnalyzer {
  private genAI: GoogleGenerativeAI;
  private readonly BATCH_SIZE = 10;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }

  private async analyzePostsBatch(
    posts: Partial<IPost>[],
    product: IProduct
  ): Promise<boolean[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const formattedPosts = posts
      .map((post, i) => {
        const content = `${post.title}\n\n${post.text || ""}`;
        return `Post #${i + 1}:\n${content}`;
      })
      .join("\n\n---\n\n");

    const prompt = `
You are an intelligent assistant helping to identify potential customers for a product.

Product Information:
- Name: ${product.name}
- Description: ${product.description}
- Keywords: ${product.keywords.join(", ")}
- Domain: ${product.domain}

Below is a list of Reddit posts separated by "---".

Your task is to determine for EACH post:
- Can our product solve the problem or meet the need expressed in the post?
- Consider the product's description, keywords, and domain when making your decision.
- Be strict in your assessment - only mark as true if there's a clear match.

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

      // Ensure we have the correct number of flags
      if (flags.length !== posts.length) {
        console.warn(`Expected ${posts.length} flags but got ${flags.length}`);
        return posts.map(() => false);
      }

      return flags;
    } catch (error) {
      console.error("Gemini API error:", error);
      return posts.map(() => false); // fallback to false on error
    }
  }

  public async analyzePosts(
    posts: Partial<IPost>[],
    product: IProduct
  ): Promise<Partial<IPost>[]> {
    const analyzedPosts: Partial<IPost>[] = [];
    const startTime = Date.now();

    // Process posts in batches
    for (let i = 0; i < posts.length; i += this.BATCH_SIZE) {
      const batch = posts.slice(i, i + this.BATCH_SIZE);
      const flags = await this.analyzePostsBatch(batch, product);

      // Combine posts with their analysis results
      const analyzedBatch = batch.map((post, idx) => ({
        ...post,
        canSolve: flags[idx] || false,
      }));

      analyzedPosts.push(...analyzedBatch);

      // Log progress
      const progress = Math.min(100, ((i + batch.length) / posts.length) * 100);
      console.log(`Analyzed ${progress.toFixed(1)}% of posts`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Analysis completed in ${totalTime} seconds`);

    return analyzedPosts;
  }
}

export const postAnalyzer = new PostAnalyzer();
