/* eslint-disable no-console */
import {
  verifyMessage as verifier,
  keccak256,
  toUtf8Bytes,
} from "ethers/lib/utils";

// contain the injected context
(async () => {
  // get the script block
  const injected = document.getElementById("signer-injection");
  const src = injected.getAttribute("src").split("customEvent=");
  // extract the dynamic initial custom event id (we replace this on first contact)
  const customEvent = src[1];
  const seededEvent = keccak256(
    toUtf8Bytes(`${crypto.getRandomValues(new Uint32Array(1))[0]}`)
  );

  // dispatch welcome message to move listeners over to seededEvent id
  document.dispatchEvent(
    new CustomEvent(customEvent, {
      detail: {
        newEvent: seededEvent.toString(),
      },
      bubbles: true,
    })
  );

  // sign a message using the delegated signer
  const signMessage = (session: CustomEvent<any>) =>
    async function innerSign(msg: string, target?: EventTarget) {
      // @ts-ignore
      return Promise.any([
        new Promise((resolveTimeout) => {
          if (!target) {
            setTimeout(() => {
              resolveTimeout({
                error: "Exec Timeout",
              });
            }, 600);
          }
        }),
        // if connected we return the delegated signed msg construct
        new Promise((resolveSigning) => {
          // session.detail
          const signMessageListenerId = keccak256(
            toUtf8Bytes(`${crypto.getRandomValues(new Uint32Array(1))[0]}`)
          );
          // post message and intercept somehow?
          const signMessageEvent = new CustomEvent(seededEvent.toString(), {
            detail: {
              msg,
              type: "sign_message",
              session: session.detail.session,
              code: 1,
              signMessageListenerId,
            },
            bubbles: true,
          });
          document.addEventListener(
            signMessageListenerId.toString(),
            function signMessageListener(signedMsg: CustomEvent) {
              // pass to outer and resolve
              resolveSigning(signedMsg.detail);
              // remove the listener once it has a response
              document.removeEventListener(
                signMessageListenerId.toString(),
                signMessageListener
              );
            }
          );
          // dispatch the new event
          (target || document).dispatchEvent(signMessageEvent);
        }),
      ]).then(
        (e: {
          error?: string;
          msg: string;
          type: string;
          session: string;
          code: number;
          signMessageListenerId: string;
        }) => {
          if (e.error === "Exec Timeout" || e.error === "Missing session") {
            return innerSign(msg);
          }
          return e;
        }
      );
    };

  // verify a delegated signed message
  const verifyMessage = (msg: string, sig: string, del = "", delSig = "") => {
    // verify with ethers:
    let verified = true;
    // - verify signers of the provided messages
    const signer = verifier(msg, sig);
    const delegator = del && delSig && verifier(del, delSig);
    // - verify that the delgation exists in the signature
    if (del && delSig && msg.indexOf(delSig) === -1) verified = false;
    // - verify that the signer exists in the delegation
    if (del && delSig && del.indexOf(signer) === -1) verified = false;

    // check for verified status
    const verifiedDelegator = verified ? delegator : false;
    const verifiedSigner = verified ? signer : false;

    // return the delegator address
    return del && delSig ? verifiedDelegator : verifiedSigner;
  };

  // construct a new session (with signMessage and verifyMessage fns)
  const createSession = (session: CustomEvent<any>) => ({
    // bind to the global message verifier
    verifyMessage,
    // message signer tied to the session
    signMessage: signMessage(session),
  });

  // start a new session...
  const newSession = async () =>
    new Promise((resolve) => {
      // new channel for responses
      const newSessionListenerId = keccak256(
        toUtf8Bytes(`${crypto.getRandomValues(new Uint32Array(1))[0]}`)
      );
      // post message and intercept somehow?
      const event = new CustomEvent(seededEvent.toString(), {
        detail: {
          type: "new_session",
          newSessionListenerId,
        },
        bubbles: true,
      });
      // attach a listener for the response
      document.addEventListener(
        newSessionListenerId,
        // register as a named fn so we can remove the listener after use
        function registerSession(session: CustomEvent) {
          // create a new session and resolve to sender
          resolve(createSession(session));
          // remove the listener once it has a response
          document.removeEventListener(
            newSessionListenerId.toString(),
            registerSession
          );
        }
      );
      // dispatch the new event
      document.dispatchEvent(event);
    });

  // signer library injection here...
  (<any>window).signer = {
    // generate a new session...
    newSession,
    // allow global verifyMessage checks
    verifyMessage,
  };
})();
