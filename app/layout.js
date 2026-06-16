import "./globals.css";

export const metadata = {
  title: "Vloxy 🎤",
  description: "Entraîne ton éloquence avec l'IA — débats, discours, défis chronométrés.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bgdark overflow-x-hidden">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_60%)]" />
        {children}
      </body>
    </html>
  );
}
