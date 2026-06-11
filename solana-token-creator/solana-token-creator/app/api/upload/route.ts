import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const PINATA = "https://api.pinata.cloud/pinning";

// Pins logo + metadata JSON to IPFS via Pinata. Requires PINATA_JWT.
export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) return NextResponse.json({ error: "Uploads not configured. Set PINATA_JWT or use a logo URL." }, { status: 400 });

  const form = await req.formData();
  const name = String(form.get("name") || "");
  const symbol = String(form.get("symbol") || "");
  const description = String(form.get("description") || "");
  const tags = String(form.get("tags") || "");
  const creatorName = String(form.get("creatorName") || "");
  const creatorSite = String(form.get("creatorSite") || "");
  let image = String(form.get("imageUrl") || "");

  const file = form.get("file") as File | null;
  if (file) {
    const fd = new FormData();
    fd.append("file", file, file.name || "logo.png");
    const r = await fetch(`${PINATA}/pinFileToIPFS`, { method: "POST", headers: { Authorization: `Bearer ${jwt}` }, body: fd });
    if (!r.ok) return NextResponse.json({ error: `Logo upload failed (${r.status})` }, { status: 502 });
    const j = await r.json();
    image = `https://gateway.pinata.cloud/ipfs/${j.IpfsHash}`;
  }

  const metadata: Record<string, unknown> = { name, symbol, description, image };
  if (tags) metadata.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  if (creatorName || creatorSite) metadata.creator = { name: creatorName, site: creatorSite };

  const r2 = await fetch(`${PINATA}/pinJSONToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pinataContent: metadata, pinataMetadata: { name: `${symbol || name}-metadata` } }),
  });
  if (!r2.ok) return NextResponse.json({ error: `Metadata upload failed (${r2.status})` }, { status: 502 });
  const j2 = await r2.json();

  return NextResponse.json({ uri: `https://gateway.pinata.cloud/ipfs/${j2.IpfsHash}`, image });
}
