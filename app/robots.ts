import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/product/"],
        disallow: ["/admin/", "/api/", "/checkout", "/payment/", "/seller/", "/store/", "/fit-studio/"],
      },
    ],
    sitemap: "https://www.wolves-territory.co/sitemap.xml",
    host: "https://www.wolves-territory.co",
  };
}
