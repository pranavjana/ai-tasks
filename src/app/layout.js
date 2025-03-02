import './globals.css';
import { Inter } from 'next/font/google';

// Load Inter font with subsets
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: {
    default: 'Task AI',
    template: '%s | Task AI',
  },
  description: 'Task management application with AI capabilities',
  keywords: ['task management', 'AI', 'productivity', 'organization'],
  authors: [{ name: 'Task AI Team' }],
  creator: 'Task AI',
  publisher: 'Task AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Task AI',
    description: 'Task management application with AI capabilities',
    url: 'http://localhost:3000',
    siteName: 'Task AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Task AI',
    description: 'Task management application with AI capabilities',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://ihiuqrjobgyjujyboqnv.supabase.co" />
        <meta name="theme-color" content="#343541" />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
} 