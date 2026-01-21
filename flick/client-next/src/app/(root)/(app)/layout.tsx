import { ReactNode, useState } from "react"
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom"
import { PiCardsThreeFill, PiCardsThreeLight } from "react-icons/pi";
import { RiGraduationCapFill, RiGraduationCapLine } from "react-icons/ri";
import { PiFireFill, PiFireLight } from "react-icons/pi";
import { Separator } from "@/components/ui/separator";
import TerminateSessions from "@/components/actions/TerminateSessions";
import useProfileStore from "@/store/profileStore";
import CreatePost from "@/components/general/CreatePost";
import AuthCard from "@/components/general/AuthCard";
import { PostTopic } from "@/types/postTopics";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import { PostBranches } from "@/types/PostBranchs";
import { SocketProvider } from "@/socket/SocketContext";
import TrendingPostSection from "@/components/general/TrendingPostSection";

function AppLayout() {

  const [searchParams] = useSearchParams();
  const reset = searchParams.get('reset');

  return (
    <div className="flex max-w-[80rem] mx-auto w-full h-screen pr-8">
      <SocketProvider>
        <Sidebar />
        <Outlet />
        <TrendingPostSection/>
        {(reset === "true") && <TerminateSessions />}
      </SocketProvider>
    </div>
  )
}

function Sidebar() {

  const [showAllBranches, setShowAllBranches] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const theme = useProfileStore(state => state.theme)

  return (
    <>
      <div className="hidden md:block min-w-[270px] w-[270px] h-screen py-6 overflow-y-auto no-scrollbar space-y-1 px-4">
        <div className="flex justify-center items-center">
          <Link to="/">
            <img className="h-14 w-14 p-2" src={theme === "dark" ? "/logo-b.png" : "/logo-w.png"} alt="logo" />
          </Link>
        </div>
        <section className="space-y-2">
          <Tab to="/" text="Feed" activeIcon={<PiCardsThreeFill size={22} />} passiveIcon={<PiCardsThreeLight size={22} />} />
          <Tab to="/college" text="My College" activeIcon={<RiGraduationCapFill size={22} />} passiveIcon={<RiGraduationCapLine size={22} />} />
          <Tab to="/trending" text="Trending" activeIcon={<PiFireFill size={22} />} passiveIcon={<PiFireLight size={22} />} />
        </section>
        <Separator className="my-2" />
        <Heading text="Branches" />
        {showAllBranches
          ? <>
            {PostBranches.map((branch) => (
              <Tab key={branch} to={`/branch/${branch.toLowerCase().replace(" ", "+")}`} text={branch} />
            ))}
            <button className="flex justify-center items-center space-x-1 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pl-4 py-2" onClick={() => setShowAllBranches(false)}>
              <span>Show less</span>
              <IoMdArrowDropup className="text-xl" />
            </button>
          </>
          : <>
            {PostBranches.filter((_, index) => index < 5).map((branch) => (
              <Tab key={branch} to={`/branch/${branch.toLowerCase().replace(" ", "+")}`} text={branch} />
            ))}
            <button className="flex justify-center items-center space-x-1 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pl-4 py-2" onClick={() => setShowAllBranches(true)}>
              <span>Show more</span>
              <IoMdArrowDropdown className="text-xl" />
            </button>
          </>
        }
        <Separator className="my-2" />
        <Heading text="Topics" />
        {showAllTopics
          ? <>
            {PostTopic.map((topic) => (
              <Tab key={topic} to={`/topic/${topic.toLocaleLowerCase().replace(" / ", "_").replace(" ", "+")}`} text={topic} />
            ))}
            <button className="flex justify-center items-center space-x-1 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pl-4 py-2" onClick={() => setShowAllTopics(false)}>
              <span>Show less</span>
              <IoMdArrowDropup className="text-xl" />
            </button>
          </>
          : <>
            {PostTopic.filter((_, index) => index < 5).map((topic) => (
              <Tab key={topic} to={`/topic/${topic.toLocaleLowerCase().replace(" / ", "_").replace(" ", "+")}`} text={topic} />
            ))}
            <button className="flex justify-center items-center space-x-1 cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pl-4 py-2" onClick={() => setShowAllTopics(true)}>
              <span>Show more</span>
              <IoMdArrowDropdown className="text-xl" />
            </button>
          </>
        }
        <div className="h-24"></div>
      </div>
      <div className="fixed w-[270px] bottom-0 p-4 space-y-2 bg-zinc-100 dark:bg-zinc-900">
        <CreatePost className="" />
        <AuthCard className="bg-zinc-200 dark:bg-zinc-800 rounded-md" />
      </div>
    </>
  )
}

function Tab({ to, text, activeIcon, passiveIcon }: { to: string, text: string, activeIcon?: ReactNode, passiveIcon?: ReactNode }) {
  const location = useLocation().pathname
  return <Link to={to} className={`flex justify-start items-center space-x-3 px-4 ${activeIcon && passiveIcon ? "py-2" : "py-1.5"} rounded-md ${location === to ? "bg-zinc-200/50 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"}`}>
    {location === to ? (activeIcon || null) : (passiveIcon || null)}
    <span>
      {text}
    </span>
  </Link>
}

function Heading({ text }: { text: string }) {
  return (
    <h3 className="text-lg uppercase px-4 pt-3 pb-1">{text}</h3>
  )
}

export default AppLayout