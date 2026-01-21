import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className={`flex fixed h-screen w-screen z-[100] flex-col items-center justify-center text-center`}>
      <h1 className="text-8xl font-bold text-zinc-300">404</h1>
      <p className="mt-4 md:text-2xl text-gray-500 text-xl px-5">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="mt-6 text-lg text-blue-600 hover:underline">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
