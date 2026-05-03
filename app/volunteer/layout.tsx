export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-w-0 min-[900px]:bg-[#f4f0e8]">
      {children}
    </div>
  );
}
