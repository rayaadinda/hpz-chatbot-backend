#!/usr/bin/env node

/**
 * Test script for HPZ Chatbot Backend
 * Validates: imports, structure, and database schema
 */

import { fileURLToPath } from "url"
import { dirname } from "path"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log("🧪 HPZ Chatbot Backend - Validation Tests\n")

const tests = []
let passed = 0
let failed = 0

// Test 1: Check required files exist
tests.push({
	name: "Required files exist",
	test: () => {
		const requiredFiles = [
			"src/app.js",
			"src/services/commands.js",
			"src/services/openRouter.js",
			"src/routes/auth.js",
			"src/routes/chat.js",
			"src/middleware/supabaseAuth.js",
			"api/index.js",
			"vercel.json",
			"supabase/migrations/20241023_initial_schema.sql",
		]

		for (const file of requiredFiles) {
			if (!fs.existsSync(file)) {
				throw new Error(`Missing required file: ${file}`)
			}
		}
	},
})

// Test 2: Validate vercel.json structure
tests.push({
	name: "vercel.json is valid",
	test: () => {
		const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"))
		if (!vercelConfig.rewrites) {
			throw new Error("vercel.json missing rewrites")
		}
	},
})

// Test 3: Check api/index.js exports app
tests.push({
	name: "api/index.js exports correctly",
	test: async () => {
		const apiIndex = fs.readFileSync("api/index.js", "utf8")
		if (!apiIndex.includes("export default app")) {
			throw new Error("api/index.js must export default app")
		}
	},
})

// Test 4: Commands service can be imported
tests.push({
	name: "Commands service imports successfully",
	test: async () => {
		const commandsModule = await import("./src/services/commands.js")
		if (!commandsModule.default) {
			throw new Error("Commands module missing default export")
		}
		const commands = commandsModule.default.commands
		const expectedCommands = [
			"/misi",
			"/poinku",
			"/tierku",
			"/faq",
			"/upgrade",
			"/hubungiadmin",
		]
		for (const cmd of expectedCommands) {
			if (!commands[cmd]) {
				throw new Error(`Missing command: ${cmd}`)
			}
		}
	},
})

// Test 5: Migration SQL is valid
tests.push({
	name: "Database migration SQL exists and has tables",
	test: () => {
		const migration = fs.readFileSync(
			"supabase/migrations/20241023_initial_schema.sql",
			"utf8"
		)
		const tables = [
			"tiers",
			"user_points",
			"user_activities",
			"missions",
			"user_missions",
			"user_referrals",
			"affiliate_sales",
		]
		for (const table of tables) {
			if (!migration.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
				throw new Error(`Migration missing table: ${table}`)
			}
		}
	},
})

// Run all tests
for (const test of tests) {
	try {
		await test.test()
		console.log(`✅ ${test.name}`)
		passed++
	} catch (error) {
		console.log(`❌ ${test.name}`)
		console.log(`   Error: ${error.message}`)
		failed++
	}
}

console.log(`\n${"=".repeat(50)}`)
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
console.log(`${"=".repeat(50)}\n`)

if (failed === 0) {
	console.log("🎉 All tests passed! Your backend is ready to deploy.")
	console.log("\n📝 Next steps:")
	console.log("   1. Run database migration in Supabase")
	console.log("   2. Set environment variables in Vercel")
	console.log("   3. Deploy with: vercel --prod")
	console.log("\n📚 See DEPLOYMENT.md for detailed instructions\n")
	process.exit(0)
} else {
	console.log("⚠️  Some tests failed. Please fix the issues above.\n")
	process.exit(1)
}
