import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { RateLimiterMemory } from "rate-limiter-flexible"

// Load environment variables BEFORE importing routes that use them
dotenv.config()

import authRoutes from "./routes/auth.js"
import chatRoutes from "./routes/chat.js"

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
	throw new Error("SUPABASE_URL is required in environment variables")
}

if (!process.env.SUPABASE_ANON_KEY) {
	throw new Error("SUPABASE_ANON_KEY is required in environment variables")
}

if (!process.env.OPEN_API_KEY) {
	throw new Error("OPEN_API_KEY is required in environment variables")
}

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase client
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY
)

// Rate limiting
const rateLimiter = new RateLimiterMemory({
	keyGenerator: (req) => req.user?.id || req.ip,
	points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
	duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900, // 15 minutes
})

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting middleware
app.use(async (req, res, next) => {
	try {
		await rateLimiter.consume(req)
		next()
	} catch (rejRes) {
		const remainingPoints = rejRes.remainingPoints || 0
		const msBeforeNext = rejRes.msBeforeNext || 0

		res.set({
			"X-RateLimit-Limit": rateLimiter.points,
			"X-RateLimit-Remaining": remainingPoints,
			"X-RateLimit-Reset": msBeforeNext,
		})

		res.status(429).json({
			error: "Too many requests",
			message: `Rate limit exceeded. Try again in ${Math.ceil(
				msBeforeNext / 1000
			)} seconds.`,
		})
	}
})

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		service: "HPZ Chatbot Backend",
		version: "1.0.0",
	})
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)

// Global error handler
app.use((error, req, res, next) => {
	console.error("Unhandled error:", error)
	res.status(500).json({
		error: "Internal Server Error",
		message: "An unexpected error occurred.",
	})
})

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({
		error: "Not Found",
		message: `Route ${req.originalUrl} not found.`,
	})
})

// Start server
app.listen(PORT, () => {
	console.log(`openRouter API Key: ${process.env.OPEN_API_KEY}`)
	console.log(`🚀 HPZ Chatbot Backend running on port ${PORT}`)
	console.log(`📊 Environment: ${process.env.NODE_ENV}`)
	console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`)
})

export default app
