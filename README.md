This project is handling adk agent which is sending request to tool/function then that fetches information from external fastapi end point.


for adk api_server and utilizing agent via api you need to use the following
http://127.0.0.1:9001/apps/pdfchat/users/u-123/sessions/s_123
http://127.0.0.1:9001/run

for handling api_server cors
adk api_server --allow_origins=http://localhost:5173 --host=0.0.0.0


Locally Serving LLM models via Ollama and then use them offline
from google.adk.agents import Agent, LlmAgent
from google.adk.models.lite_llm import LiteLlm

llama_model = LiteLlm(
    model="ollama/llama3.2:1b",  # <== MODIFIED: Added "ollama/" prefix
    model_provider="ollama",
    name="llama3.2"
)

root_agent = LlmAgent(
    model=llama_model,
    name="llama",
    description="",
    instruction=("Answer questions directly and concisely. Provide a brief explanation when helpful, "
                 "but avoid greetings, introductions, or extra commentary. Do not say you're an AI. "
                 "Focus on factual and helpful answers only."),
    tools=[],
)

# ... (rest of your code)

