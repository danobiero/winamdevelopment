/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qgkjifmsbwfjzowejmqn.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // output: "export",
  async redirects() {
    return [
      {
        source: "/lessons",
        destination: "/opportunities",
        permanent: true,
      },
      {
        source: "/lessons/:path*",
        destination: "/opportunities",
        permanent: true,
      },
      {
        source: "/account/reservations",
        destination: "/account/investments",
        permanent: true,
      },
      {
        source: "/account/reservations/:path*",
        destination: "/account/investments",
        permanent: true,
      },
      {
        source: "/admin/lessons",
        destination: "/admin/opportunities",
        permanent: true,
      },
      {
        source: "/admin/lessons/:path*",
        destination: "/admin/opportunities",
        permanent: true,
      },
      {
        source: "/admin/bookings",
        destination: "/admin/investments",
        permanent: true,
      },
      {
        source: "/admin/bookings/:path*",
        destination: "/admin/investments",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
