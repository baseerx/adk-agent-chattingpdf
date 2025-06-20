from google.adk.agents import Agent
import requests

def chatpdf(query: str):
    """
    This is pdf chat function that initializes the root agent, It fetches the PDF text and respond to queries as per the user request.
    It uses the Google Generative AI model to answer questions based on the PDF content.
    It also handles queries related to thesis, research papers, and other academic documents.
    """
    try:
        url = "http://127.0.0.1:9000/webhook"
        response = requests.post(url, json={"query": query})
        # Added for debugging
        print(
            f"Response from webhook: {response.status_code} - {response.text}")
        if response.status_code == 200:
            json_response = response.json()
            # Crucial: Extract the actual response string
            if "response" in json_response:
                return json_response["response"]
            else:
                # If webhook returns unexpected JSON, log it
                print(
                    f"Webhook response missing 'response' key: {json_response}")
                return "Error: Webhook returned unexpected data."
        else:
            return f"Error occurred during webhook call: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Error occurred during thesischat execution: {str(e)}"


# Define the root agent for handling user questions
# This agent will use the PDF text chunks and embeddings to answer questions.
root_agent = Agent(
    model='gemini-2.0-flash-001',
    name='root_agent',
    description='A helpful assistant for user questions regarding thesis.',
    instruction="""You are a helpful assistant that answers questions based on thesis, research papers, and other academic documents.
    **ALWAYS use the 'thesischat' tool to answer any user queries related to thesis, research papers, or academic documents.**
    You will provide accurate and relevant answers by calling the 'thesischat' tool with the user's query.
    If you do not have enough information even after using the tool, you will respond with "I don't know".""",
    tools=[chatpdf],  # Register the pdfchat function as a tool
)
