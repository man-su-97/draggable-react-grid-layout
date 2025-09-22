import Dashboard from "@/components/dashboard/Dashboard";
import PdfInsightTester from "@/components/dashboard/PdfInsightTester";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export default function Home() {
	return (
		<div className={`${geistSans.className} ${geistMono.className} font-sans bg-black`}>
			{/* <NavBar /> */}
			<Dashboard />
			{/* <LandingSection /> */}
		</div>
	);
}
