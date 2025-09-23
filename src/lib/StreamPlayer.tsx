"use client";

import React, { useEffect, useRef } from "react";
import axios from 'axios'
type Props = {
	streamPath: string;
};

export default function StreamPlayer({ streamPath = "live/stream1" }: Props) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		let pc: RTCPeerConnection | null = null;

		async function start() {
			try {
				pc = new RTCPeerConnection();

				pc.ontrack = (event) => {
					if (videoRef.current) {
						videoRef.current.srcObject = event.streams[0];
					}
				};

				pc.createDataChannel("chat");

				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				const normalizePath = (path: string): string => {
					path = path.replace(/^https?:\/\/[^/]+\/(stream\/)?/, "");
					path = path.replace(/\/$/, "");
					path = path.replace(/^stream\//, "");
					return path;
				};

				const effectivePath = normalizePath(streamPath);

				const res = await axios.post(
					`http://172.28.32.183:8889/stream/${effectivePath}`,
					offer.sdp, // SDP as raw body
					{
						headers: {
							"Content-Type": "application/sdp",
						},
						transformRequest: [(data) => data], // prevent axios from JSON-stringifying
						responseType: "text", // ensure we get raw SDP text back
					}
				);


				const answerSdp = await res.data;
				await pc.setRemoteDescription({
					type: "answer",
					sdp: answerSdp,
				});
			} catch (err) {
				console.error("WebRTC setup failed:", err);
			}
		}

		start();
		return () => {
			pc?.close();
		};
	}, [streamPath]);

	return (
		<video
			ref={videoRef}
			autoPlay
			playsInline
			controls
			className="w-full h-full rounded-md bg-black"
		/>
	);
}

// "use client";

// import React, { useEffect, useRef } from "react";

// type Props = {
//   streamPath: string;
// };

// export default function StreamPlayer({ streamPath = "live/stream1" }: Props) {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     let pc: RTCPeerConnection | null = null;
//     let stopped = false;

//     async function start() {
//       while (!stopped) {
//         try {
//           pc = new RTCPeerConnection();

//           pc.ontrack = (event) => {
//             if (videoRef.current) {
//               videoRef.current.srcObject = event.streams[0];
//             }
//           };

//           pc.createDataChannel("chat");

//           const offer = await pc.createOffer();
//           await pc.setLocalDescription(offer);

//           const res = await fetch(
//             `http://localhost:8889/stream/${streamPath}`,
//             {
//               method: "POST",
//               body: offer.sdp,
//               headers: { "Content-Type": "application/sdp" },
//             }
//           );

//           if (!res.ok) {
//             console.warn(
//               `Stream not ready yet (${res.status}). Retrying in 3s...`
//             );
//             await new Promise((r) => setTimeout(r, 3000));
//             continue;
//           }

//           const answerSdp = await res.text();
//           await pc.setRemoteDescription({
//             type: "answer",
//             sdp: answerSdp,
//           });

//           console.info("WebRTC connection established ✅");
//           break; // stop retry loop once connected
//         } catch (err) {
//           console.error("WebRTC setup failed, retrying in 3s:", err);
//           await new Promise((r) => setTimeout(r, 3000));
//         }
//       }
//     }

//     start();
//     return () => {
//       stopped = true;
//       pc?.close();
//     };
//   }, [streamPath]);

//   return (
//     <video
//       ref={videoRef}
//       autoPlay
//       playsInline
//       controls
//       className="w-full h-full rounded-md bg-black"
//     />
//   );
// }
