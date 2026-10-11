import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import Ambient from '../components/Ambient';

export const metadata: Metadata = {
  title: 'EkDuniya 🇮🇳 (One World) — One identity. Every generation.',
  description: "India's next-generation social network: feed, reels, family tree, private briefcase, rewards. Web3-ready.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Ambient />
        {children}
      </body>
    </html>
  );
}
