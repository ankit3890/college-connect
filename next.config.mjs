/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'mongoose'],
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
