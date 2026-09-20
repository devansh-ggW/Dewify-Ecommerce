window.DEWIFY_CONFIG = {
  brand: "DEWIFY",
  supportEmail: "dewifystores@gmail.com",

  // Paddle Billing frontend setup.
  // Client-side tokens are intended for frontend use. Never put Paddle API keys here.
  PADDLE_ENVIRONMENT: "production",
  PADDLE_CLIENT_TOKEN: "",

  products: [
    {
      id: "devcore",
      name: "DEWIFY DevCore",
      version: "V1.0.0",
      category: "PC SOFTWARE",
      type: "One-time digital purchase",
      compatibility: "Windows PC",
      priceId: "",
      displayPrice: "View price at checkout",
      image: "https://raw.githubusercontent.com/devansh-ggW/DEWIFY-GG/main/devcore.png",
      description: "A lightweight developer workspace built for everyday coding without the weight of a full IDE.",
      highlights: [
        "Lightweight Windows app",
        "Developer-focused workspace",
        "Fast, simple workflow",
        "Digital delivery after purchase"
      ],
      downloadUrl: "https://mediafire.com/file/wx1yt9lbubtoa2k/DevCore-+V1.0.0.zip/file"
    }
  ]
};
