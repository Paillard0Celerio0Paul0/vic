/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.externals.push({
      'react-native-config': 'react-native-config',
    });
    return config;
  },
  transpilePackages: ['konva', 'react-konva'],
}

module.exports = nextConfig 