"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalystIcon } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";

const team = [
	{
		name: "Shrman Chaudhuri",
		role: "Team Lead",
		desc: "Oversees testing to ensure smooth, bug-free functionality.",
		img: "/team/shraman.jpeg",
	},
	{
		name: "Pragati Kumari",
		role: "AI/ML Developer",
		desc: "Develops intelligent algorithms and AI models to optimize timetables and assist teachers, ensuring smart and efficient scheduling.",
		img: "/team/pragati.png",
	},
	{
		name: "Maisa Simran Hossain",
		role: "UI/UX Designer",
		desc: "Crafts intuitive and student-friendly interfaces, focusing on accessibility, usability, and visual consistency throughout Catalyst.",
		img: "/team/simran.jpeg",
	},
	{
		name: "Sreeza Das",
		role: "DevOps & Integrations",
		desc: "Manages deployment pipelines, cloud integrations, and ensures the Catalyst platform runs reliably and efficiently at all times.",
		img: "/team/sreeza.jpeg",
	},
	{
		name: "Raunak Ghosh",
		role: "Frontend Developer",
		desc: "Designs scalable and robust backend architecture, ensuring the system can handle multiple institutions and complex scheduling needs.",
		img: "/team/raunak.jpg",
	},
	{
		name: "Spandan Dhar",
		role: "Full-Stack Developer",
		desc: "Focused on backend systems, API design, and database optimization for Catalyst.",
		img: "/team/nadnaps.jpg",
	},
];

export default function MeetTheDevelopers() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const update = () => setIsMobile(window.innerWidth < 768);
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-background">
			{/* Header */}
			<header className="flex justify-between items-center px-6 sm:px-12 py-4 bg-background border-b">
				<div className="flex items-center gap-2">
					<CatalystIcon className="h-8 w-8 text-primary" />
					<span className="text-2xl font-bold text-primary">Catalyst</span>
				</div>
				<div className="flex items-center gap-4">
					<Link 
						href="/" 
						className="px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:text-primary transition"
					>
						Home
					</Link>
					<Link 
						href="/login"
						className="px-6 py-2 rounded-lg text-sm sm:text-base font-semibold bg-primary text-black hover:bg-primary/90 transition"
					>
						Login
					</Link>
				</div>
			</header>

			{/* Cover Section */}
			<section className="relative w-full h-[40vh] md:h-[60vh]">
				<Image
					src={isMobile ? "/team/team-grp-mobile.jpeg" : "/team/team-grp.jpeg"}
					alt="Catalyst Team"
					fill
					sizes="100vw"
					className="object-cover brightness-[0.85] object-center md:object-[10%_20%]"
					priority
				/>
			</section>

			{/* Team Grid */}
			<section className="flex-1 px-6 md:px-16 py-12 bg-muted/30">
				<h1 className="text-3xl md:text-5xl font-bold text-center mb-12 text-foreground">
					Meet the Developers
				</h1>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
					{team.map((member, idx) => (
						<Card
							key={idx}
							className="hover:shadow-xl transition-all duration-300 border border-muted-foreground/20 overflow-hidden group"
						>
							{/* Full-width rectangular image */}
							<div className="relative w-full aspect-[4/3]">
								<Image
									src={member.img}
									alt={member.name}
									fill
									sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
									className="rounded-t-lg object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							</div>

							<CardHeader className="text-center pt-6 pb-2">
								<CardTitle className="text-xl font-semibold">
									{member.name}
								</CardTitle>
								<p className="text-primary/80 font-medium">{member.role}</p>
							</CardHeader>

							<CardContent className="pb-6">
								<p className="text-muted-foreground text-sm text-center">
									{member.desc}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-black/80 text-white/60 text-center py-6 text-sm">
				© {new Date().getFullYear()} Catalyst Team — Made with ❤️ by students.
			</footer>
		</div>
	);
}
