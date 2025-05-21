import SwipeDeck from '../components/SwipeDeck';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#f0f4ff] to-[#d9e4ff] pt-10">
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-indigo-800">Circl</h1>
        <p className="text-gray-600">Connect through your network</p>
      </header>
      
      <SwipeDeck />
    </main>
  );
}
