/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPages ? "/dropshipping" : "",
  assetPrefix: isGitHubPages ? "/dropshipping/" : "",
};

module.exports = nextConfig;
