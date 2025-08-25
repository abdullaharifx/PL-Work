import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Mock data for conversations
const mockConversations = [
  {
    id: 1,
    redditUser: {
      username: "tech_enthusiast42",
      avatar:
        "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png",
    },
    subreddit: "technology",
    postId: "abc123",
    messages: [
      {
        id: 1,
        sender: "reddit_user",
        content:
          "I'm looking for a new SaaS tool to help with project management. Any recommendations?",
        timestamp: "2023-05-20T14:30:00Z",
        postLink: "https://reddit.com/r/technology/comments/abc123",
      },
      {
        id: 2,
        sender: "user",
        content:
          "Our product might be exactly what you're looking for! It has task management, time tracking, and team collaboration features.",
        timestamp: "2023-05-20T14:35:00Z",
      },
      {
        id: 3,
        sender: "reddit_user",
        content:
          "That sounds interesting. Does it integrate with other tools like Slack or GitHub?",
        timestamp: "2023-05-20T14:40:00Z",
      },
      {
        id: 4,
        sender: "user",
        content:
          "Yes, we have integrations with both Slack and GitHub, plus many other popular tools. I can send you a link to our documentation if you'd like to see the full list.",
        timestamp: "2023-05-20T14:45:00Z",
      },
    ],
    unreadCount: 0,
    lastActivity: "2023-05-20T14:45:00Z",
  },
  {
    id: 2,
    redditUser: {
      username: "startup_founder",
      avatar:
        "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_3.png",
    },
    subreddit: "startups",
    postId: "def456",
    messages: [
      {
        id: 1,
        sender: "reddit_user",
        content:
          "Just launched my startup and looking for affordable marketing solutions. Any advice?",
        timestamp: "2023-05-19T10:15:00Z",
        postLink: "https://reddit.com/r/startups/comments/def456",
      },
      {
        id: 2,
        sender: "user",
        content:
          "Congratulations on your launch! Our marketing platform is designed specifically for startups with limited budgets. We offer targeted Reddit advertising and analytics.",
        timestamp: "2023-05-19T10:20:00Z",
      },
      {
        id: 3,
        sender: "reddit_user",
        content: "That sounds perfect. What kind of pricing do you offer?",
        timestamp: "2023-05-19T10:25:00Z",
      },
    ],
    unreadCount: 1,
    lastActivity: "2023-05-19T10:25:00Z",
  },
  {
    id: 3,
    redditUser: {
      username: "digital_marketer",
      avatar:
        "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_5.png",
    },
    subreddit: "marketing",
    postId: "ghi789",
    messages: [
      {
        id: 1,
        sender: "reddit_user",
        content:
          "Has anyone tried Reddit ads for B2B marketing? What was your experience?",
        timestamp: "2023-05-18T16:05:00Z",
        postLink: "https://reddit.com/r/marketing/comments/ghi789",
      },
      {
        id: 2,
        sender: "user",
        content:
          "We've had great success with Reddit ads for B2B. Our platform can help you target specific subreddits where your potential clients hang out.",
        timestamp: "2023-05-18T16:10:00Z",
      },
      {
        id: 3,
        sender: "reddit_user",
        content:
          "Interesting. What kind of ROI have your clients typically seen?",
        timestamp: "2023-05-18T16:15:00Z",
      },
      {
        id: 4,
        sender: "user",
        content:
          "Our clients typically see a 3-5x ROI within the first three months. We focus on highly targeted campaigns to maximize conversion rates.",
        timestamp: "2023-05-18T16:20:00Z",
      },
      {
        id: 5,
        sender: "reddit_user",
        content:
          "That's impressive. Do you have any case studies I could look at?",
        timestamp: "2023-05-18T16:25:00Z",
      },
    ],
    unreadCount: 1,
    lastActivity: "2023-05-18T16:25:00Z",
  },
];

// Async thunks for chat operations
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockConversations;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchConversationById = createAsyncThunk(
  "chat/fetchConversationById",
  async (id, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const conversation = mockConversations.find(
        (c) => c.id === Number.parseInt(id)
      );

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return conversation;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ conversationId, content, sender }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Create a new message
      const newMessage = {
        id: Date.now(),
        sender,
        content,
        timestamp: new Date().toISOString(),
      };

      return { conversationId, message: newMessage };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  conversations: [],
  activeConversation: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      // Mark messages as read
      if (action.payload) {
        const conversation = state.conversations.find(
          (c) => c.id === action.payload.id
        );
        if (conversation) {
          conversation.unreadCount = 0;
        }
      }
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        // Set active conversation to the first one if none is selected
        if (!state.activeConversation && action.payload.length > 0) {
          state.activeConversation = action.payload[0];
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch conversations";
      })

      // Fetch conversation by ID
      .addCase(fetchConversationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConversation = action.payload;
        // Update the conversation in the list if it exists
        const index = state.conversations.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) {
          state.conversations[index] = action.payload;
        }
      })
      .addCase(fetchConversationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch conversation";
      })

      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        // Add message to the active conversation
        if (
          state.activeConversation &&
          state.activeConversation.id === conversationId
        ) {
          state.activeConversation.messages.push(message);
          state.activeConversation.lastActivity = message.timestamp;
        }
        // Update the conversation in the list
        const conversation = state.conversations.find(
          (c) => c.id === conversationId
        );
        if (conversation) {
          conversation.messages.push(message);
          conversation.lastActivity = message.timestamp;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload || "Failed to send message";
      });
  },
});

export const { setActiveConversation, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
