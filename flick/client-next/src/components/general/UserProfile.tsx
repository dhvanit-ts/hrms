import useProfileStore from '@/store/profileStore'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { IUser } from '@/types/User';
import { isCollege, isUser } from '@/utils/helpers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '../ui/dropdown-menu';
import { FaUser } from 'react-icons/fa';
import { MdFeedback } from "react-icons/md";
import { IoBookmarkSharp, IoSettingsSharp } from 'react-icons/io5'

const getCollegeProfile = (user: IUser | string) => isUser(user) && isCollege(user.college) ? user.college.profile : "Unknown College";

function UserProfile() {
  const profile = useProfileStore(state => state.profile)
  const navigate = useNavigate()
  return (
    <>
      {profile._id
        ? <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='cursor-pointer transition-colors duration-300 border-2 border-transparent hover:border-zinc-400'>
              <AvatarImage src={getCollegeProfile(profile)} alt={profile.username} />
              <AvatarFallback className='bg-zinc-200 dark:bg-zinc-800 cursor-pointer select-none'>{profile.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => navigate("/u/profile")} className='flex items-center space-x-1 px-1'>
              <FaUser size={12} />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/u/bookmarks")} className='flex items-center space-x-1 px-1'>
              <IoBookmarkSharp size={12} />
              <span>Bookmarks</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/feedback")} className='flex items-center space-x-1 px-1'>
              <MdFeedback size={12} />
              <span>Feedback</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/u/settings")} className='flex items-center space-x-1 px-1'>
              <IoSettingsSharp size={14} />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        : <Link className="flex justify-center items-center bg-zinc-800 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 px-3 py-1 rounded-sm transition-colors" to="/auth/signin">Sign in</Link>
      }
    </>
  )
}

export default UserProfile