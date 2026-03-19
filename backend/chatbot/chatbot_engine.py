"""
Chatbot Engine — Gemini-powered product recommendation chatbot.
Loaded ONCE at startup. Handles Vietnamese beauty queries.
"""

import logging
import os
import json
import google.generativeai as genai
from pydantic import BaseModel
import pandas as pd

logger = logging.getLogger(__name__)

# Response Models
class ChatResponse(BaseModel):
    intent: str
    message: str
    data: dict | None = None
    type: str = "text"


class ChatbotEngine:
    """
    Loads data and Gemini model ONCE at startup.
    All requests reuse this instance — no per-request spawn overhead.
    """

    def __init__(self, csv_path: str):
        logger.info("🤖 Loading Gemini-powered chatbot...")
        
        # Load Gemini API
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Load product database
        self.df = pd.read_csv(csv_path)
        for col in ["Skin_Type_Target", "Main_Concern", "Key_Ingredients",
                    "Description_Short", "Category", "Name"]:
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna("")
            else:
                self.df[col] = ""
        
        # Prepare product data as string for prompt
        self.product_data = self.df.to_string(index=False)
        
        logger.info("✅ Gemini chatbot ready.")

    def process(self, message: str) -> dict:
        """Process a message using Gemini and return a structured response dict."""
        
        prompt = f"""
Bạn là AI trợ lý tư vấn mỹ phẩm thông minh của TirTir, chuyên về sản phẩm makeup và skincare.

Dữ liệu sản phẩm hiện có:
{self.product_data}

Hướng dẫn:
- Phân tích intent từ message của user (greeting, consultation, price, discount, order, contact, info, usage, shipping, return, hoặc other).
- Nếu là consultation, info, usage, hoặc price: Tìm sản phẩm phù hợp nhất dựa trên keywords như da dầu/khô/mụn, cushion/toner/cream, màu sắc, etc.
- Trả về JSON với format:
{{
  "intent": "intent_name",
  "message": "phản hồi thân thiện bằng tiếng Việt",
  "data": {{
    "id": "Product_ID nếu có",
    "name": "Tên sản phẩm",
    "price": giá số,
    "image": "đường dẫn ảnh",
    "desc": "mô tả ngắn",
    "slug": "slug sản phẩm"
  }} hoặc null,
  "type": "product" nếu recommend sản phẩm, "text" nếu không
}}

Message của user: "{message}"

Trả về chỉ JSON, không thêm text khác.
"""
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )
            result = json.loads(response.text.strip())
            return result
        except Exception as e:
            logger.exception("Gemini processing failed")
            return {
                "intent": "error",
                "message": "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
                "data": None,
                "type": "text"
            }