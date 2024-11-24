import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Simple Notes',
};

const myFont = localFont({ src: './font.woff2' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link
          rel='icon'
          type='image/png'
          href='/favicon-96x96.png'
          sizes='96x96'
        />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        <link rel='shortcut icon' href='/favicon.ico' />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/apple-touch-icon.png'
        />
        <meta name='apple-mobile-web-app-title' content='Notes' />
        <link rel='manifest' href='/site.webmanifest' />
        <script
          defer
          src='https://cloud.umami.is/script.js'
          data-website-id='9f2b2e03-0f3c-440b-961d-4336b3cd5ff0'
        ></script>
        <meta name='robots' content='noindex, nofollow' />
      </head>
      <body className={myFont.className}>{children}</body>
    </html>
  );
}
