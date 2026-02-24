"""
TMoji Web Backend Service

FastAPI backend for fetching and serving Telegram Premium Custom Emojis.
"""

import os
import re
import json
import asyncio
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
import httpx

# Telegram Bot API configuration
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
TELEGRAM_API_BASE = "https://api.telegram.org/bot"

# Storage paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ASSETS_DIR = os.path.join(DATA_DIR, "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)


# Pydantic Models
class EmojiData(BaseModel):
    id: str = Field(..., description="Unique custom emoji ID")
    short_name: str = Field(..., description="Short identifier name")
    emoji: Optional[str] = Field(None, description="Associated unicode emoji")
    file_type: str = Field(..., description="File format: png, tgs, webm, gif")
    file_url: str = Field(..., description="URL to emoji file")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail URL")
    width: int = Field(512, description="Width in pixels")
    height: int = Field(512, description="Height in pixels")
    is_animated: bool = Field(False, description="Whether emoji is animated")
    is_video: bool = Field(False, description="Whether emoji is video format")
    set_name: Optional[str] = Field(None, description="Pack name")
    needs_repainting: bool = Field(False, description="Whether emoji needs repainting")


class EmojiPack(BaseModel):
    name: str = Field(..., description="Pack name/identifier")
    title: str = Field(..., description="Display title")
    sticker_type: str = Field("custom_emoji", description="Type: regular, mask, custom_emoji")
    stickers: List[EmojiData] = Field(default_factory=list)
    thumbnail: Optional[str] = Field(None, description="Pack thumbnail URL")


class ErrorResponse(BaseModel):
    detail: str


# Telegram API Client
class TelegramAPI:
    def __init__(self, token: str):
        self.token = token
        self.base_url = f"{TELEGRAM_API_BASE}{token}"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_sticker_set(self, name: str) -> Optional[dict]:
        """Get sticker set by name"""
        url = f"{self.base_url}/getStickerSet"
        try:
            response = await self.client.post(url, json={"name": name})
            data = response.json()
            if data.get("ok"):
                return data.get("result")
            return None
        except Exception as e:
            print(f"Error fetching sticker set: {e}")
            return None

    async def get_custom_emoji_stickers(self, custom_emoji_ids: List[str]) -> List[dict]:
        """Get custom emoji stickers by IDs"""
        url = f"{self.base_url}/getCustomEmojiStickers"
        try:
            response = await self.client.post(url, json={"custom_emoji_ids": custom_emoji_ids})
            data = response.json()
            if data.get("ok"):
                return data.get("result", [])
            return []
        except Exception as e:
            print(f"Error fetching custom emojis: {e}")
            return []

    async def get_file(self, file_id: str) -> Optional[str]:
        """Get file download URL"""
        url = f"{self.base_url}/getFile"
        try:
            response = await self.client.post(url, json={"file_id": file_id})
            data = response.json()
            if data.get("ok"):
                file_path = data["result"].get("file_path")
                if file_path:
                    return f"https://api.telegram.org/file/bot{self.token}/{file_path}"
            return None
        except Exception as e:
            print(f"Error fetching file: {e}")
            return None

    async def download_file(self, file_url: str, local_path: str) -> bool:
        """Download file from Telegram"""
        try:
            async with self.client.stream("GET", file_url) as response:
                if response.status_code == 200:
                    os.makedirs(os.path.dirname(local_path), exist_ok=True)
                    with open(local_path, "wb") as f:
                        async for chunk in response.aiter_bytes():
                            f.write(chunk)
                    return True
            return False
        except Exception as e:
            print(f"Error downloading file: {e}")
            return False

    async def close(self):
        await self.client.aclose()


# Global Telegram API instance
telegram_api: Optional[TelegramAPI] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global telegram_api
    if BOT_TOKEN:
        telegram_api = TelegramAPI(BOT_TOKEN)
        print(f"Telegram API initialized with token")
    else:
        print("WARNING: No BOT_TOKEN set. API will work in mock mode.")
    yield
    if telegram_api:
        await telegram_api.close()


# Create FastAPI app
app = FastAPI(
    title="TMoji Web API",
    description="Backend API for Telegram Premium Custom Emojis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper functions
def extract_pack_name(url_or_name: str) -> str:
    """Extract pack name from Telegram URL or return as-is"""
    # Pattern: https://t.me/addemoji/PACK_NAME or t.me/addemoji/PACK_NAME
    pattern = r'(?:https?://)?t\.me/addemoji/([a-zA-Z0-9_]+)'
    match = re.search(pattern, url_or_name)
    if match:
        return match.group(1)
    return url_or_name


def sticker_to_emoji_data(sticker: dict, file_url: str) -> EmojiData:
    """Convert Telegram Sticker object to EmojiData"""
    file_type = "png"
    if sticker.get("is_animated"):
        file_type = "tgs"
    elif sticker.get("is_video"):
        file_type = "webm"

    return EmojiData(
        id=sticker.get("custom_emoji_id", sticker.get("file_id", "")),
        short_name=sticker.get("set_name", "emoji") + "_" + str(sticker.get("file_unique_id", "")[:8]),
        emoji=sticker.get("emoji"),
        file_type=file_type,
        file_url=file_url,
        thumbnail_url=None,
        width=sticker.get("width", 512),
        height=sticker.get("height", 512),
        is_animated=sticker.get("is_animated", False),
        is_video=sticker.get("is_video", False),
        set_name=sticker.get("set_name"),
        needs_repainting=sticker.get("needs_repainting", False)
    )


# API Endpoints
@app.get("/")
async def root():
    """API status"""
    return {
        "service": "TMoji Web API",
        "version": "1.0.0",
        "status": "active",
        "telegram_connected": telegram_api is not None
    }


@app.get("/pack", response_model=EmojiPack, responses={404: {"model": ErrorResponse}})
async def get_pack(url: str = Query(..., description="Telegram emoji pack URL or name")):
    """
    Load emoji pack by Telegram link or pack name.

    Example: /pack?url=https://t.me/addemoji/adaptive1pack_by_TMojiBot
    """
    if not telegram_api:
        raise HTTPException(status_code=503, detail="Telegram API not configured")

    pack_name = extract_pack_name(url)

    # Fetch from Telegram
    sticker_set = await telegram_api.get_sticker_set(pack_name)
    if not sticker_set:
        raise HTTPException(status_code=404, detail=f"Pack not found: {pack_name}")

    # Process stickers
    stickers = []
    for sticker in sticker_set.get("stickers", []):
        file_id = sticker.get("file_id")
        file_url = await telegram_api.get_file(file_id) or ""

        emoji_data = sticker_to_emoji_data(sticker, file_url)
        stickers.append(emoji_data)

    return EmojiPack(
        name=sticker_set.get("name", pack_name),
        title=sticker_set.get("title", pack_name),
        sticker_type=sticker_set.get("sticker_type", "custom_emoji"),
        stickers=stickers,
        thumbnail=sticker_set.get("thumbnail", {}).get("file_id")
    )


@app.get("/emoji/{emoji_id}", response_model=EmojiData, responses={404: {"model": ErrorResponse}})
async def get_emoji(emoji_id: str):
    """
    Get single emoji by custom emoji ID.

    - **emoji_id**: The custom emoji ID (numeric string)
    """
    if not telegram_api:
        raise HTTPException(status_code=503, detail="Telegram API not configured")

    stickers = await telegram_api.get_custom_emoji_stickers([emoji_id])
    if not stickers:
        raise HTTPException(status_code=404, detail=f"Emoji not found: {emoji_id}")

    sticker = stickers[0]
    file_id = sticker.get("file_id")
    file_url = await telegram_api.get_file(file_id) or ""

    return sticker_to_emoji_data(sticker, file_url)


@app.get("/manifest/{pack_id}", response_model=EmojiPack, responses={404: {"model": ErrorResponse}})
async def get_manifest(pack_id: str):
    """
    Get pack manifest JSON by pack ID/name.

    - **pack_id**: The pack name (e.g., adaptive1pack_by_TMojiBot)
    """
    if not telegram_api:
        raise HTTPException(status_code=503, detail="Telegram API not configured")

    sticker_set = await telegram_api.get_sticker_set(pack_id)
    if not sticker_set:
        raise HTTPException(status_code=404, detail=f"Pack not found: {pack_id}")

    stickers = []
    for sticker in sticker_set.get("stickers", []):
        file_id = sticker.get("file_id")
        file_url = await telegram_api.get_file(file_id) or ""
        emoji_data = sticker_to_emoji_data(sticker, file_url)
        stickers.append(emoji_data)

    return EmojiPack(
        name=sticker_set.get("name", pack_id),
        title=sticker_set.get("title", pack_id),
        sticker_type=sticker_set.get("sticker_type", "custom_emoji"),
        stickers=stickers
    )


@app.post("/cache/clear")
async def clear_cache():
    """Clear server-side cache (if implemented)"""
    return {"status": "ok", "message": "Cache cleared"}


# Health check
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "telegram_api": telegram_api is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
