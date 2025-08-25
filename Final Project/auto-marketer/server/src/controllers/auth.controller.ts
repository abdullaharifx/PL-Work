import { Request, Response } from "express";
import axios from "axios";
import User, { IUser } from "../models/User";
import { config } from "../config";
import snoowrap from "snoowrap";

export const initiateRedditAuth = (req: Request, res: Response) => {
  const { reddit } = config;
  const state = Math.random().toString(36).substring(7);

  // Store state in session for verification
  req.session = req.session || {};
  req.session.oauthState = state;

  const authUrl = `${reddit.authorizationEndpoint}?client_id=${reddit.clientId}&response_type=code&state=${state}&redirect_uri=${reddit.redirectUri}&duration=permanent&scope=${reddit.scope}`;

  res.redirect(authUrl.toString());
};

export const handleRedditCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const { reddit } = config;

  // Verify state to prevent CSRF
  if (state !== req.session?.oauthState) {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      reddit.tokenEndpoint,
      `grant_type=authorization_code&code=${code}&redirect_uri=${reddit.redirectUri}`,
      {
        auth: {
          username: reddit.clientId,
          password: reddit.clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": reddit.userAgent,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info from Reddit
    const userResponse = await axios.get("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": reddit.userAgent,
      },
    });

    const { id, name } = userResponse.data;

    // Find or create user
    let user: IUser | null = await User.findOne({ redditId: id });

    if (!user) {
      user = await User.create({
        username: name,
        redditId: id,
        redditAccessToken: access_token,
        redditRefreshToken: refresh_token,
        redditTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      });
    } else {
      // Update tokens
      user.redditAccessToken = access_token;
      user.redditRefreshToken = refresh_token;
      user.redditTokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      await user.save();
    }

    // Create session
    req.session = req.session || {};
    req.session.userId = user._id as string;

    // Return user info and tokens
    res.redirect(config.reddit.frontendRedirectUrl);
  } catch (error) {
    console.error("Reddit auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const refreshRedditToken = async (userId: string) => {
  const user = await User.findById(userId).select("+redditRefreshToken");
  if (!user) throw new Error("User not found");

  const { reddit } = config;

  try {
    const response = await axios.post(
      reddit.tokenEndpoint,
      `grant_type=refresh_token&refresh_token=${user.redditRefreshToken}`,
      {
        auth: {
          username: reddit.clientId,
          password: reddit.clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": reddit.userAgent,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    user.redditAccessToken = access_token;
    user.redditRefreshToken = refresh_token;
    user.redditTokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    await user.save();

    return access_token;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw new Error("Failed to refresh token");
  }
};

export const devLogin = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: "Necessary-Chair731" });

    if (!user) {
      return res.status(404).json({ error: "No users found in the database" });
    }

    // Create session
    req.session = req.session || {};
    req.session.userId = user._id as string;

    res
      .status(200)
      .json({ message: "Logged in as dev user", userId: user._id });
  } catch (error) {
    console.error("Dev login error:", error);
    res.status(500).json({ error: "Dev login failed" });
  }
};

export const getMyDetails = async (req: Request, res: Response) => {
  const redditClient = new snoowrap({
    userAgent: config.reddit.userAgent,
    accessToken: req.user.redditAccessToken,
  });

  const user = await redditClient.getMe().then((me: any) => me);

  const userDetails = {
    username: user.name,
    fullName: user.subreddit.title || "", // sometimes full name is stored in user's subreddit title
    karma: {
      linkKarma: user.link_karma,
      commentKarma: user.comment_karma,
    },
    createdAt: new Date(user.created_utc * 1000), // account creation time
  };

  res.status(200).json({
    status: "success",
    data: userDetails,
  });
};
