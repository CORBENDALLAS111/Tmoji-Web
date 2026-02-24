#!/usr/bin/env python3
"""
Test script for TMoji Web Backend
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import TelegramAPI, extract_pack_name, sticker_to_emoji_data

async def test_backend():
    """Test backend functionality"""

    # Get token from environment
    token = os.getenv('BOT_TOKEN')
    if not token:
        print("❌ ERROR: Set BOT_TOKEN environment variable first!")
        print("   Example: export BOT_TOKEN='123456789:ABCdef...'")
        return

    print("🚀 Testing TMoji Backend...")
    print(f"   Token: {token[:10]}...")

    api = TelegramAPI(token)

    try:
        # Test 1: Get sticker set
        print("\n📦 Test 1: Loading emoji pack...")
        pack_name = "vector_icons_by_fStikBot"  # Public pack
        sticker_set = await api.get_sticker_set(pack_name)

        if sticker_set:
            print(f"   ✅ Success! Loaded: {sticker_set.get('title', 'Unknown')}")
            print(f"   📊 Stickers: {len(sticker_set.get('stickers', []))}")
            print(f"   📝 Type: {sticker_set.get('sticker_type', 'unknown')}")
        else:
            print("   ❌ Failed to load pack")

        # Test 2: Get file URL
        if sticker_set and sticker_set.get('stickers'):
            print("\n📄 Test 2: Getting file URL...")
            first_sticker = sticker_set['stickers'][0]
            file_id = first_sticker.get('file_id')
            file_url = await api.get_file(file_id)

            if file_url:
                print(f"   ✅ File URL: {file_url[:60]}...")
            else:
                print("   ❌ Failed to get file URL")

        # Test 3: Custom emoji (if available)
        print("\n🎨 Test 3: Testing custom emoji endpoint...")
        # Note: You need actual custom_emoji_ids from Telegram messages
        # This is just a structure test
        print("   ℹ️  To test custom emojis, get emoji IDs from Telegram messages")

    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        await api.close()

if __name__ == "__main__":
    asyncio.run(test_backend())
