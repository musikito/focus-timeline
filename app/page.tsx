import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto p-10 text-center">
      <h1 className="text-4xl font-bold mb-6">
        Focus Timeline
      </h1>
      <p className="text-gray-600 mb-8">
        Plan your week. Track what really happens. Improve continuously.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Get Started
      </Link>
    </div>
  );
}
