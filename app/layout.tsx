import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Simple Notes',
};

const font = localFont({
  src: [
    {
      path: './assets/font/Satoshi-Medium.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './assets/font/Satoshi-Black.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={font.className}>{children}</body>
    </html>
  );
}
