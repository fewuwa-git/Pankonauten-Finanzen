import type { NextConfig } from "next";

const securityHeaders = [
    // Prevent clickjacking
    { key: 'X-Frame-Options', value: 'DENY' },
    // Prevent MIME-type sniffing
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Control referrer information
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Restrict browser features
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    // Force HTTPS (1 year)
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    // Content Security Policy
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
        ].join('; '),
    },
];

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
