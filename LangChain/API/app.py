from fastapi import FastAPI
from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langserve import add_routes
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="LangChain Server",
              version="1.0",
              description="API Server.")
# Environment variables setup
google_api_key = os.getenv("GOOGLE_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")
langchain_api_key = os.getenv("LANGCHAIN_API_KEY")
project_id = os.getenv("LANGCHAIN_PROJECT_ID")


os.environ["LANGCHAIN_PROJECT_ID"] = project_id
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"]  = langchain_api_key
os.environ["GROQ_API_KEY"] = groq_api_key


# add routes
# add_routes(app,
#            ChatGoogleGenerativeAI()
#          )



## prompt template
prompt1 = ChatPromptTemplate.from_template(
    template="You are a helpful assistant that writes sarcastic remarks to the queries of the user. Query: {text}"
)

prompt2 = ChatPromptTemplate.from_template(
    template="You are a model that agrees with the queries of the user. No matter what the query says, just agree with it and explain why the user is right. Query: {text}"
)

## LLMs

try:
    llm1 = ChatGoogleGenerativeAI(
        model="models/gemini-1.5-flash",
        google_api_key=google_api_key,
        temperature=2.0,
        max_output_tokens=1024,
        top_p=0.8,
    )
except Exception as e:
    print("Gemini LLM Error:", e)

try:
    llm2 = ChatGroq(
        model="deepseek-r1-distill-llama-70b",
        temperature=1.2,
        max_tokens=1000,
        reasoning_format="parsed",
    )
except Exception as e:
    print("Groq LLM Error:", e)


# making chains

chain = prompt1 | llm1
chain2 = prompt2 | llm2

# adding routes with paths

add_routes(app, chain, path = "/sarcastic")
add_routes(app, chain2, path = "/unaware")

# two API have been added:
# 1. /sarcastic - for sarcastic responses using llm1
# 2. /unaware - for unaware responses using llm2

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
