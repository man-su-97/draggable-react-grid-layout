"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function GlowSection() {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["0 1", "1 0.6"],
	});

	const lightOpacity = useTransform(scrollYProgress, [1, 1], [0.5, 1]);
	const textOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);
	const lightSpread = useTransform(scrollYProgress, [0, 1], ["20%", "80%"]);
	const lightHeight = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);

	return (
		<section
			ref={ref}
			className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden"
		>
			<motion.div
				className="absolute top-1/3 w-60 h-0.4 rounded-sm shadow-2xl z-20"
				style={{
					opacity: lightOpacity.get(),
					backgroundColor: "#E64F57",
				}}
			/>

			<motion.div
				style={{
					opacity: lightOpacity,
					height: lightHeight,
					width: lightSpread,
				}}
				className="absolute top-[calc(30%+30px)] max-w-[700px] z-10"
			>
				<div
					className="w-full h-full blur-[250px]"
					style={{
						background:
							"linear-gradient(to bottom, rgba(230,79,87,0.9) 0%, rgba(230,79,87,0.2) 60%, transparent 100%)",
						clipPath: "polygon(33% 0%, 67% 0%, 100% 100%, 0% 100%)",
						borderRadius: "9rem",
						filter: "blur(5px)",
						backdropFilter: "blur(100px)",
					}}
				/>
			</motion.div>

			<motion.h1
				style={{ opacity: textOpacity }}
				className="relative z-30 mt-10 text-2xl md:text-3xl font-normal text-red-100 text-center max-w-lg"
			>
				Are you ready <br /> to experience the <br /> most painful death?
			</motion.h1>
		</section>
	);
}
