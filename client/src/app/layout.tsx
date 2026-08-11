import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'UniConnect — Your Campus, Reimagined',
  description: 'The next-gen social platform for university students — stories, chats, events, reels, communities and more.',
};

const themeInitScript = `
  try {
    const theme = localStorage.getItem('uniconnect_theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
