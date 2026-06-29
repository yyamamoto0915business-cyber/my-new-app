export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-w-0 min-[900px]:bg-[#f3f4f1]">
      {children}
    </div>
  );
}
