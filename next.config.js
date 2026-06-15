/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  serverExternalPackages: ['three', 'firebase', '@firebase/app', '@firebase/firestore', '@firebase/auth', '@firebase/storage'],
};

module.exports = nextConfig;
