import streamlit as st
import requests

def get_gemini_response(prompt):
    response = requests.post(
        "http://localhost:8000/sarcastic/invoke",
        json={"input": {"text": prompt}}
    )
    if response.status_code == 200:
        return response.json()["output"]["content"]
    else:
        st.error("Error fetching response from Gemini API")
        return None

def get_groq_response(prompt):
    response = requests.post(
        "http://localhost:8000/unaware/invoke",
        json={"input": {"text": prompt}}
    )
    if response.status_code == 200:
        return response.json()["output"]["content"]
    else:
        st.error("Error fetching response from Groq API")
        return None
    


if __name__ == "__main__":
    st.title("LangChain API Client")
    user_input = st.text_input("Enter your query:")
    # two separate buttons for each api call
    st.subheader("Get Responses from LLMs")
    if st.button("Get Gemini Response"):
        gemini_response = get_gemini_response(user_input)
        if gemini_response:
            st.subheader("Gemini Response:")
            st.write(gemini_response)
    if st.button("Get Groq Response"):
        groq_response = get_groq_response(user_input)
        if groq_response:
            st.subheader("Groq Response:")
            st.write(groq_response)