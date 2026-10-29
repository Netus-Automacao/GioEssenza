/** @type {import('next').NextConfig} */
module.exports = {
  eslint: { ignoreDuringBuilds: true },
  experimental: { staleTimes: { dynamic: 0, static: 30 } },
};
