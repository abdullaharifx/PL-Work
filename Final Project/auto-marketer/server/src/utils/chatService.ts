// services/chatService.ts
import Chat from "../models/Chat";
import { RedditService } from "./redditService";
import { IPost } from "../models/Post";
import { IUser } from "../models/User";
import { Types } from "mongoose";
import { config } from "../config";
import AIResponseGenerator from "./aiResponse";
import { IProduct } from "../models/Product";

class ChatService {
  public reddit: RedditService;

  constructor(accessToken: string) {
    this.reddit = new RedditService(accessToken);
  }

  async startAIChat(
    post: IPost,
    user: IUser,
    product: IProduct,
    outreachId: Types.ObjectId
  ) {
    const aiMessage = await AIResponseGenerator.generateInitialResponse(
      post,
      product
    );
    // const aiMessage = await this.generateAIMessage(post);

    const messageId = await this.reddit.sendDM(
      config.chat_test ? "ray_gilll" : post.author,
      `Re: ${post.title}`,
      aiMessage
    );

    return Chat.create({
      redditPostId: post.id,
      authorUsername: post.author,
      outreach: outreachId,
      initialMessage: {
        content: aiMessage,
        aiGenerated: true,
      },
      user: user._id,
      conversation: [
        {
          content: aiMessage,
          sender: "AI",
          redditMessageId: messageId,
          sentAt: new Date(),
        },
      ],
    });
  }
}

export default ChatService;
