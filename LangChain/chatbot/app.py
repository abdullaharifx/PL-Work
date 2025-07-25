from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableSequence
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv
# streamlit
import streamlit as st

os.environ["LANGCHAIN_API_KEY"]  = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_PROJECT_ID"] = os.getenv("LANGCHAIN_PROJECT_ID")


## prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful assistant that answers the quiestions of the user."),
        ("human", "Question: {input}"),
    ]
)

## streamlit framework
st.title("LangChain AI Chatbot")
input_text = st.text_input("Ask a question:")
llm = ChatGoogleGenerativeAI(
    model="models/gemini-1.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=2.0,
    max_output_tokens=1024,
    top_p=0.8,
)
