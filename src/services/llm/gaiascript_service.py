#!/usr/bin/env python3
"""
GaiaScript LLM Service - MLX Integration
Command-line interface for the GaiaEngine JavaScript service
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

# Add the axlearn training directory to path
sys.path.append(str(Path(__file__).parent / "../../../axlearn-gaiascript-training"))

try:
    from mlx_lm import load, generate
    MLX_AVAILABLE = True
except ImportError:
    MLX_AVAILABLE = False
    print("Warning: MLX not available, using fallback mode", file=sys.stderr)

class GaiaScriptService:
    """MLX-based GaiaScript generation service"""
    
    def __init__(self, model_path: str = "mlx-community/Llama-3.2-3B-Instruct-4bit", 
                 adapter_path: Optional[str] = None):
        self.model_path = model_path
        self.adapter_path = adapter_path
        self.model = None
        self.tokenizer = None
        self._load_model()
    
    def _load_model(self):
        """Load the MLX model and tokenizer"""
        if not MLX_AVAILABLE:
            return
            
        try:
            if self.adapter_path and Path(self.adapter_path).exists():
                print(f"Loading model with adapter: {self.adapter_path}", file=sys.stderr)
                self.model, self.tokenizer = load(self.model_path, adapter_path=self.adapter_path)
            else:
                print(f"Loading base model: {self.model_path}", file=sys.stderr)
                self.model, self.tokenizer = load(self.model_path)
            print("Model loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            self.model = None
            self.tokenizer = None
    
    def generate(self, prompt: str, max_tokens: int = 200, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate GaiaScript code from prompt"""
        
        if not MLX_AVAILABLE or self.model is None:
            # Fallback mode - return simulated GaiaScript
            return self._fallback_generate(prompt, max_tokens)
        
        try:
            # Enhanced prompt for GaiaScript generation
            system_prompt = """You are a GaiaScript code generator. Generate code using these symbols:
- Functions: λ⟨name, params⟩ body ⟨/λ⟩
- State: Σ⟨variable: value⟩
- Components: Ω⟨✱⟩ content ⟨/Ω⟩
- Styling: Φ{styles}⟦content⟧
- Numbers: ⊗∅=0, ⊗α=1, ⊗β=2, ⊗γ=3, ⊗δ=4, ⊗ε=5
- Symbols: ◐=center, ☰=flex, ⬛=solid

Respond only with GaiaScript code, no explanations."""

            full_prompt = f"{system_prompt}\n\nUser request: {prompt}\n\nGaiaScript code:"
            
            # Generate with MLX
            response = generate(
                self.model, 
                self.tokenizer,
                prompt=full_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                verbose=False
            )
            
            # Clean up the response
            generated_code = self._clean_response(response)
            
            return {
                "success": True,
                "generated_code": generated_code,
                "model": self.model_path,
                "adapter": self.adapter_path,
                "tokens": len(generated_code.split()),
                "method": "mlx"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": self.model_path,
                "method": "mlx"
            }
    
    def _fallback_generate(self, prompt: str, max_tokens: int) -> Dict[str, Any]:
        """Fallback GaiaScript generation when MLX is not available"""
        
        # Simple pattern matching for common requests
        prompt_lower = prompt.lower()
        
        if "function" in prompt_lower and "add" in prompt_lower:
            code = "λ⟨add, x, y⟩ x + y ⟨/λ⟩"
        elif "function" in prompt_lower and "counter" in prompt_lower:
            code = "λ⟨increment⟩ counter = counter + ⊗α ⟨/λ⟩"
        elif "component" in prompt_lower and "button" in prompt_lower:
            code = """Ω⟨✱⟩
  Φ{
    κ: #4f46e5;
    ρ: white;
    φ: ⊗α⊗β px;
    border-radius: ⊗δ px;
    cursor: ⚡
  }⟦
    Click Me
  ⟧
⟨/Ω⟩"""
        elif "state" in prompt_lower:
            code = "Σ⟨counter: ⊗∅, message: 𝕊⟨Hello World⟩⟩"
        elif "hello world" in prompt_lower:
            code = """檔⟨Hello World Example⟩

導⟨界面⟩

Σ⟨
  title: 𝕊⟨Hello World⟩,
  message: 𝕊⟨Welcome to GaiaScript⟩
⟩

Ω⟨✱⟩
  Φ{
    δ: ☰;
    justify-content: ◐;
    align-items: ◐;
    min-height: 100vh;
    κ: linear-gradient(⊗α⊗γ⊗εdeg, #667eea ⊗∅%, #764ba2 ⊗α⊗∅⊗∅%);
    ρ: white
  }⟦
    𝕊⟨${title}⟩
  ⟧
⟨/Ω⟩"""
        else:
            code = f"λ⟨generated⟩ // Generated for: {prompt[:50]}... ⟨/λ⟩"
        
        return {
            "success": True,
            "generated_code": code,
            "model": "fallback",
            "adapter": None,
            "tokens": len(code.split()),
            "method": "fallback"
        }
    
    def _clean_response(self, response: str) -> str:
        """Clean up generated response"""
        # Remove common prefixes/suffixes
        response = response.strip()
        
        # Remove any markdown code blocks
        if response.startswith("```"):
            lines = response.split('\n')
            if len(lines) > 2:
                response = '\n'.join(lines[1:-1])
        
        # Remove "GaiaScript code:" prefix if present
        if "GaiaScript code:" in response:
            response = response.split("GaiaScript code:")[-1].strip()
        
        return response

def main():
    parser = argparse.ArgumentParser(description="GaiaScript LLM Service")
    parser.add_argument("--prompt", required=True, help="Prompt for code generation")
    parser.add_argument("--max-tokens", type=int, default=200, help="Maximum tokens to generate")
    parser.add_argument("--temperature", type=float, default=0.7, help="Generation temperature")
    parser.add_argument("--model", default="mlx-community/Llama-3.2-3B-Instruct-4bit", help="Model path")
    parser.add_argument("--adapter", help="Adapter path for fine-tuned model")
    parser.add_argument("--json", action="store_true", help="Output JSON response")
    
    args = parser.parse_args()
    
    # Determine adapter path
    adapter_path = args.adapter
    if not adapter_path:
        # Try to find the adapter automatically
        possible_paths = [
            "../../../axlearn-gaiascript-training/adapters/gaiascript",
            "adapters/gaiascript",
            Path(__file__).parent / "../../../axlearn-gaiascript-training/adapters/gaiascript"
        ]
        for path in possible_paths:
            if Path(path).exists():
                adapter_path = str(path)
                break
    
    # Create service and generate
    service = GaiaScriptService(args.model, adapter_path)
    result = service.generate(args.prompt, args.max_tokens, args.temperature)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        if result["success"]:
            print(result["generated_code"])
        else:
            print(f"Error: {result['error']}", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()