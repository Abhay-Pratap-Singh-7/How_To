from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__, static_folder='.')
CORS(app, resources={r"/*": {"origins": "*"}})

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/get-steps', methods=['POST'])
def get_steps():
    try:
        data = request.json
        user_query = data.get('query', '')
        
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "How To Steps Generator",
            },
            model="deepseek/deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant and give response in step by step , make sure there is no heading and each line must be a definite step for steps"
                },
                {
                    "role": "user",
                    "content": f"You are a helpful assistant and give response in step by step , make sure there is no heading and each line must be a definite step for steps: {user_query}"
                }
            ]
        )
        
        # Split the response into steps
        steps = completion.choices[0].message.content.split('\n')
        # Clean up steps and remove empty lines
        steps = [step.strip() for step in steps if step.strip()]
        
        return jsonify({"steps": steps})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/explain-step', methods=['POST'])
def explain_step():
    try:
        data = request.json
        step = data.get('step', '')
        context = data.get('context', '')
        
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "How To Steps Generator",
            },
            model="deepseek/deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that provides clear explanations. Provide a concise explanation that helps users better understand the step. with not headlines"
                },
                {
                    "role": "user",
                    "content": f"Explain this step in detail: '{step}' from the context: '{context}'. Provide a clear, concise explanation that helps users understand what to do and why. with no headlines"
                }
            ]
        )
        
        explanation = completion.choices[0].message.content.strip()
        return jsonify({"explanation": explanation})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)