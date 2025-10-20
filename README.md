# HPZ Crew Chatbot Backend

Backend server untuk HPZ Crew Chatbot menggunakan Express.js dan OpenRouter API.

## 🚀 Fitur

- **OpenRouter API Integration** - AI chat dengan model Llama 3.1
- **Supabase Authentication** - Validasi JWT token otomatis
- **Command System** - Perintah khusus HPZ Crew (/misi, /poinku, dll)
- **Rate Limiting** - Proteksi dari spam requests
- **Indonesian Language Support** - Response dalam Bahasa Indonesia

## 📋 Prerequisites

- Node.js 18+
- OpenRouter API Key
- Supabase Project

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone <your-backend-repo>
cd hpz-chatbot-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Server akan running di `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `GET /api/auth/validate` - Validasi user token
- `GET /api/auth/me` - Get user info
- `POST /api/auth/validate-key` - Validate OpenRouter API key

### Chat
- `POST /api/chat/message` - Kirim pesan ke AI
- `GET /api/chat/commands` - List available commands
- `POST /api/chat/command` - Execute specific command
- `GET /api/chat/status` - Service status

### System
- `GET /health` - Health check

## 💬 Commands

Chatbot mendukung commands berikut:

- `/misi` - Tampilkan misi aktif
- `/poinku` - Cek total poin user
- `/tierku` - Info tier user
- `/faq` - Pertanyaan umum
- `/upgrade` - Cara naik tier
- `/hubungiadmin` - Kontak admin

## 🔧 Deployment ke Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. Set Environment Variables di Vercel

```bash
vercel env add OPENROUTER_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add FRONTEND_URL
```

### 4. Redeploy

```bash
vercel --prod
```

## 🏗️ Struktur Project

```
src/
├── routes/
│   ├── auth.js          # Auth endpoints
│   └── chat.js          # Chat endpoints
├── middleware/
│   └── supabaseAuth.js  # Supabase JWT verification
├── services/
│   ├── openRouter.js    # OpenRouter API integration
│   └── commands.js      # Command processing logic
└── app.js               # Express app setup
```

## 🧪 Testing

### Test Health Check

```bash
curl http://localhost:3001/health
```

### Test Authentication

```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     http://localhost:3001/api/auth/validate
```

### Test Chat Message

```bash
curl -X POST http://localhost:3001/api/chat/message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -d '{"message": "Hai, apa kabar?"}'
```

## 🔒 Security

- **JWT Validation** - Semua request kecuali health check memerlukan valid token
- **Rate Limiting** - 100 requests per 15 minutes per user
- **CORS Protection** - Hanya allow frontend domain
- **Input Sanitization** - Proteksi dari injection attacks

## 🐛 Troubleshooting

### OpenRouter API Error

```bash
# Check API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://openrouter.ai/api/v1/models
```

### Supabase Auth Error

Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah benar.

### CORS Error

Check FRONTEND_URL di environment variables sudah sesuai.

## 📞 Support

Jika ada masalah, hubungi:
- Email: crew@hpztv.com
- Discord: discord.gg/hpzcrew

## 📄 License

MIT License