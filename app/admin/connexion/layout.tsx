export default function AdminConnexionLayout({ children }: { children: React.ReactNode }) {
  // Override admin layout - no sidebar/topbar for login page
  return <>{children}</>;
}
