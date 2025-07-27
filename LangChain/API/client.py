import streamlit as st
import requests

def get_groq_response(prompt):
    
    api_key = st.secrets["GROQ_API_KEY"]
    headers =