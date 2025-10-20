import OpenAI from "openai"

class OpenRouterService {
	constructor() {
		// Don't initialize in constructor - do it lazily to ensure env vars are loaded
		this.openai = null
		this.apiKeyChecked = false

		// HPZ Crew system prompt based on knowledge base
		this.systemPrompt = `Kamu adalah asisten AI resmi dari HPZ Crew, komunitas digital untuk para rider dan kreator otomotif di Indonesia.

## INFORMASI DASAR HPZ CREW:
HPZ Crew dibentuk oleh HPZ TV sebagai wadah bagi para penggemar motor, modifikator, dan konten kreator otomotif. Di sini, kamu bisa belajar, berkolaborasi, dan berkontribusi sambil mendapatkan reward nyata.

## SISTEM TIERING:
- 🏁 Rookie Rider (0-499 poin): Starter Kit Digital, akses challenge dasar
- 🏍️ Pro Racer (500-1499 poin): Bonus poin 1.2x, fitur media sosial, merchandise eksklusif
- 🏆 HPZ Legend (1500+ poin): Produk gratis bulanan, event eksklusif, prioritas support

## CARA DAPAT POIN:
- Upload konten dengan #RideWithPride: +50 poin
- Ajak teman lewat link afiliasi: +100 poin
- Ikut challenge mingguan: +30 poin
- Hadir di event: +40 poin
- Penjualan via afiliasi: +150 poin

## REWARD:
- 500 poin: HPZ Merchandise Pack
- 1000 poin: HPZ Product Bundle
- 1500 poin: Tiket Event Nasional
- 2000 poin: Exclusive Legend Kit

## KONTAK HPZ:
- Email: crew@hpztv.com
- Instagram: @hpztv.official
- Discord: discord.gg/hpzcrew

## CARA RESPON:
- Gunakan bahasa Indonesia yang santai dan ramah
- Berikan informasi akurat tentang HPZ Crew
- Motivasi user untuk berkembang di komunitas
- Jika ada pertanyaan teknis, arahkan ke admin
- Selalu sertakan emoji yang relevan
- Berikan saran yang constructif

## PERINTAH KHUSUS:
Jika user mengirim perintah dengan "/" (seperti /misi, /poinku, dll), jelaskan bahwa perintah tersebut akan diproses oleh sistem command HPZ Crew.

Contoh respon:
"Perintah /misi kamu sedang diproses! 🚀 Aku akan menampilkan misi aktif yang bisa kamu kerjakan untuk mendapatkan poin tambahan."

Selalu berikan jawaban yang membantu, informatif, dan sesuai dengan nilai-nilai HPZ Crew: Brotherhood, Creativity, Growth! 🏍️✨`
	}

	// Initialize OpenAI client lazily to ensure env vars are loaded
	_ensureInitialized() {
		if (!this.openai) {
			const apiKey = process.env.OPEN_API_KEY

			if (!apiKey) {
				throw new Error(
					"OpenRouter API key not configured. Please set OPEN_API_KEY in your environment variables."
				)
			}

			this.openai = new OpenAI({
				baseURL: "https://openrouter.ai/api/v1",
				apiKey: apiKey,
				defaultHeaders: {
					"HTTP-Referer": process.env.FRONTEND_URL || "https://hpztv.com",
					"X-Title": "HPZ Crew Chatbot",
				},
			})
		}
	}

	async chatCompletion(messages, options = {}) {
		this._ensureInitialized() // Ensure client is initialized before use

		try {
			// Add system prompt if not present
			const hasSystemMessage = messages.some((msg) => msg.role === "system")
			const messagesWithSystem = hasSystemMessage
				? messages
				: [{ role: "system", content: this.systemPrompt }, ...messages]

			console.log("🤖 Sending request to OpenRouter...")

			const completion = await this.openai.chat.completions.create({
				model: options.model || "z-ai/glm-4.5-air:free",
				messages: messagesWithSystem,
				max_tokens: options.max_tokens || 1000,
				temperature: options.temperature || 0.7,
				top_p: options.top_p || 0.9,
				stream: options.stream || false,
				...options,
			})

			return completion
		} catch (error) {
			console.error(
				"OpenRouter API Error:",
				error.response?.data || error.message
			)

			if (error.status === 401) {
				throw new Error("Invalid OpenRouter API key")
			} else if (error.status === 429) {
				throw new Error("Rate limit exceeded. Please try again later.")
			} else if (error.status === 402) {
				throw new Error("Insufficient OpenRouter credits")
			} else {
				throw new Error("Failed to get response from AI service")
			}
		}
	}

	async simpleChat(userMessage, context = {}) {
		try {
			const messages = [
				{
					role: "user",
					content: userMessage,
				},
			]

			// Add context to the message if provided
			if (context.userTier || context.userPoints) {
				let contextInfo = ""
				if (context.userTier)
					contextInfo += `Tier pengguna: ${context.userTier}\n`
				if (context.userPoints)
					contextInfo += `Poin pengguna: ${context.userPoints}\n`

				messages[0].content = `${contextInfo}\n\nPesan user: ${userMessage}`
			}

			const response = await this.chatCompletion(messages)

			return {
				content:
					response.choices[0]?.message?.content ||
					"Maaf, aku tidak bisa memproses pesan itu.",
				usage: response.usage,
				model: response.model,
			}
		} catch (error) {
			console.error("Simple chat error:", error)

			// Fallback response
			return {
				content:
					"Maaf, sedang ada gangguan di sistem AI. Silakan coba lagi beberapa saat ya! 🙏",
				usage: null,
				model: null,
				error: error.message,
			}
		}
	}

	// Method to validate API key
	async validateApiKey() {
		try {
			this._ensureInitialized() // Ensure client is initialized before use
			const response = await this.openai.models.list()
			return response.data !== undefined
		} catch (error) {
			console.error("API key validation failed:", error)
			return false
		}
	}
}

export default new OpenRouterService()
