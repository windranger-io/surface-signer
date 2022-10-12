/* eslint-disable no-console, no-underscore-dangle */
import KeyringController from "eth-keyring-controller";
import {
  getAddress,
  verifyMessage,
  keccak256,
  toUtf8Bytes,
} from "ethers/lib/utils";

// construct a new controller for all keys
const keyringController = new KeyringController({});

// how many accounts have we generated?
let _accountLength = 0;
// store everything locally and perma store it in plaintext (not the best idea)
let _nonces = {};
let _sessions = {};
let _history = {};

// create a new vault
async function openVault(password: string) {
  try {
    chrome.storage.local.get(
      ["vault", "accountLength", "sessions", "nonces", "history"],
      async ({ vault, accountLength, sessions, nonces, history }) => {
        // restore original state
        _accountLength = accountLength || 0;
        // store all nonces in the local state for now
        _nonces = nonces || {};
        _sessions = sessions || {};
        // the hostory should be perma stored in local
        _history = history || {};
        // restore the vault
        if (vault) {
          keyringController.store.updateState({ vault });
          keyringController.unlockKeyrings(password);
        } else {
          const accounts = await keyringController.getAccounts();
          if (accounts.length > 0) {
            await keyringController.fullUpdate();
          } else {
            await keyringController.createNewVaultAndKeychain(password);
            await keyringController.persistAllKeyrings(password);
            chrome.storage.local.set(
              {
                vault: keyringController.store.getState().vault,
              },
              () => {
                console.log("persisted");
              }
            );
          }
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
}

// open the users vault with a generic password - not doing this safely yet...
openVault("randomPassword");

// create a new address in the keyring
async function newAddress(stopAt = false) {
  let accounts = await keyringController.getAccounts();
  const [primaryKeyring] = keyringController.getKeyringsByType("HD Key Tree");

  // fill all missing accounts following a restart
  while (
    accounts.length > 0 &&
    _accountLength > accounts.length - 1 &&
    accounts[accounts.length - 1] !== stopAt
  ) {
    // eslint-disable-next-line no-await-in-loop
    await keyringController.addNewAccount(primaryKeyring);
    // eslint-disable-next-line no-await-in-loop
    accounts = await keyringController.getAccounts();
  }

  return accounts[accounts.length - 1];
}

// send message to all connected tabs
function messageAll(message: unknown) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.url.indexOf("chrome-extension") === -1) {
        // typescript doesnt thinks sendMessage is a promise, but it is... :/
        new Promise((resolve) => {
          resolve(chrome.tabs.sendMessage(tab.id, message));
        }).catch(() => {}); // noop "Receiving end does not exist" error
      }
    });
  });
}

// listen for any messages to be processed by this bg script
chrome.runtime.onMessage.addListener(
  (
    request: {
      type: string;
      detail: {
        session?: string;
        msg?: string;
        code?: string;
        chainId?: string;
        version?: string;
        delegator?: string;
        address?: string;
        signer?: string;
        signature?: string;
        loading?: boolean;
        domain?: string;
        issuedAt?: string;
        expirationTime?: string;
      };
    },
    sender,
    sendResponse
  ) => {
    let async = false;
    // extract domain from the sender
    const domain = new URL(sender.url).host;

    // attempt the call (* note async reqs check !chrome.runtime.lastError to avoid errors bubbling to console)
    try {
      switch (request.type) {
        case "get_domains_history":
          // check if domain was passed in and filter
          sendResponse({
            history: Object.keys(_history)
              .filter(
                (session: string) =>
                  Object.values(_history[`${session}`]).filter(
                    (history: { domain: string }) => history.domain === domain
                  ).length > 0
              )
              .reduce((sessions, session) => {
                // eslint-disable-next-line no-param-reassign
                sessions[`${session}`] = _history[`${session}`].map(
                  (item: Record<string, unknown>) => {
                    const out = { ...item };
                    if (_sessions[`${session}`].revoked) {
                      out.revoked = true;
                    }
                    return out;
                  }
                );
                return sessions;
              }, {}),
          });
          break;
        case "get_domains_active_history":
          // check if domain was passed in and filter then count
          sendResponse({
            history: Object.keys(_history)
              .filter(
                (session: string) =>
                  Object.values(_history[`${session}`]).filter(
                    (history: {
                      domain: string;
                      issuedAt: string;
                      expirationTime: string;
                    }) =>
                      history.domain === domain &&
                      new Date(history.expirationTime).getTime() >
                        new Date().getTime()
                  ).length > 0
              )
              .reduce((sessions, session) => {
                // eslint-disable-next-line no-param-reassign
                sessions[`${session}`] = _history[`${session}`].map(
                  (item: Record<string, unknown>) => {
                    const out = { ...item };
                    if (_sessions[`${session}`].revoked) {
                      out.revoked = true;
                    }
                    return out;
                  }
                );
                return sessions;
              }, {}),
          });
          break;
        case "get_domains_sessions":
          // check if domain was passed in and filter
          sendResponse({
            sessions: Object.values(_sessions).filter(
              (session: { domain: string }) => session.domain === domain
            ),
          });
          break;
        case "get_domains_active_sessions":
          // check if domain was passed in and filter then count
          sendResponse({
            sessions: Object.values(_sessions).filter(
              (session: {
                domain: string;
                issuedAt: string;
                expirationTime: string;
              }) =>
                session.domain === domain &&
                new Date(session.expirationTime).getTime() >
                  new Date().getTime()
            ),
          });
          break;
        case "get_domains_session_count":
          // check if domain was passed in and filter then count
          sendResponse({
            count: Object.values(_sessions).filter(
              (session: { domain: string }) => session.domain === domain
            ).length,
          });
          break;
        case "get_session_count":
          // count all the sessions
          sendResponse({
            count: Object.keys(_sessions).length,
          });
          break;
        case "get_domains_active_session_count":
          // check if domain was passed in and filter then count
          sendResponse({
            count: Object.values(_sessions).filter(
              (session: {
                domain: string;
                issuedAt: string;
                expirationTime: string;
              }) =>
                session.domain === domain &&
                new Date(session.expirationTime).getTime() >
                  new Date().getTime()
            ).length,
          });
          break;
        case "get_active_session_count":
          // count all the sessions
          sendResponse({
            count: Object.values(_sessions).filter(
              (session: { issuedAt: string; expirationTime: string }) =>
                new Date(session.expirationTime).getTime() >=
                new Date().getTime()
            ).length,
          });
          break;
        case "get_challenge_details":
          async = true;
          (async () => {
            // generate and store the nonce
            const nonce = crypto.getRandomValues(new Uint32Array(1))[0];
            // construct a new session
            const [signer] =
              _accountLength > 0
                ? [await newAddress()]
                : await keyringController.getAccounts();
            // each signer is used once, store its nonce
            _nonces[signer] = nonce;
            // count the number of session addresses in use
            _accountLength += 1;
            // update stored state
            chrome.storage.local.set(
              {
                nonces: _nonces,
                accountLength: _accountLength,
              },
              () => {
                // return challenge string details for client to construct message
                sendResponse({
                  signer,
                  nonce,
                });
              }
            );
          })();
          break;
        case "new_session":
          async = true;
          (async () => {
            // sessionID generated if valid
            let session: string | false = false;
            // extract message details (need code, domain and expiry information here...)
            const {
              code,
              signer,
              chainId,
              version,
              delegator,
              signature,
              issuedAt,
              expirationTime,
            } = request.detail;
            // construct delegation message
            const msg =
              `${domain} wants you to delegate signing responsibility from ${getAddress(
                delegator
              )} to the following Ethereum account:\n\n` +
              `${getAddress(signer)}\n\n` +
              `URI: ${domain}\n` +
              `Version: ${version}\n` +
              `Chain ID: ${chainId}\n` +
              `Code: *\n` +
              `Nonce: ${_nonces[signer]}\n` +
              `Signer: ${getAddress(signer)}\n` +
              `Delegator: ${getAddress(delegator)}\n` +
              `Issued At: ${issuedAt}\n` +
              `Expiration Time: ${expirationTime}`;
            // verify the delegator is the signer of the message
            const verified = verifyMessage(msg, signature) === delegator;
            // when verified, store the session...
            if (verified) {
              // eslint-disable-next-line prefer-destructuring
              session = `${crypto.getRandomValues(new Uint32Array(1))[0]}`;
              // if the signature verifies, then store the signature into sessions
              _sessions[session] = {
                msg,
                code,
                session,
                signer,
                delegator,
                signature,
                domain,
                issuedAt,
                expirationTime,
              };
              // update stored state
              chrome.storage.local.set(
                {
                  sessions: _sessions,
                },
                () => {
                  if (!chrome.runtime.lastError) {
                    // return to sender if we created the session or not...
                    sendResponse({
                      session,
                      verified,
                    });
                  }
                }
              );
            }
          })();
          break;
        case "revoke_session":
          async = true;
          (async () => {
            // given req details
            const { session } = request.detail;

            // when session is valid...
            if (_sessions[`${session}`]) {
              _sessions[`${session}`].revoked = true;
            }

            // update stored state
            chrome.storage.local.set(
              {
                sessions: _sessions,
              },
              () => {
                if (!chrome.runtime.lastError) {
                  // let the sender know we revoked the session
                  sendResponse({
                    revoked: !!_sessions[`${session}`]?.revoked,
                  });
                }
              }
            );
          })();
          break;
        case "sign_message":
          async = true;
          (async () => {
            // send alt message on error
            let error: string | false = false;

            // given req details
            const { session, msg: rawMsg } = request.detail;

            // when session is valid...
            if (_sessions[`${session}`]) {
              // check that the session matches the senders domain...
              if (_sessions[`${session}`].domain === domain) {
                // not revoked
                if (!_sessions[`${session}`].revoked) {
                  // extract details from session
                  const {
                    signer,
                    delegator,
                    expirationTime,
                    msg: delegation,
                    signature: sessionSignature,
                  } = _sessions[`${session}`];

                  // construct the message to sign
                  const msg = `${rawMsg}\n\nAuthenticated: ${sessionSignature}`;

                  // get the current list of accounts
                  let accounts = await keyringController.getAccounts();

                  // ensure the account exists in the keychain
                  while (accounts.indexOf(signer) === -1) {
                    // eslint-disable-next-line no-await-in-loop
                    await newAddress(signer);
                    // eslint-disable-next-line no-await-in-loop
                    accounts = await keyringController.getAccounts();
                  }

                  // sign the message using the keyringController
                  const signature = await keyringController.signMessage({
                    from: signer,
                    data: keccak256(
                      toUtf8Bytes(
                        `\x19Ethereum Signed Message:\n${msg.length}${msg}`
                      )
                    ),
                  });

                  // check for session validity (code + expiry)
                  if (
                    new Date().getTime() < new Date(expirationTime).getTime()
                  ) {
                    // record message signing into history
                    _history[`${session}`] = _history[`${session}`] || [];
                    _history[`${session}`].push({
                      msg,
                      delegation,
                      signer,
                      delegator,
                      signatures: {
                        signer: signature,
                        delegator: sessionSignature,
                      },
                      session,
                      domain,
                      issuedAt: new Date().getTime(),
                      expirationTime: new Date(expirationTime).getTime(),
                    });
                    // update stored state
                    chrome.storage.local.set(
                      {
                        history: _history,
                      },
                      () => {
                        if (!chrome.runtime.lastError) {
                          // respond with signed message
                          sendResponse(
                            _history[`${session}`][
                              _history[`${session}`].length - 1
                            ]
                          );
                        }
                      }
                    );
                  } else {
                    error = "Session expired";
                  }
                } else {
                  error = "Session revoked";
                }
              } else {
                error = "Domain missmatch";
              }
            } else {
              // if the session is missing the injected script will reattempt to get the sessions (ie sessions shouldnt go missing)
              error = "Missing session";
            }
            // unable to sign message
            if (error) {
              sendResponse({
                error,
              });
            }
          })();
          break;
        case "set_loading_state":
          async = true;
          chrome.storage.local.set(
            {
              loading: request.detail.loading,
            },
            () => {
              if (!chrome.runtime.lastError) {
                messageAll({
                  type: "set_loading_state",
                  detail: {
                    loading: request.detail.loading,
                    sender,
                  },
                });
                sendResponse({});
              }
            }
          );
          break;
        default:
          sendResponse({});
          break;
      }
    } catch (e) {
      // errors stop sync response
      async = false;
      ((d) => d)(e);
    }

    return !!async;
  }
);
