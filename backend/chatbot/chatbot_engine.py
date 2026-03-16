"""
Chatbot Engine — NLP-based product recommendation chatbot.
Loaded ONCE at startup. Handles Vietnamese beauty queries.
"""

import logging
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import make_pipeline

logger = logging.getLogger(__name__)

# ─── Training Data ────────────────────────────────────────────────────────────
TRAIN_DATA = [
    # Tư vấn sản phẩm Cushion & Makeup
    ("da dầu dùng gì", "consultation"), ("tư vấn giúp mình", "consultation"),
    ("loại nào tốt cho da khô", "consultation"), ("da mụn", "consultation"),
    ("tìm sản phẩm căng bóng", "consultation"), ("cushion nào che phủ tốt", "consultation"),
    ("da nhạy cảm dùng được không", "consultation"), ("da hỗn hợp", "consultation"),
    ("tư vấn màu", "consultation"), ("chọn tone", "consultation"),
    ("tư vấn phấn nước", "consultation"), ("kem nền che khuyết điểm", "consultation"),
    ("cushion tirtir màu đỏ", "consultation"), ("phấn nước", "consultation"),
    ("son tint mọng nước", "consultation"), ("son bóng", "consultation"),
    ("makeup đi tiệc", "consultation"), ("trang điểm", "consultation"),
    # Tư vấn Skincare / Dưỡng da
    ("dưỡng da", "consultation"), ("skincare cho da mụn", "consultation"),
    ("sản phẩm phục hồi da", "consultation"), ("toner dưỡng ẩm", "consultation"),
    ("kem dưỡng ẩm sâu", "consultation"), ("tẩy trang", "consultation"),
    ("sữa rửa mặt", "consultation"), ("chống nắng", "consultation"),
    # Giá
    ("giá bao nhiêu", "price"), ("cái này bao tiền", "price"),
    ("mắc không", "price"), ("báo giá", "price"), ("đang sale không", "price"),
    # Chào hỏi
    ("hi", "greeting"), ("hello", "greeting"), ("chào shop", "greeting"),
    ("bạn ơi", "greeting"), ("có ai ở đó không", "greeting"),
    # Thông tin / HDSD
    ("thành phần là gì", "info"), ("công dụng", "info"),
    ("cách dùng", "info"), ("xài sao", "info"), ("hạn sử dụng", "info"),
    # Giao hàng
    ("ship bao lâu", "shipping"), ("có freeship không", "shipping"),
    ("phí ship thế nào", "shipping"), ("giao hàng nhanh không", "shipping"),
    # Đổi trả
    ("đổi trả thế nào", "return"), ("bảo hành không", "return"),
    ("hàng lỗi thì sao", "return"), ("chính sách đổi trả", "return"),
]

# ─── Keyword Scoring Map ──────────────────────────────────────────────────────
KEYWORDS_MAP = {
    # Skin types
    "dầu":      {"tag": "oily",      "field": "Skin_Type_Target"},
    "nhờn":     {"tag": "oily",      "field": "Skin_Type_Target"},
    "khô":      {"tag": "dry",       "field": "Skin_Type_Target"},
    "mụn":      {"tag": "acne",      "field": "Main_Concern"},
    "nhạy cảm": {"tag": "sensitive", "field": "Skin_Type_Target"},
    # Concerns
    "che phủ":  {"tag": "coverage",  "field": "Main_Concern"},
    "khuyết điểm": {"tag": "coverage",  "field": "Main_Concern"},
    "căng bóng":{"tag": "glow",      "field": "Main_Concern"},
    "lì":       {"tag": "matte",     "field": "Main_Concern"},
    "tự nhiên": {"tag": "natural",   "field": "Main_Concern"},
    "phục hồi": {"tag": "barrier",   "field": "Main_Concern"},
    "dưỡng ẩm": {"tag": "hydration", "field": "Main_Concern"},
    "trắng":    {"tag": "brightening","field": "Main_Concern"},
    "chống nắng": {"tag": "uv",      "field": "Main_Concern"},
    # Categories
    "cushion":  {"tag": "cushion",   "field": "Category_Slug"},
    "phấn nước": {"tag": "cushion",  "field": "Category_Slug"},
    "kem nền":  {"tag": "cushion",   "field": "Category_Slug"},
    "toner":    {"tag": "toner",     "field": "Category_Slug"},
    "kem dưỡng": {"tag": "cream",    "field": "Category_Slug"},
    "tẩy trang": {"tag": "cleanser", "field": "Category_Slug"},
    "sữa rửa mặt": {"tag": "cleanser", "field": "Category_Slug"},
    "son":      {"tag": "tint",      "field": "Category"},
    "skincare": {"tag": "TRUE",      "field": "Is_Skincare"},
    "dưỡng da": {"tag": "TRUE",      "field": "Is_Skincare"},
    "makeup":   {"tag": "FALSE",     "field": "Is_Skincare"},
    # Specific products/colors
    "đỏ":       {"tag": "red",       "field": "Name"},
    "hồng":     {"tag": "all-cover", "field": "Name"},
    "đen":      {"tag": "mask fit",  "field": "Name"},
    "bạc":      {"tag": "aura",      "field": "Name"},
    "matcha":   {"tag": "matcha",    "field": "Name"},
    "sữa":      {"tag": "milk",      "field": "Name"}
}


class ChatbotEngine:
    """
    Loads data and trains NLP model ONCE at startup.
    All requests reuse this instance — no per-request spawn overhead.
    """

    def __init__(self, csv_path: str):
        logger.info("🤖 Loading chatbot NLP model...")
        # Load product database
        self.df = pd.read_csv(csv_path)
        for col in ["Skin_Type_Target", "Main_Concern", "Key_Ingredients",
                    "Description_Short", "Category", "Name"]:
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna("")
            else:
                self.df[col] = "" # Ensure column exists

        # Prepare product content matrix for Cosine Similarity
        self.df["combined_content"] = (
            self.df["Name"] + " " +
            self.df["Category"] + " " +
            self.df["Skin_Type_Target"] + " " +
            self.df["Main_Concern"] + " " +
            self.df["Key_Ingredients"] + " " +
            self.df["Description_Short"]
        ).str.lower()
        
        self.product_vectorizer = TfidfVectorizer(ngram_range=(1, 2))
        self.product_tfidf_matrix = self.product_vectorizer.fit_transform(self.df["combined_content"])

        # Train intent classifier
        self.model = make_pipeline(
            TfidfVectorizer(ngram_range=(1, 2)),
            LinearSVC(random_state=42, dual='auto')
        )
        self.model.fit(
            [x[0] for x in TRAIN_DATA],
            [x[1] for x in TRAIN_DATA]
        )
        logger.info("✅ Chatbot ready.")

    def _smart_recommend(self, query: str):
        """Score products by TF-IDF Cosine Similarity combined with keyword rules."""
        q = query.lower()
        
        # 1. Content-based filtering (TF-IDF Cosine Similarity)
        query_vec = self.product_vectorizer.transform([q])
        cosine_scores = cosine_similarity(query_vec, self.product_tfidf_matrix).flatten()
        
        # 2. Rule-based scores
        rule_scores = np.zeros(len(self.df))
        matched_tags = []
        
        for word, logic in KEYWORDS_MAP.items():
            if word in q:
                matched_tags.append(word)
                field = logic["field"]
                tag = logic["tag"]
                
                # Boost scores for rule matches
                if field in self.df.columns:
                    rule_match_mask = self.df[field].str.contains(tag, case=False, na=False)
                    rule_scores = np.where(rule_match_mask, rule_scores + 0.5, rule_scores)
                    
                if "Description_Short" in self.df.columns:
                    desc_match_mask = self.df["Description_Short"].str.contains(tag, case=False, na=False)
                    rule_scores = np.where(desc_match_mask, rule_scores + 0.1, rule_scores)

        # 3. Combine scores
        final_scores = cosine_scores + rule_scores
        
        if final_scores.max() < 0.05: # Threshold limit
            return None, matched_tags

        best_idx = final_scores.argmax()
        best_product = self.df.iloc[best_idx]
        
        return best_product, matched_tags

    def process(self, message: str) -> dict:
        """Process a message and return a structured response dict."""
        intent = self.model.predict([message])[0]
        result = {"intent": intent, "message": "", "data": None, "type": "text"}

        if intent == "greeting":
            result["message"] = "👋 Chào bạn! Mình là TirTir AI Assistant. Mình có thể giúp bạn tìm sản phẩm dưỡng da, mỹ phẩm, hoặc hướng dẫn sử dụng nhé."

        elif intent == "shipping":
            result["message"] = "📦 Bên mình freeship cho đơn từ 500k. Giao nội thành 1-2 ngày, ngoại thành 3-4 ngày."

        elif intent == "return":
            result["message"] = "Sản phẩm được đổi trả trong 7 ngày nếu có lỗi sản xuất hoặc kích ứng (cần video mở hộp)."

        elif intent == "info":
            result["message"] = "Các sản phẩm TirTir đều chú trọng thành phần an toàn, ví dụ như dòng Mask Fit luôn có độ che phủ siêu tốt nhưng vẫn mỏng nhẹ."

        elif intent in ("consultation", "price"):
            product, tags = self._smart_recommend(message)
            if product is not None:
                result["type"] = "product"
                result["message"] = f"Dựa trên yêu cầu của bạn ({', '.join(tags)}), TirTir xin gợi ý sản phẩm này:"
                result["data"] = {
                    "id":    str(product.get("Product_ID", "")),
                    "name":  product.get("Name", ""),
                    "price": float(product.get("Price", 0)),
                    "image": product.get("Thumbnail_Images", ""),
                    "desc":  product.get("Description_Short", ""),
                    "slug":  product.get("Product_Slug", ""),
                }
                if intent == "price":
                    result["message"] = f"Sản phẩm {result['data']['name']} có giá {result['data']['price']:,.0f} đ."
            else:
                result["message"] = "🤔 Bạn có thể mô tả chi tiết hơn về tình trạng da hoặc sản phẩm bạn muốn tìm không? (vd: da dầu trị mụn, son tint rực rỡ...)"

        else:
            result["message"] = "Mình chưa hiểu rõ lắm. Bạn thử hỏi: 'Da dầu dùng cushion nào?' hay 'Có toner nào dịu nhẹ không?' nhé!"

        return result
