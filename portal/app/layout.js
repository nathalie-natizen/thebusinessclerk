import './globals.css';
export const metadata = { title: 'Client Portal | The Business Clerk', robots: { index: false, follow: false } };
export default function Root({ children }) {
  return (<html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="icon" href="/favicon.svg" />
  </head><body>{children}</body></html>);
}
