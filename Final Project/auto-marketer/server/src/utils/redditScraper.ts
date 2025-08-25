import axios from "axios";
import { config } from "../config";
import { IPost } from "../models/Post";
import { IOutreach } from "../models/Outreach";

interface ScrapeOptions {
  subreddits: string[];
  maxPosts: number;
  startDate: Date;
  endDate: Date;
  outreach: IOutreach["_id"];
  accessToken: string;
}

class RedditScraper {
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private readonly RATE_LIMIT = 60; // requests per minute
  private readonly RATE_WINDOW = 60000; // 1 minute in milliseconds
  private readonly userAgent: string;

  constructor(userAgent: string) {
    this.userAgent = userAgent;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset counter if a minute has passed
    if (timeSinceLastRequest >= this.RATE_WINDOW) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // If we've hit the rate limit, wait until we can make another request
    if (this.requestCount >= this.RATE_LIMIT) {
      const waitTime = this.RATE_WINDOW - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  private async fetchPostsFromSubreddit(
    subreddit: string,
    after: string | null = null,
    options: ScrapeOptions
  ): Promise<{ posts: Partial<IPost>[]; after: string | null }> {
    await this.rateLimit();

    const { maxPosts, startDate, endDate, accessToken, outreach } = options;

    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/new`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": this.userAgent,
          },
          params: {
            limit: 100, // Maximum allowed by Reddit
            after,
            before: Math.floor(endDate.getTime() / 1000),
            after_timestamp: Math.floor(startDate.getTime() / 1000),
          },
        }
      );

      const posts = response.data.data.children
        .map((post: any) => {
          const data = post.data;
          return {
            title: data.title,
            text: data.selftext,
            author: data.author,
            date: new Date(data.created_utc * 1000),
            subreddit: data.subreddit,
            url: `https://reddit.com${data.permalink}`,
            post_id: data.id,
            outreach,
          };
        })
        .filter((post: Partial<IPost>) => {
          const postDate = new Date(post.date!);
          return postDate >= startDate && postDate <= endDate;
        });

      return {
        posts,
        after: response.data.data.after,
      };
    } catch (error) {
      console.error(`Error fetching posts from r/${subreddit}:`, error);
      return { posts: [], after: null };
    }
  }

  public async scrapePosts(options: ScrapeOptions): Promise<Partial<IPost>[]> {
    const { subreddits, maxPosts, startDate, endDate } = options;
    const allPosts: Partial<IPost>[] = [];
    const postsPerSubreddit = Math.ceil(maxPosts / subreddits.length);

    for (const subreddit of subreddits) {
      let after: string | null = null;
      let subredditPosts: Partial<IPost>[] = [];

      while (subredditPosts.length < postsPerSubreddit) {
        const { posts, after: nextAfter } = await this.fetchPostsFromSubreddit(
          subreddit,
          after,
          options
        );

        if (posts.length === 0) break;

        subredditPosts = [...subredditPosts, ...posts];
        after = nextAfter;

        if (!after) break;
      }

      allPosts.push(...subredditPosts);
    }

    // Sort by date and limit to maxPosts
    return allPosts
      .sort((a, b) => b.date!.getTime() - a.date!.getTime())
      .slice(0, maxPosts);
  }
}

export const redditScraper = new RedditScraper(config.reddit.userAgent);
