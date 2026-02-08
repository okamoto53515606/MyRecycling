import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'MyRecycling',
  description: 'A minimal Next.js application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#FFFFFF' }}>{children}</body>
    </html>
  );
}
