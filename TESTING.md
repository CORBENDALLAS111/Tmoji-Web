
# 🧪 TMoji Web Testing Guide

## Quick Start (3 Steps)

### Step 1: Setup Environment

```bash
# 1. Navigate to project
cd tmoji-web

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Set your bot token (get from @BotFather)
export BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### Step 2: Start Backend

```bash
# Terminal 1: Start backend
cd backend
python -m app.main

# Should see: "Uvicorn running on http://0.0.0.0:8000"
```

### Step 3: Run Tests

```bash
# Terminal 2: Test backend API
python scripts/test_backend.py

# Or open in browser:
open test.html
```

---

## 🔍 Detailed Testing

### Backend API Tests

#### Test 1: Health Check
```bash
curl http://localhost:8000/health
```
Expected response:
```json
{
  "status": "healthy",
  "telegram_api": true
}
```

#### Test 2: Load Emoji Pack
```bash
curl "http://localhost:8000/pack?url=vector_icons_by_fStikBot"
```

#### Test 3: Get Single Emoji
```bash
curl "http://localhost:8000/emoji/123456789"
```

### Frontend Tests

Open `test.html` in your browser and run:
1. ✅ Backend Connection
2. ✅ Load Emoji Pack
3. ✅ Render Single Emoji
4. ✅ Text Parsing

---

## 🐛 Common Issues

### Issue 1: "BOT_TOKEN not set"
**Solution:**
```bash
export BOT_TOKEN="your_actual_token"
```

### Issue 2: "404 Not Found" for emoji pack
**Cause:** Pack doesn't exist or is private
**Solution:** Try a public pack like `vector_icons_by_fStikBot`

### Issue 3: CORS errors in browser
**Solution:** Backend already has CORS enabled. Check that backend URL matches exactly.

### Issue 4: TGS animations not playing
**Solution:** Install lottie-web:
```bash
npm install lottie-web
```

---

## 📊 Expected Test Results

| Test | Expected | Time |
|------|----------|------|
| Backend health | ✅ 200 OK | <100ms |
| Load pack (50 emojis) | ✅ JSON response | 1-2s |
| Get emoji file URL | ✅ HTTPS URL | 500ms |
| Render PNG | ✅ Image displayed | Instant |
| Render TGS | ✅ Animation plays | 1-2s |

---

## 🎯 Production Testing

### Load Testing
```bash
# Install hey (HTTP load tester)
brew install hey

# Test backend performance
hey -n 1000 -c 50 http://localhost:8000/health
```

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📝 Manual Test Checklist

- [ ] Backend starts without errors
- [ ] Health check returns 200
- [ ] Can load public emoji pack
- [ ] Can get emoji file URL
- [ ] Frontend connects to backend
- [ ] Emojis render in browser
- [ ] Animations play smoothly
- [ ] Lazy loading works (scroll test)
- [ ] Cache persists across reloads
