require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function aiChat(chatHistory, query, product) {
  if (!product.flag) {
    return "This post does not appear to be related to the product. No reply is needed.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Prepare the messages in a format accepted by the Gemini API
  const formattedHistory = chatHistory
    .map(({ role, content }) => ({ role, content })) // Ensure correct structure
    .concat([{ role: "user", content: query }]); // Add current user query

  // Construct the prompt to send to the API
  const prompt = `
    You are a helpful assistant replying to Reddit posts about the product "${
      product.name || "Product"
    }". Respond helpfully and concisely.

    Chat History:
    ${formattedHistory}

    User Query:
    ${query}
  `;
  try {
    // Send the prompt to the Gemini API to generate a response
    const result = await model.generateContent(prompt);

    return result.response.text().trim(); // Return the response text after trimming
  } catch (error) {
    console.error("Gemini API Chat Error:", error.message);
    return "Sorry, I'm unable to reply right now."; // Fallback message
  }
}

// Main function to test the AI chat
async function main() {
  // Sample chat history and query
  const chatHistory = [
    { role: "user", content: "I'm having issues with loading my dashboard." },
    {
      role: "assistant",
      content: "Can you describe what happens when you try to load it?",
    },
  ];

  const query = "It just shows a white screen and nothing happens.";
  const product = { name: "Website Builder Pro", flag: true }; // Example product object

  // Get AI's response based on the provided chat history, query, and product details
  const response = await aiChat(chatHistory, query, product);
  console.log(" AI says:", response);
}

main().catch(console.error);

module.exports = { aiChat };
