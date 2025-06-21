This project is handling adk agent which is sending request to tool/function then that fetches information from external fastapi end point.


for adk api_server and utilizing agent via api you need to use the following
http://127.0.0.1:9001/apps/pdfchat/users/u-123/sessions/s_123
http://127.0.0.1:9001/run

for handling api_server cors
adk api_server --allow_origins=http://localhost:5173 --host=0.0.0.0


Locally Serving LLM models via Ollama and then use them offline
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm

deepseek = LiteLlm(
    model="ollama/deepseek-r1:1.5b",  # <== MODIFIED: Added "ollama/" prefix
    model_provider="ollama",
    name="deepseek"
)

root_agent = Agent(
    model=deepseek,
    name="root_agent",
    description="A helpful assistant for user questions.",
    instruction="Answer user questions to the best of your knowledge.",
    tools=[],
)

# ... (rest of your code)
