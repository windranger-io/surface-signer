# Delegated Signer Responsibility

## Abstract

Defines methods and message formatting to structure the delegating of message signing responsibilities to a substitute signer.

## Motivation

The security benefits of having the user manually verify every message they sign is quickly being negated by verification-fatigue.

By asking for too many signatures, we have found that some users are glossing over the details and simply accepting requested messages no matter what they say.

We want to develop a standardised signing process which will minimise the impact and improve the UX of requesting many similar signatures from a user.

## Specification

Delegated signer responsibility works as follows:

- The wallet presents the user with a structured plaintext message or equivalent interface for signing with the EIP-191 signature scheme (string prefixed with \x19Ethereum Signed Message:\n<length of message>). The message MUST incorporate the wallets Ethereum address, the delegated Ethereum address, domain requesting the signing, version of the message, a code to associate responsibilities, a chain identifier chain-id, uri for scoping, nonce acceptable to the server, and issued-at timestamp.
- The controlling wallet (A) signs the message (A)
- The delegated Wallet (B) signs future messages containing the controlling Wallet (A's) delegation
- Any verifier can verify that Wallet B is the signer of the second message, they can also verify the contained delegation was signed by Wallet A and perform any additional metadata checks to test for any disqualifying criteria (presented after session expiry etc...)

## Initial Session Delegation Message structure

The user signs message A (to approve the signer to sign future Messages on their behalf (until the session expires)):

```
https://windranger.io/ wants you to delegate signing responsibility from 0xDe9007A43772a745C434F9Eb6C519132Db2b14A5 to the following Ethereum account:

0x846c6f9ef8710823da4836971584ff932d751662

URI: https://windranger.io/
Version: 1
Chain ID: 1

Code: *
Nonce: 32891756
Signer: 0x846c6f9ef8710823da4836971584ff932d751662
Delegator: 0xDe9007A43772a745C434F9Eb6C519132Db2b14A5
Issued At: 2022-10-10T16:22:24Z
Expiration Time: 2022-10-10T17:22:24Z
Resources:
- ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/
- https://example.com/my-web2-claim.json
```

### Informal Message Template

A Bash-like informal template of the full message is presented below for readability and ease of understanding. Field descriptions are provided in the following section. A full ABNF description is provided in the section thereafter.

```
${domain} wants you to delegate signing ability from ${delegator} to the following Ethereum account:

${signer}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chain-id}

Code: ${code}
Nonce: ${nonce}
Signer: ${signer}
Delegator: ${delegator}

Issued At: ${issued-at}
Expiration Time: ${expiration-time}
Not Before: ${not-before}
Request ID: ${request-id}
Resources:
- ${resources[0]}
- ${resources[1]}
...
- ${resources[n]}
```

## Message Field Descriptions

- `authority` is the RFC 3986 authority that is requesting the signing.
- `delegator` is the Ethereum address performing the signing conformant to capitalization encoded checksum specified in EIP-55 where applicable.
- `signer` is the Ethereum address whom the delegator is delegating control to conformant to capitalization encoded checksum specified in EIP-55 where applicable.
- `statement` (optional) is a human-readable ASCII assertion that the user will sign, and it must not contain '\n' (the byte 0x0a).
- `uri` is an RFC 3986 URI referring to the resource that is the subject of the signing (as in the subject of a claim).
- `version` is the current version of the message, which MUST be 1 for this specification.
- `chain-id` is the EIP-155 Chain ID to which the session is bound, and the network where Contract Accounts must be resolved.
- `nonce` is a randomized token used to prevent replay attacks, at least 8 alphanumeric characters.
- `code` is an identifier to limit the types of messages the signer can sign on behalf of the delegator
- `issued-at` is the ISO 8601 datetime string of the current time.
- `expiration-time` (optional) is the ISO 8601 datetime string that, if present, indicates when the signed authentication message is no longer valid.
- `not-before` (optional) is the ISO 8601 datetime string that, if present, indicates when the signed authentication message will become valid.
- `request-id` (optional) is an system-specific identifier that may be used to uniquely refer to the sign-in request.
- `resources` (optional) is a list of information or references to information the user wishes to have resolved as part of authentication by the relying party. They are expressed as RFC 3986 URIs separated by "\n- ".

## ABNF Message Format

The message to be signed MUST conform with the following Augmented Backus–Naur Form (ABNF, RFC 5234) expression (note that %s denotes case sensitivity for a string term, as per RFC 7405).

```ABNF
sign-delegated-resposibilty =
    domain %s" wants you to delegate signing responsibility from" address %s" to the following Ethereum account:" LF
    LF
    signer LF
    LF
    [ statement LF ]
    LF
    %s"URI: " uri LF
    %s"Version: " version LF
    %s"Chain ID: " chain-id LF
    LF
    %s"Code: " code LF
    %s"Nonce: " nonce LF
    %s"Signer: " signer LF
    %s"Delegator: " address LF
    LF
    %s"Issued At: " issued-at
    [ LF %s"Expiration Time: " expiration-time ]
    [ LF %s"Not Before: " not-before ]
    [ LF %s"Request ID: " request-id ]
    [ LF %s"Resources:"
    resources ]

domain = authority
    ; From RFC 3986:
    ;     authority     = [ userinfo "@" ] host [ ":" port ]
    ; See RFC 3986 for the fully contextualized
    ; definition of "authority".

address = "0x" 40*40HEXDIG
    ; Must also conform to captilization
    ; checksum encoding specified in EIP-55
    ; where applicable (EOAs).

signer = "0x" 40*40HEXDIG
    ; Must also conform to captilization
    ; checksum encoding specified in EIP-55
    ; where applicable (EOAs).

code = 1*VCHAR
    ; ANY VARCHAR used to associate the coded
    ; messages the delegator is allowed to sign

statement = *( reserved / unreserved / " " )
    ; See RFC 3986 for the definition
    ; of "reserved" and "unreserved".
    ; The purpose is to exclude LF (line break).

uri = URI
    ; See RFC 3986 for the definition of "URI".

version = "1"

chain-id = 1*DIGIT
    ; See EIP-155 for valid CHAIN_IDs.

nonce = 8*( ALPHA / DIGIT )
    ; See RFC 5234 for the definition
    ; of "ALPHA" and "DIGIT".

issued-at = date-time
expiration-time = date-time
not-before = date-time
    ; See RFC 3339 (ISO 8601) for the
    ; definition of "date-time".

request-id = *pchar
    ; See RFC 3986 for the definition of "pchar".

resources = *( LF resource )

resource = "- " URI
```

## SignMessage response structure:

When a signature is requested for Message B, if the session is valid, the signing service will return the following structure:

```json
{
  "msg": "...",
  "delegation": "...",
  "signer": "0x0...",
  "delegator": "0x0...",
  "signatures": {
    "signer": "0x...",
    "delegator": "0x..."
  },
  "expiry": 1665267880,
  "issuedAt": 1665267880
}
```

## Wallet/Signer implementation guidelines

The interface to create and interact with a session looks something like...

```

// create a new session with a given msg and code
const session = signer.newSession("msg", "\*");

... users approves the session signature ...

// create a signed message without interaction from the user
const signedMessage = await session.signMessage("msg2", "1", false);

// verify both signatures...
const verified = signer.verifyMessage(signedMessage);

```

To verify a signature, the verifyMessage function will perform the following:

```

```
