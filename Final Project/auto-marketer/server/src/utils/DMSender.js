const { fetch } = require("undici");

const fs = require("fs");

// Reddit API credentials
const clientId = "ZyIo6XW92dYoZnJ7gyMQiQ";
const clientSecret = "3dUzngTJSh0bfA9jC_mx1gI00RE6Eg";
const username = "BloodmachineX";
const password = "a9812266";

// Reddit requires a detailed User-Agent in the format:
// <platform>:<app ID>:<version string> (by /u/<reddit username>)
const USER_AGENT = "script:MYBOT:v1.0.0 (by /u/Positive-Ice-8489)";

// Get access token using password flow
async function main() {
  try {
    console.log("Attempting to authenticate...");

    // Get access token
    const tokenResponse = await fetch(
      "https://www.reddit.com/api/v1/access_token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({
          grant_type: "password",
          username: username,
          password: password,
        }).toString(),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Failed to get access token:", tokenData);

      if (tokenData.error === "invalid_grant") {
        console.log("\nPossible solutions:");
        console.log("1. Check if your Reddit password is correct");
        console.log(
          "2. If you have 2FA enabled on your Reddit account, you cannot use password flow"
        );
        console.log("3. Reddit may be rate limiting your requests");
        console.log(
          "4. Try using the Reddit OAuth2 authorization code flow instead"
        );
      }

      return;
    }

    console.log("Successfully obtained access token");
    const accessToken = tokenData.access_token;

    // Send message
    const messageResponse = await fetch(
      "https://oauth.reddit.com/api/compose",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({
          api_type: "json",
          to: "RedditOutReachApp",
          subject: "Hi",
          text: "Hi there!",
        }).toString(),
      }
    );

    // Check response status
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error(`Error (${messageResponse.status}):`, errorText);
      return;
    }

    const messageData = await messageResponse.json();
    console.log("Message sent successfully:", messageData);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
