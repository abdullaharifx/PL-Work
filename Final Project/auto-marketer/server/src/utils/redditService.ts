// services/redditService.ts
import axios from "axios";
import { config } from "../config";
import fs from "fs";
import { AppError } from "../middleware/error.middleware";
import snoowrap from "snoowrap";
export interface RedditMessage {
  id: string;
  author: string;
  body: string;
  created_utc: number;
  subject?: string;
  was_comment: boolean;
}

export class RedditService {
  private accessToken: string;
  private redditClient: snoowrap;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.redditClient = new snoowrap({
      userAgent: config.reddit.userAgent,
      accessToken: this.accessToken,
    });
  }

  // Send direct message
  async sendDM(to: string, subject: string, text: string): Promise<string> {
    const response = await axios.post(
      "https://oauth.reddit.com/api/compose",
      new URLSearchParams({
        api_type: "json",
        subject,
        text,
        to,
      }),
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": config.reddit.userAgent,
        },
      }
    );

    if (response.data.json?.errors?.length > 0) {
      const errorMessage = `Reddit API Error: ${JSON.stringify(
        response.data.json.errors
      )}`;
      throw new AppError(errorMessage, 400);
    }

    const messages = await this.redditClient.getSentMessages({ limit: 1 });
    const messageId = messages[0].id;

    return messageId; // Returns message ID
  }

  // Get messages with pagination
  async getMessages(after?: string): Promise<RedditMessage[]> {
    const params = new URLSearchParams();
    params.append("limit", "100");
    if (after) params.append("after", `t4_${after}`);

    const response = await axios.get("https://oauth.reddit.com/message/inbox", {
      params,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "User-Agent": config.reddit.userAgent,
      },
    });

    return response.data.data.children.map((msg: any) => ({
      id: msg.data.name,
      author: msg.data.author,
      body: msg.data.body,
      created_utc: msg.data.created_utc,
      subject: msg.data.subject,
      was_comment: msg.data.was_comment,
    }));
  }
}
