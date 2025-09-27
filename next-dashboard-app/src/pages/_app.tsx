import "@/styles/globals.css";
import { Toaster } from "sonner";
import type { AppProps } from "next/app";
import { Providers } from "@/lib/provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Providers>
        <Component {...pageProps} />
        <Toaster richColors position="bottom-right" />
      </Providers>

    </>
  );
}
