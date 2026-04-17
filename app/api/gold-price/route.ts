import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.METALPRICE_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json({ error: "METALPRICE_API_KEY is missing. Please check your .env.local file." }, { status: 500 });
  }

  try {
    // MetalPrice API returns price per ounce. 
    // We want the price in TZS.
    // Base XAU returns rates relative to 1 ounce of gold.
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=XAU&currencies=TZS,USD`
    );

    const data = await response.json();

    if (!data.success) {
      console.error("MetalPrice API Error:", data);
      return NextResponse.json({ error: "Failed to fetch gold price" }, { status: 500 });
    }

    // Price of 1 ounce of gold in TZS
    const pricePerOunceTZS = data.rates.TZS;
    
    // 1 Troy Ounce = 31.1034768 grams
    const pricePerGramTZS = pricePerOunceTZS / 31.1034768;

    // We can also fetch history or change, but for now let's return the simplified data
    // Usually, we might want to compare with yesterday's price for the change percentage.
    // For simplicity, we'll return the current price.
    
    return NextResponse.json({
      price: Math.round(pricePerGramTZS),
      change: 0.0, // We could fetch this too if needed
      currency: "TZS",
      unit: "gram",
      timestamp: data.timestamp
    });
  } catch (error) {
    console.error("Gold Price Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
