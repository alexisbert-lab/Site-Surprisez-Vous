/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  serverExternalPackages: ['three', 'firebase', '@firebase/app', '@firebase/firestore', '@firebase/auth', '@firebase/storage'],
};

module.exports = nextConfig;
