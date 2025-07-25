from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableSequence
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv
import streamlit as st
load_dotenv()

# Environment variables setup
google_api_key = os.getenv("GOOGLE_API_KEY")
langchain_api_key = os.getenv("LANGCHAIN_API_KEY")
project_id = os.getenv("LANGCHAIN_PROJECT_ID")


os.environ["LANGCHAIN_PROJECT_ID"] = project_id
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"]  = langchain_api_key


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


# llm
llm = ChatGoogleGenerativeAI(
    model="models/gemini-1.5-flash",
    google_api_key=google_api_key,
    temperature=2.0,
    max_output_tokens=1024,
    top_p=0.8,
)

# parser

output_parser = StrOutputParser()


# chain em all

chain = prompt | llm | output_parser

if input_text:
    # run the chain
    response = chain.invoke({"input": input_text})
    
    # display the response
    st.write("Response:", response)
