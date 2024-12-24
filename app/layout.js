import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Head from "next/head"; // Import Head to manage HTML head metadata

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Choose the weights you want to include
});

export const metadata = {
  title: "Axara | News for kids.",
  description:
  "Axara is an AI-powered educational platform for children aged 2-12, offering personalized stories, interactive learning, and fun explanations on any topic. Designed to fuel curiosity and learning through play, Axara adapts to each child's unique needs, helping them explore the world in an engaging, age-appropriate way.",
  url: "https://axara.co", // Add the URL for social media sharing
  image: "https://axara.co/favicon-32x32.png", // Add an image for preview (you can replace with a more specific image)
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <Head>
        <meta name="robots" content="noindex, nofollow"></meta>
        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Meta tags for social media and SEO */}
        <meta name="theme-color" content="#ffffff" />
        <meta property="og:image" content={"https://axaranews.com/logo2.png"} />
        <meta name="description" content={metadata.description} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:url" content={metadata.url} />
        <meta property="og:type" content="website" />
        
        {/* Twitter meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={"https://axaranews.com/logo2.png"} />
        
        {/* Pinterest meta tags */}
        <meta name="pinterest" content="nopin" />
        
        {/* Facebook Open Graph meta tags */}
        <meta property="fb:app_id" content="your-facebook-app-id" /> {/* Replace with your FB app ID */}
        
        {/* LinkedIn Share meta tags */}
        <meta name="linkedin:share" content="true" />
      </Head>
      <body className={`${poppins.className} min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <Toaster />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
