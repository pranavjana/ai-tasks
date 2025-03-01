import './globals.css';

export const metadata = {
  title: 'Task AI',
  description: 'Task management application with AI capabilities',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
} 