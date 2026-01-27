import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";

function AuthLayout({children}:{children: React.ReactElement}) {
  return (
    <main
      className="flex items-center justify-center h-[calc(100vh-3.5rem)] p-8 sm:px-12 g:px-16 lg:py-12"
    >
      <Link className="absolute top-14 left-20 transition-colors p-2.5 rounded-full text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800" href="/">
        <IoArrowBack size={28}/>
      </Link>
      <Outlet />
    </main>
  );
}

export default AuthLayout;
