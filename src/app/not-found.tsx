import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-white to-[#c7c7ff]">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Page Not Found</p>
        <Link
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          href="/"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
