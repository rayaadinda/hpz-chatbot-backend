import { createClient } from "@supabase/supabase-js"

// Function to get Supabase client (lazy initialization)
const getSupabaseClient = () => {
	if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
		throw new Error(
			"SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
		)
	}

	return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

class CommandService {
	constructor() {
		this.commands = {
			"/misi": this.handleMisi.bind(this),
			"/poinku": this.handlePoinku.bind(this),
			"/tierku": this.handleTierku.bind(this),
			"/faq": this.handleFaq.bind(this),
			"/upgrade": this.handleUpgrade.bind(this),
			"/hubungiadmin": this.handleHubungiAdmin.bind(this),
		}
	}

	async processCommand(command, user) {
		try {
			const handler = this.commands[command.toLowerCase()]

			if (!handler) {
				return {
					type: "error",
					content: `❌ Perintah tidak dikenal: ${command}\n\nPerintah yang tersedia:\n${Object.keys(
						this.commands
					)
						.map((cmd) => `• ${cmd}`)
						.join("\n")}`,
				}
			}

			console.log(`🔧 Processing command: ${command} for user: ${user.email}`)
			return await handler(user)
		} catch (error) {
			console.error(`Command processing error for ${command}:`, error)
			return {
				type: "error",
				content:
					"❌ Terjadi kesalahan saat memproses perintah. Silakan coba lagi atau hubungi admin.",
			}
		}
	}

	async handleMisi(user) {
		// Mock mission data - in production, this would come from database
		const missions = {
			weekly: [
				{
					id: 1,
					title: "Motor Pride of The Week",
					description:
						"Upload foto motor kamu dengan caption cerita di balik modifikasinya",
					reward: "+30 poin",
					deadline: "7 hari lagi",
					status: "active",
				},
				{
					id: 2,
					title: "Weekend Riding Challenge",
					description: "Share video riding experience kamu di akhir pekan",
					reward: "+40 poin",
					deadline: "3 hari lagi",
					status: "active",
				},
			],
			monthly: [
				{
					id: 3,
					title: "HPZ Story Creator",
					description:
						"Buat video pendek tentang pengalamanmu dengan produk HPZ",
					reward: "+100 poin",
					deadline: "15 hari lagi",
					status: "active",
				},
			],
		}

		let response = "# 🎯 MISI AKTIF HPZ CREW\n\n"

		response += "## 📅 Misi Mingguan\n\n"
		missions.weekly.forEach((mission, index) => {
			response += `### ${index + 1}. ${mission.title}\n`
			response += `${mission.description}\n\n`
			response += `- 🎁 **Reward:** ${mission.reward}\n`
			response += `- ⏰ **Deadline:** ${mission.deadline}\n\n`
		})

		response += "## 📆 Misi Bulanan\n\n"
		missions.monthly.forEach((mission, index) => {
			response += `### ${index + 1}. ${mission.title}\n`
			response += `${mission.description}\n\n`
			response += `- 🎁 **Reward:** ${mission.reward}\n`
			response += `- ⏰ **Deadline:** ${mission.deadline}\n\n`
		})

		response += "---\n\n"
		response +=
			"💡 **Tips:** Gunakan hashtag #RideWithPride untuk memperbesar peluang approval!\n\n"
		response +=
			"📸 Upload konten berkualitas dan ikuti panduan yang sudah ditentukan ya! 🏍️✨"

		return {
			type: "misi",
			content: response,
			data: missions,
		}
	}

	async handlePoinku(user) {
		// Mock user points data - in production, fetch from database
		const mockUserData = {
			points: 1247,
			tier: "Pro Racer",
			pointsToNextTier: 253,
			recentActivities: [
				{
					description: "Instagram post with #RideWithPride",
					points: 50,
					date: "2024-10-19",
				},
				{
					description: "Friend joined via your link",
					points: 100,
					date: "2024-10-18",
				},
				{
					description: "Weekly challenge completion",
					points: 30,
					date: "2024-10-17",
				},
			],
		}

		let response = `# 💰 STATS POIN KAMU\n\n`
		response += `- 💎 **Total Poin:** ${mockUserData.points.toLocaleString()}\n`
		response += `- 🏆 **Tier Saat Ini:** ${mockUserData.tier}\n`
		response += `- 📈 **Poin ke Tier Berikutnya:** ${mockUserData.pointsToNextTier} poin lagi\n\n`

		response += "## 🕐 Aktivitas Terakhir\n\n"
		mockUserData.recentActivities.forEach((activity, index) => {
			response += `${index + 1}. **+${activity.points} poin** - ${
				activity.description
			} *(${activity.date})*\n`
		})

		response += `\n## 💡 Cara Dapat Poin Tambahan\n\n`
		response += `- Upload konten #RideWithPride: **+50 poin**\n`
		response += `- Ajak teman: **+100 poin**\n`
		response += `- Ikut challenge: **+30 poin**\n`
		response += `- Generate sale: **+150 poin**\n\n`
		response += `---\n\n`
		response += `🔥 Terus tingkatkan kontribusimu untuk naik tier! 🚀`

		return {
			type: "poinku",
			content: response,
			data: mockUserData,
		}
	}

	async handleTierku(user) {
		// Mock tier data
		const tierData = {
			current: {
				name: "Pro Racer",
				minPoints: 500,
				maxPoints: 1499,
				color: "🏍️",
				benefits: [
					"Bonus points multiplier (1.2x)",
					"Feature on HPZ social media",
					"Exclusive merchandise access",
					"Advanced challenge participation",
					"Monthly community calls",
				],
			},
			next: {
				name: "HPZ Legend",
				minPoints: 1500,
				color: "🏆",
				benefits: [
					"Free HPZ products monthly",
					"Exclusive event invitations",
					"Priority support",
					"Affiliate commission boost (1.5x)",
					"Personal brand feature",
					"Legend exclusive merchandise",
					"Direct line to HPZ team",
				],
			},
			currentPoints: 1247,
			pointsNeeded: 253,
			progressPercentage: 74.8,
		}

		let response = `# ${tierData.current.color} TIER KAMU: ${tierData.current.name}\n\n`
		response += `- 💎 **Poin Saat Ini:** ${tierData.currentPoints.toLocaleString()}\n`
		response += `- 📊 **Progress ke ${
			tierData.next.name
		}:** ${tierData.progressPercentage.toFixed(1)}%\n`
		response += `- 🎯 **Butuh:** ${tierData.pointsNeeded} poin lagi\n\n`

		response += `## ✨ Benefit ${tierData.current.name}\n\n`
		tierData.current.benefits.forEach((benefit, index) => {
			response += `${index + 1}. ${benefit}\n`
		})

		response += `\n## 🚀 Benefit ${tierData.next.name} (Coming Soon)\n\n`
		tierData.next.benefits.slice(0, 3).forEach((benefit, index) => {
			response += `${index + 1}. ${benefit}\n`
		})
		response += `\n... dan **${
			tierData.next.benefits.length - 3
		} benefit lainnya!**\n\n`

		response += `## 💡 Tips Cepat Naik Tier\n\n`
		response += `- Fokus pada konten berkualitas tinggi\n`
		response += `- Ajak teman-teman kamu bergabung\n`
		response += `- Ikuti semua challenge mingguan\n`
		response += `- Ciptakan konten viral untuk bonus engagement!\n\n`
		response += `---\n\n`
		response += `🔥 Kamu sudah di jalan yang benar! Tetap konsisten! 🏍️✨`

		return {
			type: "tierku",
			content: response,
			data: tierData,
		}
	}

	async handleFaq(user) {
		const faqs = [
			{
				question: "Bagaimana cara bergabung?",
				answer:
					"Isi form “Join HPZ Crew” di halaman utama, lalu tunggu email konfirmasi dari tim HPZ. Setelah disetujui, kamu akan mendapat akses ke server Discord dan bisa langsung mulai misi pertamamu.",
			},
			{
				question: "Apakah bergabung gratis?",
				answer:
					"Ya, 100% gratis untuk semua rider, kreator, maupun penggemar otomotif. Tidak ada biaya pendaftaran atau keanggotaan.",
			},
			{
				question: "Bagaimana cara klaim reward?",
				answer:
					"Semua reward tercatat otomatis di dashboard kamu. Setelah diverifikasi oleh tim HPZ, hadiah akan dikirimkan ke alamat atau akun yang kamu daftarkan.",
			},
			{
				question: "Apakah bisa ikut tanpa punya motor?",
				answer:
					"Bisa banget! 🚀 Selama kamu tertarik dengan dunia otomotif dan aktif membuat konten, kamu tetap bisa berpartisipasi penuh dalam HPZ Crew.",
			},
			{
				question: "Bagaimana cara mendapatkan poin dan naik level?",
				answer:
					"- Upload konten dengan hashtag resmi #RideWithPride.\n- Ajak teman bergabung melalui link afiliasi.\n- Ikuti challenge mingguan dan event lokal.\nSetiap aktivitas memberi poin; setelah mencapai batas tertentu, sistem otomatis menaikkan level kamu ke Pro Racer atau HPZ Legend.",
			},
			{
				question: "Apa saja keuntungan menjadi anggota HPZ Crew?",
				answer:
					"- Mendapat reward & merchandise eksklusif.\n- Akses ke event dan kopdar komunitas.\n- Kesempatan tampil di media HPZ TV.\n- Potensi penghasilan dari program afiliasi.\n- Kesempatan kolaborasi dengan micro influencer otomotif lainnya.",
			},
			{
				question: "Bagaimana cara menggunakan link afiliasi saya?",
				answer:
					"Masuk ke dashboard → salin link afiliasi unik kamu → bagikan di media sosial atau grup komunitasmu.\nSetiap pembelian melalui link tersebut otomatis menambah poin dan komisi kamu.",
			},
			{
				question: "Siapa yang bisa saya hubungi jika mengalami kendala?",
				answer:
					"- Chatbot perintah /hubungiadmin\n- Email: crew@hpztv.com\n- Channel Discord: #support\n- Instagram DM: @hpztv.official",
			},
		]

		let response = `# ❓ FAQ (Pertanyaan Dasar)\n\n`

		response += `1️\nQ: Bagaimana cara bergabung?\nA: Isi form “Join HPZ Crew” di halaman utama, lalu tunggu email konfirmasi dari tim HPZ. Setelah disetujui, kamu akan mendapat akses ke server Discord dan bisa langsung mulai misi pertamamu.\n\n`
		response += `2️\nQ: Apakah bergabung gratis?\nA: Ya, 100% gratis untuk semua rider, kreator, maupun penggemar otomotif. Tidak ada biaya pendaftaran atau keanggotaan.\n\n`
		response += `3️\nQ: Bagaimana cara klaim reward?\nA: Semua reward tercatat otomatis di dashboard kamu. Setelah diverifikasi oleh tim HPZ, hadiah akan dikirimkan ke alamat atau akun yang kamu daftarkan.\n\n`
		response += `4️\nQ: Apakah bisa ikut tanpa punya motor?\nA: Bisa banget! 🚀 Selama kamu tertarik dengan dunia otomotif dan aktif membuat konten, kamu tetap bisa berpartisipasi penuh dalam HPZ Crew.\n\n`
		response += `5️\nQ: Bagaimana cara mendapatkan poin dan naik level?\nA:\n- Upload konten dengan hashtag resmi #RideWithPride.\n- Ajak teman bergabung melalui link afiliasi.\n- Ikuti challenge mingguan dan event lokal.\nSetiap aktivitas memberi poin; setelah mencapai batas tertentu, sistem otomatis menaikkan level kamu ke Pro Racer atau HPZ Legend.\n\n`
		response += `6️\nQ: Apa saja keuntungan menjadi anggota HPZ Crew?\nA:\n- Mendapat reward & merchandise eksklusif.\n- Akses ke event dan kopdar komunitas.\n- Kesempatan tampil di media HPZ TV.\n- Potensi penghasilan dari program afiliasi.\n- Kesempatan kolaborasi dengan micro influencer otomotif lainnya.\n\n`
		response += `7️\nQ: Bagaimana cara menggunakan link afiliasi saya?\nA:\nMasuk ke dashboard → salin link afiliasi unik kamu → bagikan di media sosial atau grup komunitasmu.\nSetiap pembelian melalui link tersebut otomatis menambah poin dan komisi kamu.\n\n`
		response += `8️\nQ: Siapa yang bisa saya hubungi jika mengalami kendala?\nA:\n- Chatbot perintah /hubungiadmin\n- Email: crew@hpztv.com\n- Channel Discord: #support\n- Instagram DM: @hpztv.official\n`

		return {
			type: "faq",
			content: response,
			data: faqs,
		}
	}

	async handleUpgrade(user) {
		const upgradeInfo = {
			currentTier: "Pro Racer",
			nextTier: "HPZ Legend",
			currentPoints: 1247,
			neededPoints: 1500,
			requirements: {
				content: "10 approved contents (current: 7)",
				sales: "3 successful affiliate sales (current: 1)",
				membership: "90 days active membership (current: 67 days)",
				mentoring: "Mentor new members (current: 0)",
			},
		}

		let response = `# 🚀 UPGRADE TIER INFORMATION\n\n`
		response += `- 📍 **Posisi Kamu:** ${upgradeInfo.currentTier}\n`
		response += `- 🎯 **Target:** ${upgradeInfo.nextTier}\n`
		response += `- 💎 **Poin Saat Ini:** ${upgradeInfo.currentPoints}\n`
		response += `- 🎪 **Poin Dibutuhkan:** ${upgradeInfo.neededPoints}\n`
		response += `- 📈 **Kekurangan Poin:** ${
			upgradeInfo.neededPoints - upgradeInfo.currentPoints
		} poin\n\n`

		response += `## 📋 Requirements ${upgradeInfo.nextTier}\n\n`
		Object.entries(upgradeInfo.requirements).forEach(([key, value]) => {
			const emoji =
				key === "content"
					? "📸"
					: key === "sales"
					? "💰"
					: key === "membership"
					? "📅"
					: "🤝"
			response += `- ${emoji} ${value}\n`
		})

		response += `\n## 💡 Strategi Upgrade Cepat\n\n`
		response += `1. **Konten Berkualitas:** Upload 3 konten approved lagi\n`
		response += `2. **Affiliate Sales:** Fokus pada 2 penjualan lagi\n`
		response += `3. **Mentoring:** Bantu 2 member baru (bonus poin +50)\n`
		response += `4. **Engagement:** Tingkatkan engagement rate diatas 3%\n\n`

		response += `## 🔥 Tips Tambahan\n\n`
		response += `- Gunakan hashtag #RideWithPride di semua konten\n`
		response += `- Share konten di jam prime time (19:00-21:00)\n`
		response += `- Kolaborasi dengan member lain untuk boost engagement\n`
		response += `- Ikuti semua challenge mingguan tanpa terkecuali!\n\n`
		response += `---\n\n`
		response += `💪 Kamu sudah sangat dekat! Tetap semangat! 🏍️✨`

		return {
			type: "upgrade",
			content: response,
			data: upgradeInfo,
		}
	}

	async handleHubungiAdmin(user) {
		let response = `# 📞 HUBUNGI ADMIN HPZ CREW\n\n`

		response += `🔥 **Butuh bantuan sekarang?** Kami siap membantu kamu!\n\n`

		response += `## 📧 Email Support\n\n`
		response += `- **Email:** crew@hpztv.com\n`
		response += `- **Respon:** 1x24 jam\n`
		response += `- **Subject:** [BANTUAN] - Isi masalah kamu\n\n`

		response += `## 💬 Discord Community\n\n`
		response += `- **Server:** discord.gg/hpzcrew\n`
		response += `- **Channel:** #support\n`
		response += `- **Respon:** Langsung (jika admin online)\n\n`

		response += `## 📱 Social Media\n\n`
		response += `- **Instagram:** @hpztv.official (DM)\n`
		response += `- **Respon:** 2-4 jam (jam kerja)\n\n`

		response += `## 🚨 Urgent Matters\n\n`
		response += `Jika terkait keamanan akun atau keamanan data:\n\n`
		response += `- Sertakan user ID: \`${user.id}\`\n`
		response += `- Email ke: emergency@hpztv.com\n\n`

		response += `## 📝 Info Yang Dibutuhkan\n\n`
		response += `1. **User ID:** \`${user.id}\`\n`
		response += `2. **Email:** ${user.email}\n`
		response += `3. **Deskripsi masalah** (detail)\n`
		response += `4. **Screenshot** (jika ada error)\n\n`

		response += `## ⏰ Jam Operasional\n\n`
		response += `- **Senin - Jumat:** 09:00 - 18:00 WIB\n`
		response += `- **Sabtu:** 09:00 - 15:00 WIB\n`
		response += `- **Minggu & Libur:** Emergency only\n\n`

		response += `## 💡 Quick Response\n\n`
		response += `Untuk pertanyaan umum, coba gunakan perintah:\n\n`
		response += `- **/faq** - Pertanyaan yang sering diajukan\n`
		response += `- **/misi** - Info misi aktif\n`
		response += `- **/poinku** - Cek poin dan progress\n\n`
		response += `---\n\n`
		response += `🤝 Tim HPZ Crew selalu siap membantu perjalanan kamu di komunitas! 🏍️✨`

		return {
			type: "hubungiadmin",
			content: response,
			data: {
				userId: user.id,
				userEmail: user.email,
			},
		}
	}

	// Check if a message is a command
	isCommand(message) {
		return (
			message.trim().toLowerCase().startsWith("/") &&
			Object.keys(this.commands).includes(
				message.trim().toLowerCase().split(" ")[0]
			)
		)
	}

	// Extract command from message
	extractCommand(message) {
		return message.trim().toLowerCase().split(" ")[0]
	}
}

export default new CommandService()
