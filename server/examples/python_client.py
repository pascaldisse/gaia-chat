"""
Example Python client for Gaia API

This simple script demonstrates how to use the Gaia API from Python.
It showcases common operations like:
- Chat with LLM models
- Working with personas
- Streaming responses

Requirements:
    pip install requests sseclient-py

Usage:
    python python_client.py
"""

import json
import requests
import sseclient

# API Configuration
API_BASE = "http://localhost:5000/api"
API_KEY = "your_api_key"  # Replace with your actual API key

# Headers for regular requests
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

def get_models():
    """Fetch available LLM models"""
    response = requests.get(f"{API_BASE}/llm/models", headers=HEADERS)
    data = response.json()
    
    print("Available models:")
    for model in data["models"]:
        print(f"- {model['name']}: {model['id']}")
    
    return data["models"]

def chat_with_llm(model, messages):
    """Send a chat request to the LLM API"""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 800
    }
    
    response = requests.post(
        f"{API_BASE}/llm/chat", 
        headers=HEADERS, 
        json=payload
    )
    
    data = response.json()
    
    print("\nChat response:")
    print(data["message"])
    
    return data["message"]

def stream_chat(model, messages):
    """Stream a chat response from the LLM API"""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 800
    }
    
    # Start streaming request
    response = requests.post(
        f"{API_BASE}/llm/stream", 
        headers=HEADERS, 
        json=payload,
        stream=True
    )
    
    # Create SSE client
    client = sseclient.SSEClient(response)
    
    print("\nStreaming response:")
    full_response = ""
    
    # Process streaming response
    for event in client.events():
        data = json.loads(event.data)
        
        if "token" in data:
            print(data["token"], end="", flush=True)
            full_response += data["token"]
        
        if "done" in data and data["done"]:
            print("\n\nStream completed.")
            break
        
        if "error" in data:
            print(f"\nError: {data['error']}")
            break
    
    return full_response

def get_personas():
    """Fetch available personas"""
    response = requests.get(f"{API_BASE}/personas", headers=HEADERS)
    data = response.json()
    
    print("\nAvailable personas:")
    for persona in data["personas"]:
        print(f"- {persona['name']} (ID: {persona['id']})")
    
    return data["personas"]

def chat_with_persona(persona_id, message, history=None):
    """Chat with a specific persona"""
    if history is None:
        history = []
        
    payload = {
        "message": message,
        "history": history
    }
    
    response = requests.post(
        f"{API_BASE}/personas/{persona_id}/chat", 
        headers=HEADERS, 
        json=payload
    )
    
    data = response.json()
    
    print(f"\nResponse from {data['persona']['name']}:")
    print(data["response"])
    print("\nRPG outcome:")
    print(json.dumps(data["outcome"], indent=2))
    
    return data

def create_persona(name, system_prompt, model, attributes):
    """Create a new persona"""
    payload = {
        "name": name,
        "systemPrompt": system_prompt,
        "model": model,
        **attributes
    }
    
    response = requests.post(
        f"{API_BASE}/personas", 
        headers=HEADERS, 
        json=payload
    )
    
    data = response.json()
    
    print("\nPersona created:")
    print(f"Message: {data['message']}")
    print(f"ID: {data['persona']['id']}")
    print(f"Name: {data['persona']['name']}")
    
    return data["persona"]

def main():
    """Run example API calls"""
    # Get models
    models = get_models()
    default_model = models[0]["id"] if models else "meta-llama/Meta-Llama-3-70B-Instruct"
    
    # Chat with LLM
    chat_messages = [
        {"role": "user", "content": "Explain what an API is in simple terms."}
    ]
    chat_with_llm(default_model, chat_messages)
    
    # Stream chat response
    stream_messages = [
        {"role": "user", "content": "Write a short poem about technology."}
    ]
    stream_chat(default_model, stream_messages)
    
    # Get personas
    personas = get_personas()
    default_persona = personas[0]["id"] if personas else "default-assistant"
    
    # Chat with persona
    chat_result = chat_with_persona(
        default_persona,
        "What are three interesting facts about space?"
    )
    
    # Continue conversation with history
    history = [
        {"role": "user", "content": "What are three interesting facts about space?"},
        {"role": "assistant", "content": chat_result["response"]}
    ]
    
    chat_with_persona(
        default_persona,
        "Can you elaborate on the second fact?",
        history
    )
    
    # Create a new persona
    create_persona(
        name="Science Teacher",
        system_prompt="You are a science teacher who explains complex concepts in simple terms for students.",
        model=default_model,
        attributes={
            "initiative": 6,
            "talkativeness": 8,
            "confidence": 9,
            "curiosity": 8,
            "empathy": 7,
            "creativity": 6,
            "humor": 5
        }
    )

if __name__ == "__main__":
    main()