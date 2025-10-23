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

// Helper function to get user_account_id from auth user
const getUserAccountId = async (supabase, authUserId) => {
	const { data, error } = await supabase
		.from("user_accounts")
		.select("id")
		.eq("auth_user_id", authUserId)
		.single()

	if (error) {
		console.error("Error fetching user_account_id:", error)
		return null
	}

	return data?.id
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
		const supabase = getSupabaseClient()
		let missions = {
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

		try {
			// Fetch active missions from chatbot_missions table
			const { data: allMissions, error: missionsError } = await supabase
				.from("chatbot_missions")
				.select("*")
				.eq("status", "active")
				.order("end_date", { ascending: true })

			if (missionsError) throw missionsError

			// Calculate days remaining for each mission
			const calculateDaysRemaining = (endDate) => {
				const now = new Date()
				const end = new Date(endDate)
				const diffTime = end - now
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
				return diffDays > 0 ? `${diffDays} hari lagi` : "Berakhir hari ini"
			}

			// Separate missions by type
			if (allMissions && allMissions.length > 0) {
				missions = {
					weekly: allMissions
						.filter((m) => m.mission_type === "weekly")
						.map((m) => ({
							id: m.id,
							title: m.title,
							description: m.description,
							reward: `+${m.reward_points} poin`,
							deadline: calculateDaysRemaining(m.end_date),
							status: m.status,
						})),
					monthly: allMissions
						.filter((m) => m.mission_type === "monthly")
						.map((m) => ({
							id: m.id,
							title: m.title,
							description: m.description,
							reward: `+${m.reward_points} poin`,
							deadline: calculateDaysRemaining(m.end_date),
							status: m.status,
						})),
				}
			}
		} catch (error) {
			console.error("Error fetching missions:", error)
			// missions already initialized with fallback values
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
		const supabase = getSupabaseClient()
		let mockUserData = {
			points: 0,
			tier: "Rookie Rider",
			pointsToNextTier: 500,
			recentActivities: [],
		}

		try {
			// Get user_account_id from auth user
			const userAccountId = await getUserAccountId(supabase, user.id)
			if (!userAccountId) throw new Error("User account not found")

			// Fetch user points and tier data
			let { data: userPointsData, error: pointsError } = await supabase
				.from("user_points")
				.select(
					`
          total_points,
          submission_points,
          approval_points,
          engagement_points,
          weekly_win_points,
          tiers (
            name,
            min_points,
            max_points
          )
        `
				)
				.eq("user_id", userAccountId)
				.single()

			if (pointsError) {
				// If user doesn't exist in user_points, initialize them
				if (pointsError.code === "PGRST116") {
					const { data: newUserPoints, error: insertError } = await supabase
						.from("user_points")
						.insert({ user_id: userAccountId })
						.select(
							`
              total_points,
              submission_points,
              approval_points,
              engagement_points,
              weekly_win_points,
              tiers (
                name,
                min_points,
                max_points
              )
            `
						)
						.single()

					if (insertError) throw insertError
					userPointsData = newUserPoints
				} else {
					throw pointsError
				}
			}

			// Fetch recent activities from chatbot_activities
			const { data: activities, error: activitiesError } = await supabase
				.from("chatbot_activities")
				.select("description, points, created_at")
				.eq("user_account_id", userAccountId)
				.order("created_at", { ascending: false })
				.limit(3)

			if (activitiesError) throw activitiesError

			// Calculate points to next tier
			const currentPoints = userPointsData.total_points || 0
			const { data: nextTier, error: tierError } = await supabase
				.from("tiers")
				.select("name, min_points")
				.gt("min_points", currentPoints)
				.order("min_points", { ascending: true })
				.limit(1)
				.single()

			let pointsToNextTier = 0
			if (!tierError && nextTier) {
				pointsToNextTier = nextTier.min_points - currentPoints
			}

			mockUserData = {
				points: currentPoints,
				tier: userPointsData.tiers?.name || "Rookie Rider",
				pointsToNextTier: pointsToNextTier,
				recentActivities: (activities || []).map((activity) => ({
					description: activity.description,
					points: activity.points,
					date: new Date(activity.created_at).toISOString().split("T")[0],
				})),
			}
		} catch (error) {
			console.error("Error fetching user points data:", error)
			// mockUserData already initialized with fallback values
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
		const supabase = getSupabaseClient()
		let tierData = {
			current: {
				name: "Rookie Rider",
				minPoints: 0,
				maxPoints: 499,
				color: "🏍️",
				benefits: [
					"Access to Discord community",
					"Basic missions",
					"Monthly newsletter",
				],
			},
			next: {
				name: "Pro Racer",
				minPoints: 500,
				color: "🏍️",
				benefits: [
					"Bonus points multiplier (1.2x)",
					"Feature on HPZ social media",
					"Exclusive merchandise access",
				],
			},
			currentPoints: 0,
			pointsNeeded: 500,
			progressPercentage: 0,
		}

		try {
			// Get user_account_id from auth user
			const userAccountId = await getUserAccountId(supabase, user.id)
			if (!userAccountId) throw new Error("User account not found")

			// Fetch user's current tier and points
			let { data: userPointsData, error: pointsError } = await supabase
				.from("user_points")
				.select(
					`
          total_points,
          tiers (
            name,
            min_points,
            max_points,
            color,
            benefits
          )
        `
				)
				.eq("user_id", userAccountId)
				.single()

			if (pointsError) {
				// Initialize user if not exists
				if (pointsError.code === "PGRST116") {
					const { data: newUserPoints, error: insertError } = await supabase
						.from("user_points")
						.insert({ user_id: userAccountId })
						.select(
							`
              total_points,
              tiers (
                name,
                min_points,
                max_points,
                color,
                benefits
              )
            `
						)
						.single()

					if (insertError) throw insertError
					userPointsData = newUserPoints
				} else {
					throw pointsError
				}
			}

			const currentPoints = userPointsData.total_points || 0
			const currentTier = userPointsData.tiers || {
				name: "Rookie Rider",
				min_points: 0,
				max_points: 499,
				color: "🏍️",
				benefits: [
					"Access to Discord community",
					"Basic missions",
					"Monthly newsletter",
				],
			}

			// Fetch next tier
			const { data: nextTierData, error: nextTierError } = await supabase
				.from("tiers")
				.select("*")
				.gt("min_points", currentPoints)
				.order("min_points", { ascending: true })
				.limit(1)
				.single()

			let pointsNeeded = 0
			let progressPercentage = 0

			if (!nextTierError && nextTierData) {
				pointsNeeded = nextTierData.min_points - currentPoints
				const tierRange = nextTierData.min_points - currentTier.min_points
				const progressInTier = currentPoints - currentTier.min_points
				progressPercentage = (progressInTier / tierRange) * 100
			} else {
				// User is at max tier
				progressPercentage = 100
			}

			tierData = {
				current: {
					name: currentTier.name,
					minPoints: currentTier.min_points,
					maxPoints: currentTier.max_points,
					color: currentTier.color,
					benefits: Array.isArray(currentTier.benefits)
						? currentTier.benefits
						: [],
				},
				next: nextTierData
					? {
							name: nextTierData.name,
							minPoints: nextTierData.min_points,
							color: nextTierData.color,
							benefits: Array.isArray(nextTierData.benefits)
								? nextTierData.benefits
								: [],
					  }
					: null,
				currentPoints: currentPoints,
				pointsNeeded: pointsNeeded,
				progressPercentage: Math.min(progressPercentage, 100),
			}
		} catch (error) {
			console.error("Error fetching tier data:", error)
			// tierData already initialized with fallback values
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

		if (tierData.next) {
			response += `\n## 🚀 Benefit ${tierData.next.name} (Coming Soon)\n\n`
			const benefitsToShow = tierData.next.benefits.slice(0, 3)
			benefitsToShow.forEach((benefit, index) => {
				response += `${index + 1}. ${benefit}\n`
			})
			if (tierData.next.benefits.length > 3) {
				response += `\n... dan **${
					tierData.next.benefits.length - 3
				} benefit lainnya!**\n\n`
			}
		} else {
			response += `\n## 🎉 Kamu Sudah di Tier Tertinggi!\n\n`
			response += `Selamat! Kamu sudah mencapai tier maksimal HPZ Crew. Terus pertahankan kontribusimu! 🏆\n\n`
		}

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
		const supabase = getSupabaseClient()
		let upgradeInfo = {
			currentTier: "Rookie Rider",
			nextTier: "Pro Racer",
			currentPoints: 0,
			neededPoints: 500,
			requirements: {
				content: "10 approved contents (current: 0)",
				sales: "3 successful affiliate sales (current: 0)",
				membership: "90 days active membership (current: 0 days)",
				mentoring: "Mentor new members (current: 0)",
			},
		}

		try {
			// Get user_account_id from auth user
			const userAccountId = await getUserAccountId(supabase, user.id)
			if (!userAccountId) throw new Error("User account not found")

			// Fetch user points and tier
			const { data: userPointsData, error: pointsError } = await supabase
				.from("user_points")
				.select(
					`
          total_points,
          created_at,
          tiers (name)
        `
				)
				.eq("user_id", userAccountId)
				.single()

			if (pointsError) throw pointsError

			const currentPoints = userPointsData.total_points || 0

			// Fetch next tier info
			const { data: nextTier, error: nextTierError } = await supabase
				.from("tiers")
				.select("name, min_points")
				.gt("min_points", currentPoints)
				.order("min_points", { ascending: true })
				.limit(1)
				.single()

			// Count approved content from ugc_content
			const { count: contentCount, error: contentError } = await supabase
				.from("ugc_content")
				.select("*", { count: "exact", head: true })
				.eq("status", "approved_for_repost")

			// Count affiliate sales
			const { count: salesCount, error: salesError } = await supabase
				.from("affiliate_sales")
				.select("*", { count: "exact", head: true })
				.eq("user_account_id", userAccountId)
				.eq("status", "approved")

			// Calculate membership days from user_accounts
			const { data: userAccount, error: accountError } = await supabase
				.from("user_accounts")
				.select("created_at")
				.eq("id", userAccountId)
				.single()

			const membershipDays = userAccount
				? Math.floor(
						(new Date() - new Date(userAccount.created_at)) /
							(1000 * 60 * 60 * 24)
				  )
				: 0

			// Count referrals via referred_by
			const { count: referralCount, error: referralError } = await supabase
				.from("user_accounts")
				.select("*", { count: "exact", head: true })
				.eq("referred_by", userAccountId)

			upgradeInfo = {
				currentTier: userPointsData.tiers?.name || "Rookie Rider",
				nextTier: nextTier?.name || "Max Tier Reached",
				currentPoints: currentPoints,
				neededPoints: nextTier?.min_points || currentPoints,
				requirements: {
					content: `10 approved contents (current: ${contentCount || 0})`,
					sales: `3 successful affiliate sales (current: ${salesCount || 0})`,
					membership: `90 days active membership (current: ${membershipDays} days)`,
					mentoring: `Mentor new members (current: ${referralCount || 0})`,
				},
			}
		} catch (error) {
			console.error("Error fetching upgrade info:", error)
			// upgradeInfo already initialized with fallback values
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
