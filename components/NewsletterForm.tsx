'use client';

export default function NewsletterForm() {
  return (
    <div className="flex rounded-lg overflow-hidden shadow-md">
      <input
        type="email"
        placeholder="Votre adresse e-mail"
        className="px-4 py-2.5 text-sm w-56 outline-none bg-white"
      />
      <button className="bg-sv-teal-dark hover:opacity-90 px-4 flex items-center justify-center text-white transition-opacity cursor-pointer">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
}
