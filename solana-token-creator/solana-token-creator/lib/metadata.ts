// Hand-rolled Metaplex Token Metadata "CreateMetadataAccountV3" instruction.
// Avoids the heavy @metaplex-foundation/umi dependency tree.
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export function findMetadataPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
}

function borshStr(s: string): Buffer {
  const b = Buffer.from(s, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(b.length, 0);
  return Buffer.concat([len, b]);
}

export function createMetadataV3Ix(params: {
  mint: PublicKey;
  mintAuthority: PublicKey;
  payer: PublicKey;
  updateAuthority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  isMutable: boolean;
}): TransactionInstruction {
  const { mint, mintAuthority, payer, updateAuthority, name, symbol, uri, isMutable } = params;

  // Args: discriminator(33) | DataV2 { name, symbol, uri, sellerFeeBasisPoints:u16,
  // creators:Option=None, collection:Option=None, uses:Option=None } | isMutable:bool | collectionDetails:Option=None
  const data = Buffer.concat([
    Buffer.from([33]),
    borshStr(name),
    borshStr(symbol),
    borshStr(uri),
    Buffer.from([0, 0]), // sellerFeeBasisPoints = 0
    Buffer.from([0]),    // creators: None
    Buffer.from([0]),    // collection: None
    Buffer.from([0]),    // uses: None
    Buffer.from([isMutable ? 1 : 0]),
    Buffer.from([0]),    // collectionDetails: None
  ]);

  return new TransactionInstruction({
    programId: TOKEN_METADATA_PROGRAM_ID,
    keys: [
      { pubkey: findMetadataPda(mint), isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });
}
