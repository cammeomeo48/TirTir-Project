"""
Chatbot Engine — RAG-lite + rules + catalog filtering.

Design goals for MVP:
- No model training.
- Ask for missing required slots (skin type, concern, budget, category).
- Hard-filter products by those slots.
- Score with: 0.5 * concern + 0.3 * skin + 0.2 * budget.
- Return top 3 + 1 cheaper alternative.
- Let LLM only rephrase from selected products (not choose products).
"""

import json
import logging
import os
import re
import unicodedata
from dataclasses import dataclass

import google.generativeai as genai
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class SessionState:
    skin_type: str | None = None
    concern: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    category: str | None = None


class ChatbotEngine:
    def __init__(self, csv_path: str):
        logger.info("🤖 Loading RAG-lite chatbot engine...")

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model = None
        if api_key:
            genai.configure(api_key=api_key)
            try:
                self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
                logger.info("✅ Gemini-2.0-Flash model configured for natural-language phrasing.")
            except Exception:
                try:
                    self.model = genai.GenerativeModel("gemini-pro")
                    logger.info("✅ Gemini-Pro model configured (fallback).")
                except Exception:
                    logger.warning("⚠️ Could not initialize Gemini model. Will use template responses.")
        else:
            logger.warning("⚠️ GEMINI_API_KEY not set. Falling back to template responses.")

        self.df = pd.read_csv(csv_path)
        self._ensure_columns()
        self._normalize_catalog()
        self.sessions: dict[str, SessionState] = {}

        self.skin_keywords = {
            "oily": ["da dầu", "dầu", "nhờn", "oily", "acne-prone", "mụn"],
            "dry": ["da khô", "khô", "dry", "very dry"],
            "combination": ["da hỗn hợp", "hỗn hợp", "combination"],
            "sensitive": ["da nhạy cảm", "nhạy cảm", "sensitive"],
            "normal": ["da thường", "normal"],
            "mature": ["lão hóa", "da lão hóa", "mature", "wrinkle"],
            "all": ["mọi loại da", "all skin", "all types", "all"],
        }

        self.concern_keywords = {
            "acne": ["mụn", "acne", "breakout"],
            "hydration": ["cấp ẩm", "dưỡng ẩm", "khô", "hydration", "moisture"],
            "soothing": ["làm dịu", "soothing", "đỏ da", "kích ứng", "calming"],
            "brightening": ["sáng da", "đều màu", "brightening", "dull"],
            "coverage": ["che phủ", "coverage", "khuyết điểm"],
            "matte": ["lì", "matte", "kiềm dầu"],
            "glow": ["căng bóng", "glow", "dewy", "glass skin"],
            "uv": ["chống nắng", "uv", "spf", "sun"],
            "wrinkles": ["nếp nhăn", "wrinkle", "chống lão hóa", "lifting"],
        }

        self.category_keywords = {
            "cushion": ["cushion", "phấn nước"],
            "toner": ["toner", "nước cân bằng"],
            "serum": ["serum", "tinh chất", "ampoule"],
            "cream": ["kem dưỡng", "cream"],
            "cleanser": ["sữa rửa mặt", "cleanser", "cleansing"],
            "sunscreen": ["chống nắng", "sunscreen", "sun"],
            "tint": ["tint", "son tint"],
            "balm": ["balm", "son dưỡng"],
            "eye-cream": ["kem mắt", "eye cream"],
            "setting-spray": ["xịt khóa nền", "setting spray", "fixer"],
            "gift-set": ["set", "combo", "gift set", "duo"],
            "primer": ["primer", "lót"],
            "mask": ["mask", "mặt nạ"],
            "facial-oil": ["oil", "dầu dưỡng"],
        }

        self.required_slots = ["skin_type", "concern", "budget", "category"]
        logger.info("✅ RAG-lite chatbot ready.")

    def _ensure_columns(self):
        required_columns = [
            "Product_ID",
            "Name",
            "Price",
            "Sale_Price",
            "Skin_Type_Target",
            "Main_Concern",
            "Category",
            "Category_Slug",
            "Description_Short",
            "Product_Slug",
            "Thumbnail_Images",
            "Status",
            "Stock_Quantity",
        ]
        for col in required_columns:
            if col not in self.df.columns:
                self.df[col] = ""
        self.df["Price"] = pd.to_numeric(self.df["Price"], errors="coerce").fillna(0.0)
        self.df["Sale_Price"] = pd.to_numeric(self.df["Sale_Price"], errors="coerce").fillna(0.0)
        self.df["Stock_Quantity"] = pd.to_numeric(self.df["Stock_Quantity"], errors="coerce").fillna(0)

    def _normalize_catalog(self):
        text_cols = [
            "Name",
            "Category",
            "Category_Slug",
            "Skin_Type_Target",
            "Main_Concern",
            "Description_Short",
            "Product_Slug",
        ]
        for col in text_cols:
            self.df[col] = self.df[col].fillna("").astype(str)

        self.df["_norm_text"] = (
            self.df["Name"]
            + " "
            + self.df["Category"]
            + " "
            + self.df["Category_Slug"]
            + " "
            + self.df["Skin_Type_Target"]
            + " "
            + self.df["Main_Concern"]
            + " "
            + self.df["Description_Short"]
        ).str.lower()

        self.df["_active"] = self.df["Status"].astype(str).str.lower().isin(["in stock", "instock", "active", "true"]) | (
            self.df["Stock_Quantity"] > 0
        )

    def _strip_accents(self, text: str) -> str:
        normalized = unicodedata.normalize("NFD", text)
        plain = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
        return plain.replace("đ", "d").replace("Đ", "D")

    def _keyword_match(self, text: str, keyword: str) -> bool:
        keyword = keyword.strip().lower()
        if not keyword:
            return False
        if len(keyword) <= 3 or keyword in {"set", "all"}:
            return re.search(rf"\b{re.escape(keyword)}\b", text) is not None
        return keyword in text

    def _resolve_alias(self, message_lower: str, aliases: dict[str, list[str]]) -> str | None:
        plain = self._strip_accents(message_lower)
        for canonical, words in aliases.items():
            for word in words:
                word_plain = self._strip_accents(word)
                if self._keyword_match(message_lower, word) or self._keyword_match(plain, word_plain):
                    return canonical
        return None

    def _parse_budget(self, message: str) -> tuple[float | None, float | None]:
        message_lower = message.lower().replace(",", ".")
        plain = self._strip_accents(message_lower)

        range_match = re.search(r"(?:tu|khoang)\s*(\d+(?:\.\d+)?)\s*(k|tr|trieu|vnd|d)?\s*(?:den|-|to)\s*(\d+(?:\.\d+)?)\s*(k|tr|trieu|vnd|d)?", plain)
        if range_match:
            min_v = self._to_catalog_price(float(range_match.group(1)), range_match.group(2))
            max_v = self._to_catalog_price(float(range_match.group(3)), range_match.group(4))
            return (min(min_v, max_v), max(min_v, max_v))

        max_match = re.search(r"(?:duoi|toi\s*da|max|<=|re\s*hon|khong\s*qua)\s*(\d+(?:\.\d+)?)\s*(k|tr|trieu|vnd|d)?", plain)
        if max_match:
            return (None, self._to_catalog_price(float(max_match.group(1)), max_match.group(2)))

        value_match = re.search(r"\b(\d+(?:\.\d+)?)\s*(k|tr|trieu|vnd|d)\b", plain)
        if value_match:
            value = self._to_catalog_price(float(value_match.group(1)), value_match.group(2))
            return (None, value)

        return (None, None)

    def _to_catalog_price(self, value: float, unit: str | None) -> float:
        if unit is None:
            return value
        unit = unit.lower()
        if unit == "k":
            return (value * 1000) / 25000
        if unit in {"tr", "triệu", "trieu"}:
            return (value * 1_000_000) / 25000
        if unit in {"vnd", "đ", "d"}:
            return value / 25000
        return value

    def _slot_status(self, state: SessionState) -> list[str]:
        missing = []
        if not state.skin_type:
            missing.append("skin_type")
        if not state.concern:
            missing.append("concern")
        if state.budget_min is None and state.budget_max is None:
            missing.append("budget")
        if not state.category:
            missing.append("category")
        return missing

    def _ask_missing(self, missing: list[str]) -> str:
        prompts = {
            "skin_type": "loại da (da dầu/khô/hỗn hợp/nhạy cảm)",
            "concern": "vấn đề chính (mụn/thâm/đỏ da/kiềm dầu/căng bóng/chống nắng)",
            "budget": "ngân sách (ví dụ: dưới 700k hoặc 20-30)",
            "category": "loại sản phẩm (cushion/toner/serum/kem dưỡng/chống nắng)",
        }
        ask = ", ".join(prompts[k] for k in missing)
        return f"Để tư vấn chuẩn hơn, bạn cho mình thêm: {ask}. Mình sẽ không đoán bừa đâu nhé."

    def _has_any_filter(self, state: SessionState) -> bool:
        """Return True if at least one filter criterion is set."""
        return bool(
            state.skin_type
            or state.concern
            or state.category
            or state.budget_min is not None
            or state.budget_max is not None
        )

    def _ask_for_filter(self) -> str:
        return "Bạn cho mình một thông tin để recommend nhé: loại da, vấn đề chính, ngân sách, hoặc loại sản phẩm."

    def _filter_products(self, state: SessionState) -> pd.DataFrame:
        candidates = self.df[self.df["_active"]].copy()

        if state.category:
            cat_words = self.category_keywords.get(state.category, [state.category])
            mask = candidates["_norm_text"].apply(lambda txt: any(word in txt for word in cat_words))
            candidates = candidates[mask]

        if state.skin_type:
            skin_words = self.skin_keywords.get(state.skin_type, [state.skin_type])
            skin_mask = candidates["Skin_Type_Target"].str.lower().apply(lambda txt: any(word in txt for word in skin_words))
            if state.skin_type == "all":
                skin_mask = skin_mask | candidates["Skin_Type_Target"].str.lower().str.contains("all", na=False)
            candidates = candidates[skin_mask]

        if state.concern:
            concern_words = self.concern_keywords.get(state.concern, [state.concern])
            concern_mask = candidates["_norm_text"].apply(lambda txt: any(word in txt for word in concern_words))
            candidates = candidates[concern_mask]

        if state.budget_min is not None:
            candidates = candidates[candidates["Price"] >= state.budget_min]
        if state.budget_max is not None:
            candidates = candidates[candidates["Price"] <= state.budget_max]

        return candidates

    def _score_products(self, products: pd.DataFrame, state: SessionState) -> pd.DataFrame:
        scored = products.copy()

        concern_words = self.concern_keywords.get(state.concern or "", [state.concern or ""])
        skin_words = self.skin_keywords.get(state.skin_type or "", [state.skin_type or ""])

        scored["concern_match"] = scored["_norm_text"].apply(lambda txt: 1.0 if any(w and w in txt for w in concern_words) else 0.0)
        scored["skin_match"] = scored["Skin_Type_Target"].str.lower().apply(lambda txt: 1.0 if any(w and w in txt for w in skin_words) else 0.0)

        def budget_fit(price: float) -> float:
            if state.budget_min is None and state.budget_max is None:
                return 1.0
            if state.budget_min is not None and state.budget_max is not None:
                target = (state.budget_min + state.budget_max) / 2
                span = max((state.budget_max - state.budget_min) / 2, 1.0)
                return max(0.0, 1.0 - abs(price - target) / span)
            if state.budget_max is not None:
                return max(0.0, min(1.0, (state.budget_max - price + 1) / max(state.budget_max, 1.0)))
            return 1.0

        scored["budget_fit"] = scored["Price"].apply(budget_fit)
        # Renormalize weights based on available criteria
        has_concern = bool(state.concern)
        has_skin = bool(state.skin_type)
        has_budget = state.budget_min is not None or state.budget_max is not None

        if has_concern and has_skin and has_budget:
            w_concern, w_skin, w_budget = 0.5, 0.3, 0.2
        elif has_concern and has_skin:
            w_concern, w_skin, w_budget = 0.6, 0.4, 0.0
        elif has_concern and has_budget:
            w_concern, w_skin, w_budget = 0.7, 0.0, 0.3
        elif has_skin and has_budget:
            w_concern, w_skin, w_budget = 0.0, 0.6, 0.4
        elif has_concern:
            w_concern, w_skin, w_budget = 1.0, 0.0, 0.0
        elif has_skin:
            w_concern, w_skin, w_budget = 0.0, 1.0, 0.0
        else:  # only budget
            w_concern, w_skin, w_budget = 0.0, 0.0, 1.0
        
        scored["score"] = w_concern * scored["concern_match"] + w_skin * scored["skin_match"] + w_budget * scored["budget_fit"]
        scored = scored.sort_values(by=["score", "Price"], ascending=[False, True])
        return scored

    def _to_product_payload(self, row: pd.Series, score: float | None = None) -> dict:
        payload = {
            "id": str(row.get("Product_ID", "")),
            "name": row.get("Name", ""),
            "price": float(row.get("Price", 0.0)),
            "image": row.get("Thumbnail_Images", ""),
            "desc": row.get("Description_Short", ""),
            "slug": row.get("Product_Slug", ""),
        }
        if score is not None:
            payload["score"] = round(float(score), 4)
        return payload

    def _render_with_llm(self, user_message: str, state: SessionState, recommendations: list[dict], cheaper_alternative: dict | None) -> str:
        if not self.model:
            return self._template_message(state, recommendations, cheaper_alternative)

        prompt = {
            "instruction": "Bạn là trợ lý mỹ phẩm TirTir. Chỉ được mô tả sản phẩm có trong recommendations và cheaper_alternative. Không được thêm sản phẩm ngoài danh sách.",
            "user_message": user_message,
            "profile": {
                "skin_type": state.skin_type,
                "concern": state.concern,
                "budget_min": state.budget_min,
                "budget_max": state.budget_max,
                "category": state.category,
            },
            "recommendations": recommendations,
            "cheaper_alternative": cheaper_alternative,
            "output_style": "Tiếng Việt, thân thiện, 4-6 câu, nêu lý do chọn theo concern/skin/budget và kết thúc bằng câu hỏi follow-up.",
        }

        try:
            response = self.model.generate_content(
                json.dumps(prompt, ensure_ascii=False),
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                ),
            )
            text = (response.text or "").strip()
            if text:
                return text
        except Exception:
            logger.exception("LLM phrasing failed, fallback to template.")

        return self._template_message(state, recommendations, cheaper_alternative)

    def _template_message(self, state: SessionState, recommendations: list[dict], cheaper_alternative: dict | None) -> str:
        lines = [
            f"Mình đã lọc theo {state.skin_type}, {state.concern}, nhóm {state.category}" + (
                f", ngân sách {round(state.budget_min, 1)}-{round(state.budget_max, 1)}." if state.budget_min is not None and state.budget_max is not None
                else (f", ngân sách tối đa {round(state.budget_max, 1)}." if state.budget_max is not None else ".")
            )
        ]
        for idx, product in enumerate(recommendations, start=1):
            lines.append(f"{idx}) {product['name']} ({product['price']}) - {product['desc']}")
        if cheaper_alternative:
            lines.append(f"Gợi ý rẻ hơn: {cheaper_alternative['name']} ({cheaper_alternative['price']}).")
        lines.append("Bạn muốn mình chốt 1 lựa chọn an toàn nhất cho da của bạn không?")
        return "\n".join(lines)

    def _intent(self, message_lower: str) -> str:
        plain = self._strip_accents(message_lower)
        if re.search(r"\b(xin\s*chao|chao|hello|hi)\b", plain):
            return "greeting"
        if any(k in plain for k in ["ma giam gia", "voucher", "coupon", "khuyen mai", "uu dai"]):
            return "coupon"
        if any(k in plain for k in ["kiem tra don", "don hang", "tracking", "theo doi don"]):
            return "order_status"
        if re.search(r"\b(ship|giao\s*hang|freeship)\b", plain):
            return "shipping"
        if re.search(r"\b(doi\s*tra|hoan\s*tien|return)\b", plain):
            return "return"
        if re.search(r"\b(thanh\s*phan|cong\s*dung|huong\s*dan|cach\s*dung)\b", plain):
            return "info"
        return "consultation"

    def _extract_slots(self, message: str) -> dict:
        message_lower = message.lower()
        skin = self._resolve_alias(message_lower, self.skin_keywords)
        concern = self._resolve_alias(message_lower, self.concern_keywords)
        category = self._resolve_alias(message_lower, self.category_keywords)
        budget_min, budget_max = self._parse_budget(message)
        return {
            "skin_type": skin,
            "concern": concern,
            "category": category,
            "budget_min": budget_min,
            "budget_max": budget_max,
        }

    def process(self, message: str, session_id: str | None = None) -> dict:
        session_key = (session_id or "anonymous").strip()[:120]
        if session_key not in self.sessions:
            self.sessions[session_key] = SessionState()
        state = self.sessions[session_key]

        message_text = message.strip()
        message_lower = message_text.lower()

        if any(k in message_lower for k in ["reset", "làm mới", "bắt đầu lại", "xóa tư vấn"]):
            self.sessions[session_key] = SessionState()
            return {
                "intent": "reset",
                "message": "Mình đã reset phiên tư vấn. Bạn cho mình loại da, vấn đề da, ngân sách và loại sản phẩm nhé.",
                "data": None,
                "type": "text",
            }

        intent = self._intent(message_lower)
        if intent == "greeting":
            return {
                "intent": "greeting",
                "message": "Xin chào! Mình tư vấn theo catalog thật của TirTir. Bạn cho mình 4 thông tin: loại da, vấn đề da, ngân sách, và loại sản phẩm cần mua nhé.",
                "data": None,
                "type": "text",
            }
        if intent == "shipping":
            return {
                "intent": "shipping",
                "message": "Bên mình hỗ trợ kiểm tra giao hàng tại trang đơn hàng. Nếu cần, mình vẫn có thể tư vấn sản phẩm trước theo loại da và ngân sách của bạn.",
                "data": None,
                "type": "text",
            }
        if intent == "coupon":
            return {
                "intent": "coupon",
                "message": "Mình chưa tra mã giảm giá realtime trong chatbot này, nhưng bạn có thể xem mục Khuyến mãi/Mã giảm giá trên website. Nếu muốn, mình vẫn tư vấn sản phẩm phù hợp để bạn áp mã tối ưu nhé.",
                "data": None,
                "type": "text",
            }
        if intent == "order_status":
            return {
                "intent": "order_status",
                "message": "Bạn vào mục Tài khoản > Đơn hàng để kiểm tra trạng thái đơn. Nếu cần, gửi mình mã đơn để mình hướng dẫn chi tiết hơn nhé.",
                "data": None,
                "type": "text",
            }
        if intent == "return":
            return {
                "intent": "return",
                "message": "Chính sách đổi trả áp dụng theo tình trạng sản phẩm khi nhận hàng. Nếu bạn muốn, mình tiếp tục tư vấn sản phẩm phù hợp để giảm rủi ro chọn sai.",
                "data": None,
                "type": "text",
            }
        if intent == "info" and not any(k in message_lower for k in ["tư vấn", "gợi ý", "recommend", "chọn", "mua"]):
            return {
                "intent": "info",
                "message": "Mình có thể giải thích thành phần/công dụng chi tiết sau khi bạn chọn được sản phẩm phù hợp. Bạn cho mình loại da, vấn đề da, ngân sách và loại sản phẩm nhé.",
                "data": None,
                "type": "text",
            }

        extracted = self._extract_slots(message_text)
        if extracted["skin_type"]:
            state.skin_type = extracted["skin_type"]
        if extracted["concern"]:
            state.concern = extracted["concern"]
        if extracted["category"]:
            state.category = extracted["category"]
        if extracted["budget_min"] is not None:
            state.budget_min = extracted["budget_min"]
        if extracted["budget_max"] is not None:
            state.budget_max = extracted["budget_max"]

        if not self._has_any_filter(state):
            return {
                "intent": "consultation",
                "message": self._ask_for_filter(),
                "data": {
                    "collected": {
                        "skin_type": state.skin_type,
                        "concern": state.concern,
                        "budget_min": state.budget_min,
                        "budget_max": state.budget_max,
                        "category": state.category,
                    }
                },
                "type": "text",
            }

        filtered = self._filter_products(state)
        if filtered.empty:
            return {
                "intent": "consultation",
                "message": "Mình chưa tìm thấy sản phẩm khớp tiêu chí bạn nêu. Bạn có thể nới ngân sách, thay đổi tiêu chí khác hoặc cho mình thêm thông tin để mình lọc lại nhé.",
                "data": {
                    "filters": {
                        "skin_type": state.skin_type,
                        "concern": state.concern,
                        "budget_min": state.budget_min,
                        "budget_max": state.budget_max,
                        "category": state.category,
                    }
                },
                "type": "text",
            }

        scored = self._score_products(filtered, state)
        top_n = scored.head(3)

        recommendations = [
            self._to_product_payload(row, score=row["score"])
            for _, row in top_n.iterrows()
        ]
        best = recommendations[0]

        cheaper_rows = scored[scored["Price"] < top_n.iloc[0]["Price"]]
        cheaper_alternative = None
        if not cheaper_rows.empty:
            cheaper_alternative = self._to_product_payload(
                cheaper_rows.iloc[0], score=cheaper_rows.iloc[0]["score"]
            )

        phrased_message = self._render_with_llm(
            user_message=message_text,
            state=state,
            recommendations=recommendations,
            cheaper_alternative=cheaper_alternative,
        )

        return {
            "intent": "consultation",
            "message": phrased_message,
            "data": {
                **best,
                "recommendations": recommendations,
                "cheaper_alternative": cheaper_alternative,
                "filters": {
                    "skin_type": state.skin_type,
                    "concern": state.concern,
                    "budget_min": state.budget_min,
                    "budget_max": state.budget_max,
                    "category": state.category,
                },
                "scoring_formula": "0.5*concern_match + 0.3*skin_match + 0.2*budget_fit",
            },
            "type": "product",
        }