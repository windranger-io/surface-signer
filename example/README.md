# Surface Signer (WR Bogotá Hackathon Project)

This project aims to make syncing with games more straightforward and accessible to the average game developer and provides a better UX to the user, limiting exposure to risk and mitigating annoying popups.

## Aims

We will expose additional functionality at the RPC layer to govern pre-authenticated message signing and improve the general UX with inpage dialogues for whenever they are required to avoid the window/gamer losing focus.

## Specification

Delegated message signing works as follows:

- The wallet presents the user with a structured plaintext message or equivalent interface for signing with the EIP-191 signature scheme (string prefixed with \x19Ethereum Signed Message:\n<length of message>). The message MUST incorporate the wallets Ethereum address, the delegated Ethereum address, domain requesting the signing, version of the message, a code to associate responsibilities, a chain identifier chain-id, uri for scoping, nonce acceptable to the server, and issued-at timestamp.
- The controlling wallet (A) signs the message (A)
- The delegated Wallet (B) signs future messages containing the controlling Wallet (A's) delegation
- Any verifier can verify that Wallet B is the signer of the second message, they can also verify the contained delegation was signed by Wallet A and perform any additional metadata checks to test for any disqualifying criteria (presented after session expiry etc...)

### Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.
