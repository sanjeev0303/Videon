export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="landing-dark min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}