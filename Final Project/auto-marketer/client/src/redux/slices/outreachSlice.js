import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOutreachApiCall,
  deleteOutreachByIdApiCall,
  getAllOutreachesApiCall,
  getOutreachByIdApiCall,
  runOutreachByIdApiCall,
  updateOutreachByIdApiCall,
} from "../../api/outreach.api";
import {
  getAllPostsApiCall,
  getRelevantPostsApiCall,
} from "../../api/outreachPosts.api";
import { suggestSubredditsApiCall } from "../../api/product.api";
import { initiateConversationApiCall } from "../../api/chat.api";
import toast from "react-hot-toast";

// Mock data for outreaches
const mockOutreaches = [
  {
    id: 1,
    subreddits: ["r/marketing", "r/smallbusiness"],
    productId: 1,
    productName: "Product 1",
    status: "active",
    dateRange: {
      startDate: "2023-05-01",
      endDate: "2023-05-15",
    },
    maxPosts: 100,
    replyType: "autoReplyOnce",
    createdAt: "2023-05-15",
  },
  {
    id: 2,
    subreddits: ["r/entrepreneur"],
    productId: 2,
    productName: "Product 2",
    status: "pending",
    dateRange: {
      startDate: "2023-05-10",
      endDate: "2023-05-20",
    },
    maxPosts: 50,
    replyType: "manualReplyOnce",
    replyMessage:
      "Hi, I think our product might help with your needs. Check it out!",
    createdAt: "2023-05-16",
  },
  {
    id: 3,
    subreddits: ["r/startups", "r/SaaS", "r/technology"],
    productId: 3,
    productName: "Product 3",
    status: "completed",
    dateRange: {
      startDate: "2023-04-15",
      endDate: "2023-05-10",
    },
    maxPosts: 200,
    replyType: "autoReplyComplete",
    createdAt: "2023-05-17",
  },
];

// Mock posts data
const mockPosts = [
  {
    id: "post1",
    title: "Looking for a marketing tool to help with social media management",
    text: "I'm running a small business and need a tool to help me manage my social media accounts. Any recommendations?",
    author: "small_biz_owner",
    date: "2023-05-05T12:30:00Z",
    subreddit: "r/marketing",
    url: "https://reddit.com/r/marketing/comments/post1",
    outreach: "680bfede3903d8476a7b3a20",
    post_id: "post1",
    canSolve: true,
    createdAt: "2023-05-05T12:30:00Z",
    updatedAt: "2023-05-05T12:30:00Z",
  },
  {
    id: "post2",
    title: "Best tools for small business marketing?",
    text: "I'm looking to expand my marketing efforts but don't have a huge budget. What tools would you recommend?",
    author: "entrepreneur123",
    date: "2023-05-07T09:15:00Z",
    subreddit: "r/smallbusiness",
    url: "https://reddit.com/r/smallbusiness/comments/post2",
    outreach: 1,
    post_id: "post2",
    canSolve: true,
    createdAt: "2023-05-07T09:15:00Z",
    updatedAt: "2023-05-07T09:15:00Z",
  },
  {
    id: "post3",
    title: "Need advice on scaling my SaaS business",
    text: "I've built a SaaS product that's gaining traction, but I'm not sure how to scale effectively. Any advice from those who've been there?",
    author: "saas_founder",
    date: "2023-05-02T15:45:00Z",
    subreddit: "r/startups",
    url: "https://reddit.com/r/startups/comments/post3",
    outreach: 3,
    post_id: "post3",
    canSolve: true,
    createdAt: "2023-05-02T15:45:00Z",
    updatedAt: "2023-05-02T15:45:00Z",
  },
  {
    id: "post4",
    title: "How to find the right tech stack for my startup?",
    text: "I'm starting a new tech company and trying to decide on the right tech stack. What factors should I consider?",
    author: "tech_startup_ceo",
    date: "2023-05-03T11:20:00Z",
    subreddit: "r/technology",
    url: "https://reddit.com/r/technology/comments/post4",
    outreach: 3,
    post_id: "post4",
    canSolve: true,
    createdAt: "2023-05-03T11:20:00Z",
    updatedAt: "2023-05-03T11:20:00Z",
  },
  {
    id: "post5",
    title: "Looking for a co-founder for my new venture",
    text: "I have a business idea in the e-commerce space and I'm looking for a technical co-founder. How should I approach this?",
    author: "future_founder",
    date: "2023-05-08T14:10:00Z",
    subreddit: "r/entrepreneur",
    url: "https://reddit.com/r/entrepreneur/comments/post5",
    outreach: "680bfede3903d8476a7b3a20",
    post_id: "post5",
    canSolve: true,
    createdAt: "2023-05-08T14:10:00Z",
    updatedAt: "2023-05-08T14:10:00Z",
  },
];

// Mock suggested subreddits based on product ID
const mockSuggestedSubreddits = {
  "680ab2a7f0669481e8ed2b26": [
    "digitalmarketing",
    "socialmedia",
    "contentmarketing",
    "marketingcareers",
  ],
  2: ["smallbusiness", "entrepreneurship", "business_ideas", "startups"],
  3: ["webdev", "programming", "techstartups", "javascript"],
};

// Mock analytics data
const mockAnalytics = {
  totalPosts: 325,
  totalReplies: 87,
  responseRate: 26.8,
  conversionRate: 8.3,
  dailyEngagement: [
    { date: "May 1", views: 45, replies: 12, clicks: 8 },
    { date: "May 2", views: 52, replies: 15, clicks: 10 },
    { date: "May 3", views: 48, replies: 10, clicks: 7 },
    { date: "May 4", views: 60, replies: 18, clicks: 12 },
    { date: "May 5", views: 55, replies: 14, clicks: 9 },
    { date: "May 6", views: 65, replies: 18, clicks: 11 },
  ],
  engagementDistribution: [
    { name: "Views Only", value: 238 },
    { name: "Replied", value: 87 },
    { name: "Clicked Link", value: 47 },
    { name: "Converted", value: 27 },
  ],
  conversionFunnel: [
    { name: "Views", value: 325 },
    { name: "Replies", value: 87 },
    { name: "Clicks", value: 47 },
    { name: "Leads", value: 32 },
    { name: "Conversions", value: 27 },
  ],
  keyMetrics: [
    { name: "Average Response Time", value: "2.4 hours", change: 5 },
    { name: "Click-through Rate", value: "14.5%", change: 2.3 },
    { name: "Cost per Lead", value: "$4.25", change: -8.2 },
    { name: "ROI", value: "215%", change: 12.7 },
    { name: "Engagement Score", value: "7.8/10", change: 0.5 },
  ],
  subredditPerformance: [
    { name: "r/marketing", views: 120, replies: 35, conversions: 12 },
    { name: "r/smallbusiness", views: 85, replies: 28, conversions: 9 },
    { name: "r/entrepreneur", views: 65, replies: 15, conversions: 4 },
    { name: "r/startups", views: 55, replies: 9, conversions: 2 },
  ],
  subredditDetails: [
    {
      name: "r/marketing",
      posts: 45,
      replies: 35,
      responseRate: 77.8,
      conversionRate: 34.3,
    },
    {
      name: "r/smallbusiness",
      posts: 38,
      replies: 28,
      responseRate: 73.7,
      conversionRate: 32.1,
    },
    {
      name: "r/entrepreneur",
      posts: 32,
      replies: 15,
      responseRate: 46.9,
      conversionRate: 26.7,
    },
    {
      name: "r/startups",
      posts: 25,
      replies: 9,
      responseRate: 36.0,
      conversionRate: 22.2,
    },
  ],
};

const formatDateFromISO = (isoString) => {
  const dateOnly = isoString.split("T")[0];
  return dateOnly;
};

// Async thunks for outreach CRUD operations
export const fetchOutreaches = createAsyncThunk(
  "outreaches/fetchOutreaches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllOutreachesApiCall();

      if (response.status == "fail") {
        throw error({ message: response.message });
      }

      return response.data.map((o) => {
        return {
          ...o,
          id: o._id,
          startDate: formatDateFromISO(o.startDate),
          endDate: formatDateFromISO(o.endDate),
          createdAt: formatDateFromISO(o.createdAt),
        };
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOutreachById = createAsyncThunk(
  "outreaches/fetchOutreachById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getOutreachByIdApiCall(id);

      if (response.status == "fail") {
        throw error({ message: response.message });
      }

      const o = response.data;
      const outreach = {
        id: o._id,
        ...o,
        product: {
          ...o.product,
          id: o.product._id,
        },
        startDate: formatDateFromISO(o.startDate),
        endDate: formatDateFromISO(o.endDate),
        createdAt: formatDateFromISO(o.createdAt),
      };

      if (!outreach) {
        throw new Error("Outreach not found");
      }

      return outreach;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOutreachAnalytics = createAsyncThunk(
  "outreaches/fetchOutreachAnalytics",
  async (id, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 700));

      // In a real app, we would fetch analytics specific to this outreach
      // For now, return mock analytics data
      return mockAnalytics;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOutreach = createAsyncThunk(
  "outreaches/createOutreach",
  async (outreachData, { rejectWithValue }) => {
    try {
      // Create a new outreach with a mock ID
      const newOutreach = {
        ...outreachData,
        startDate: new Date(outreachData.dateRange.startDate).toISOString(),
        endDate: new Date(outreachData.dateRange.endDate).toISOString(),
        product: outreachData.productId,
      };

      const response = await createOutreachApiCall(newOutreach);

      if (response.status == "fail") {
        console.error(response.message);
      }

      return newOutreach;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOutreach = createAsyncThunk(
  "outreaches/updateOutreach",
  async (outreachData, { rejectWithValue }) => {
    try {
      const updatedOutreach = {
        ...outreachData,
        startDate: new Date(outreachData.dateRange.startDate).toISOString(),
        endDate: new Date(outreachData.dateRange.endDate).toISOString(),
        product: outreachData.productId,
      };

      const response = await updateOutreachByIdApiCall(
        updatedOutreach.id,
        updatedOutreach
      );

      if (response.status == "fail") {
        console.error(response.message);
      }

      return updatedOutreach;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteOutreach = createAsyncThunk(
  "outreaches/deleteOutreach",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteOutreachByIdApiCall(id);

      if (response.status == "fail") {
        console.error(response.message);
      }

      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add the new runOutreach thunk after the deleteOutreach thunk and before fetchOutreachPosts
export const runOutreach = createAsyncThunk(
  "outreaches/runOutreach",
  async (id, { rejectWithValue }) => {
    try {
      const response = await runOutreachByIdApiCall(id);

      if (response.status == "fail") {
        throw error({ message: response.message });
      }

      return {
        id,
        success: true,
        message: "Outreach campaign started successfully",
      };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to run outreach campaign"
      );
    }
  }
);

// New thunk for suggesting subreddits based on product
export const suggestSubreddits = createAsyncThunk(
  "outreaches/suggestSubreddits",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await suggestSubredditsApiCall(productId);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to get subreddit suggestions"
      );
    }
  }
);

// New thunk for fetching posts for an outreach
export const fetchOutreachPosts = createAsyncThunk(
  "outreaches/fetchOutreachPosts",
  async (outreachId, { rejectWithValue }) => {
    try {
      const relevantPostsResponse = await getRelevantPostsApiCall(outreachId);
      const AllPostsResponse = await getAllPostsApiCall(outreachId);

      const response = {
        relevant: relevantPostsResponse.data.map((p) => {
          return {
            ...p,
            id: p._id,
          };
        }),
        all: AllPostsResponse.data.map((p) => {
          return {
            ...p,
            id: p._id,
          };
        }),
      };
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// New thunk for initiating a conversation
export const initiateConversation = createAsyncThunk(
  "outreaches/initiateConversation",
  async ({ outreachId, postId, message }, { rejectWithValue }) => {
    try {
      console.log("in");
      const response = await initiateConversationApiCall(outreachId, postId);

      console.log(response);

      // In a real app, this would create a conversation in the backend
      return { postId, success: true, message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  outreaches: [],
  currentOutreach: null,
  analytics: null,
  loading: false,
  error: null,
  success: false,
  posts: [],
  postsLoading: false,
  suggestedSubreddits: [],
  initiatingConversation: false,
  conversationInitiated: false,
  runningOutreach: false,
  outreachRunSuccess: false,
  initiateSuccess: false,
};

const outreachSlice = createSlice({
  name: "outreaches",
  initialState,
  reducers: {
    clearOutreachError: (state) => {
      state.error = null;
    },
    clearOutreachSuccess: (state) => {
      state.success = false;
    },
    resetCurrentOutreach: (state) => {
      state.currentOutreach = null;
    },
    resetOutreachPosts: (state) => {
      state.posts = [];
    },
    resetConversationState: (state) => {
      state.conversationInitiated = false;
    },
    // Add resetOutreachRunSuccess to the reducers
    resetOutreachRunSuccess: (state) => {
      state.outreachRunSuccess = false;
    },
    clearSuggestedSubreddits: (state) => {
      state.suggestedSubreddits = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch outreaches
      .addCase(fetchOutreaches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutreaches.fulfilled, (state, action) => {
        state.loading = false;
        state.outreaches = action.payload;
      })
      .addCase(fetchOutreaches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch outreaches";
      })

      // Fetch outreach by ID
      .addCase(fetchOutreachById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutreachById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOutreach = action.payload;
      })
      .addCase(fetchOutreachById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch outreach";
      })

      // Fetch outreach analytics
      .addCase(fetchOutreachAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutreachAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchOutreachAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch analytics";
      })

      // Create outreach
      .addCase(createOutreach.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOutreach.fulfilled, (state, action) => {
        state.loading = false;
        state.outreaches.push(action.payload);
        state.success = true;
      })
      .addCase(createOutreach.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create outreach";
      })

      // Update outreach
      .addCase(updateOutreach.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateOutreach.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.outreaches.findIndex(
          (o) => o.id === action.payload.id
        );
        if (index !== -1) {
          state.outreaches[index] = action.payload;
        }
        state.currentOutreach = action.payload;
        state.success = true;
      })
      .addCase(updateOutreach.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update outreach";
      })

      // Delete outreach
      .addCase(deleteOutreach.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOutreach.fulfilled, (state, action) => {
        state.loading = false;
        state.outreaches = state.outreaches.filter(
          (o) => o.id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteOutreach.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete outreach";
      })

      // Add the runOutreach cases to the extraReducers builder
      // Add these cases after the deleteOutreach cases and before the fetchOutreachPosts cases
      .addCase(runOutreach.pending, (state) => {
        state.runningOutreach = true;
        state.error = null;
        state.outreachRunSuccess = false;
      })
      .addCase(runOutreach.fulfilled, (state) => {
        state.runningOutreach = false;
        state.outreachRunSuccess = true;
      })
      .addCase(runOutreach.rejected, (state, action) => {
        state.runningOutreach = false;
        state.error = action.payload || "Failed to run outreach campaign";
      })

      // Fetch outreach posts
      .addCase(fetchOutreachPosts.pending, (state) => {
        state.postsLoading = true;
        state.error = null;
      })
      .addCase(fetchOutreachPosts.fulfilled, (state, action) => {
        state.postsLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchOutreachPosts.rejected, (state, action) => {
        state.postsLoading = false;
        state.error = action.payload || "Failed to fetch posts";
      })

      // Add the suggestSubreddits cases
      .addCase(suggestSubreddits.pending, (state) => {
        state.suggestingSubreddits = true;
        state.error = null;
      })
      .addCase(suggestSubreddits.fulfilled, (state, action) => {
        state.suggestingSubreddits = false;
        state.suggestedSubreddits = action.payload;
      })
      .addCase(suggestSubreddits.rejected, (state, action) => {
        state.suggestingSubreddits = false;
        state.error = action.payload || "Failed to get subreddit suggestions";
      })

      // Initiate conversation
      .addCase(initiateConversation.pending, (state) => {
        state.initiatingConversation = true;
        state.error = null;
        state.initiateSuccess = null;
      })
      .addCase(initiateConversation.fulfilled, (state) => {
        state.initiatingConversation = false;
        state.conversationInitiated = true;
        state.initiateSuccess = true;
      })
      .addCase(initiateConversation.rejected, (state, action) => {
        state.initiatingConversation = false;
        state.error = action.payload || "Failed to initiate conversation";
        state.initiateSuccess = false;
      });
  },
});

export const {
  clearOutreachError,
  clearOutreachSuccess,
  resetCurrentOutreach,
  resetOutreachPosts,
  resetConversationState,
  resetOutreachRunSuccess,
  clearSuggestedSubreddits,
} = outreachSlice.actions;
export default outreachSlice.reducer;
