/* eslint-disable no-console */
import React from "react";
import { createRoot } from "react-dom/client";
import { getAddress } from "ethers/lib/utils";
import { web3, web3Provider } from "./provider";

import App from "./app";

// IIFE to scope context
(async () => {
  // This function handles any unhandled promise rejections
  window.onunhandledrejection = (event: Event) => {
    // nooop...
    ((ev) => ev)(event);
  };

  // onscreen notifications that are currently open
  const openNotifications = [];

  // create a random eventId to join injected script with the content-script context
  const eventId = crypto.getRandomValues(new Uint32Array(1))[0];
  // inject script.js with customEvent as queryString param
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(`script.js?customEvent=${eventId}`);
  script.id = "signer-injection";
  document.documentElement.appendChild(script);

  // add event listener to catch messages from injected script (users context)
  document.addEventListener(
    eventId.toString(),
    function registerSeed(seed: CustomEvent) {
      // on initial welcome we will get a new customEvent to use (newEvent)
      const { newEvent } = seed.detail || false;

      // when we get the welcome message...
      if (newEvent) {
        // attach to the newEvent and listen for future reqs from the injected script
        document.addEventListener(newEvent.toString(), (event: CustomEvent) => {
          try {
            switch (event.detail.type) {
              case "new_session":
                (async () => {
                  const { newSessionListenerId } = event.detail;
                  await web3Provider.request({ method: "eth_requestAccounts" });
                  const accounts = await web3.eth.getAccounts();
                  await new Promise((resolve, reject) => {
                    // get challenge data from background.js
                    chrome.runtime.sendMessage(
                      {
                        type: "get_challenge_details",
                      },
                      async (details) => {
                        if (!chrome.runtime.lastError) {
                          // issuance && expiry times
                          const issuedAt = new Date();
                          const expiry = new Date(issuedAt);
                          // add 10 mins to issuance date
                          expiry.setMinutes(issuedAt.getMinutes() + 10);
                          // construct delegation message
                          const msg =
                            `${
                              document.location.host
                            } wants you to delegate signing responsibility from ${getAddress(
                              accounts[0]
                            )} to the following Ethereum account:\n\n` +
                            `${getAddress(details.signer)}\n\n` +
                            `URI: ${document.location.host}\n` +
                            `Version: 1\n` +
                            `Chain ID: 1\n` +
                            `Code: *\n` +
                            `Nonce: ${details.nonce}\n` +
                            `Signer: ${getAddress(details.signer)}\n` +
                            `Delegator: ${getAddress(accounts[0])}\n` +
                            `Issued At: ${issuedAt.toISOString()}\n` +
                            `Expiration Time: ${expiry.toISOString()}`;

                          // sign and verify with the selected signer
                          // - we could pass back to the window now and let this sig happen in users context
                          // - this would let us operate against ANY wallet provider that can offer signing
                          // - we would just need to loopback with CustomEvents to join the two sides
                          await web3.eth.personal
                            .sign(msg, accounts[0], null)
                            .then((sig: string) => {
                              // double check the signature is valid...
                              const whoSigned = web3.eth.accounts.recover(
                                msg,
                                sig
                              );
                              // save details to background
                              chrome.runtime.sendMessage(
                                {
                                  type: "new_session",
                                  detail: {
                                    msg, // should we just reconstruct this?
                                    code: "*",
                                    chainId: 1,
                                    version: 1,
                                    delegator: whoSigned,
                                    address: whoSigned, // depr?
                                    signer: details.signer,
                                    domain: document.location.host,
                                    issuedAt: issuedAt.toISOString(),
                                    expirationTime: expiry.toISOString(),
                                    signature: sig,
                                  },
                                },
                                (res) => {
                                  if (!chrome.runtime.lastError) {
                                    resolve(res);
                                  }
                                }
                              );
                            })
                            // throw exception to caller
                            .catch((e: Error) => reject(e));
                        }
                      }
                    );
                  }).then((details) => {
                    // respond on the newSessionListenerId with the results of calling bgs new_session
                    document.dispatchEvent(
                      new CustomEvent(newSessionListenerId, {
                        detail: details,
                        bubbles: true,
                      })
                    );
                  });
                })();
                break;
              case "sign_message":
                (async () => {
                  // get the response listenerId
                  const { signMessageListenerId } = event.detail;
                  // actual process for signing a message (we can call it immediately or delay it with a dialogue)...
                  const processSignMessage = (ev: CustomEvent) => {
                    // save details to background
                    chrome.runtime.sendMessage(
                      {
                        type: "sign_message",
                        detail: {
                          msg: ev.detail.msg,
                          code: ev.detail.code,
                          session: ev.detail.session,
                        },
                      },
                      (res) => {
                        if (!chrome.runtime.lastError) {
                          // respond on signMessageListenerId to pass result of bgs sign_message
                          document.dispatchEvent(
                            new CustomEvent(signMessageListenerId, {
                              detail: res,
                              bubbles: true,
                            })
                          );
                        }
                      }
                    );
                  };
                  // if we have a specific target...
                  if (event.target !== document) {
                    // get position on screen (this could move - we should reposition on window.resize)
                    const pos = (
                      event.target as HTMLElement
                    ).getBoundingClientRect();
                    const ev = {
                      width: 200,
                      middle: Math.max(0, pos.width / 2 + pos.x - 200 / 2),
                      bottom: pos.bottom,
                      target: event.target,
                      detail: event.detail,
                      sign: () => {
                        // respond on signMessageListenerId to pass result of bgs sign_message
                        processSignMessage(event);
                        openNotifications.splice(
                          openNotifications.indexOf(ev),
                          1
                        );
                      },
                      reject: () => {
                        // respond on signMessageListenerId to notify window context of rejection
                        document.dispatchEvent(
                          new CustomEvent(signMessageListenerId, {
                            detail: {
                              error: "Rejected by user",
                            },
                            bubbles: true,
                          })
                        );
                        openNotifications.splice(
                          openNotifications.indexOf(ev),
                          1
                        );
                      },
                    };
                    openNotifications.push(ev);
                    const panel = document.createElement("div");
                    const txt = document.createElement("div");
                    const btns = document.createElement("div");
                    const approve = document.createElement("button");
                    const reject = document.createElement("button");
                    const styles = document.createElement("style");
                    // set styles
                    styles.innerHTML = `
                      .panel-btn {
                        cursor: pointer;
                        margin-top: 0.5rem;
                        margin-bottom: 0.5rem;
                        margin-left: 0.25rem;
                        margin-right: 0.25rem;
                        justify-content: space-around;
                        border-radius: 0.25rem;
                        border-width: 1px;
                        --tw-border-opacity: 1;
                        border-color: rgb(156 163 175 / var(--tw-border-opacity));
                        --tw-bg-opacity: 1;
                        background-color: rgb(255 255 255 / var(--tw-bg-opacity));
                        padding-top: 0.5rem;
                        padding-bottom: 0.5rem;
                        padding-left: 1rem;
                        padding-right: 1rem;
                        font-family: Helvetica, sans-serif;
                        font-size: 0.75rem;
                        line-height: 1rem;
                        --tw-text-opacity: 1;
                        color: rgb(31 41 55 / var(--tw-text-opacity));
                        --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                        --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
                        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
                      }
                      .panel-btn:hover {
                        --tw-bg-opacity: 1;
                        background-color: rgb(243 244 246 / var(--tw-bg-opacity));
                      }
                    }
                    `;
                    // style shiz - doing this really shit because this needs to be rewritten to use tailwinds
                    panel.setAttribute(
                      "style",
                      `border: 1px solid rgb(210 210 210); background: white; width: ${ev.width}px; height: auto; position: absolute; top: ${ev.bottom}px; left: ${ev.middle}px;`
                    );
                    txt.setAttribute(
                      "style",
                      `margin: 4px; padding: 4px; border: 1px solid rgb(210 210 210);`
                    );
                    btns.setAttribute(
                      "style",
                      `display: flex; flex-direction: row; justify-content: space-around;`
                    );
                    // wrap buttons in a flex container
                    approve.setAttribute("class", `panel-btn`);
                    reject.setAttribute("class", `panel-btn`);
                    // msg text
                    txt.innerText = event.detail.msg;
                    // btn text
                    approve.innerText = "Approve";
                    reject.innerText = "Reject";
                    // btn listeners
                    approve.addEventListener("click", () => {
                      ev.sign();
                      document.body.removeChild(panel);
                    });
                    reject.addEventListener("click", () => {
                      ev.reject();
                      document.body.removeChild(panel);
                    });
                    // contain in a closed shadow (this will prevent the users context from accessing the notifications dom)
                    const shadow = panel.attachShadow({ mode: "closed" });
                    // insert everything in to the shadow container
                    btns.appendChild(reject);
                    btns.appendChild(approve);
                    shadow.appendChild(styles);
                    shadow.appendChild(txt);
                    shadow.appendChild(btns);
                    // put everything in the dom
                    document.body.appendChild(panel);
                  } else {
                    // sign the message immediately...
                    processSignMessage(event);
                  }
                })();
                break;
              default:
                console.log("not implemented");
                break;
            }
          } catch (e) {
            // noooop...
            ((d) => d)(e);
          }
        });

        // Insert container as a sibling to the body (this puts it outside of any styled containers (hopefully))
        const signer = document.createElement("signer-io");
        document.body.parentElement.appendChild(signer);

        // Attach a shadow dom to the signer container (by setting closed we can block window from accessing the shadow)
        const shadow = signer.attachShadow({ mode: "closed" });

        // Attach styles to shadow dom (to reset em sizing)
        const style = document.createElement("style");
        style.innerHTML = `
          html,
          body {
            font-size: 16px;
            height: 100%;
          }

          body,
          :host {
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
          }

          #mm-signer-app {
            top: 0;
            left: 0;
            font-size: 16px;
            position: absolute;
            z-index: 2147483647;
          }
        `;
        shadow.appendChild(style);

        // insert the shadow
        const app = document.createElement("div");
        app.setAttribute("id", "mm-signer-app");
        shadow.appendChild(app);

        // attach react app (management panel)
        const root = createRoot(app!);
        root.render(<App />);

        // drop the seed listener (only accepts one message)
        document.removeEventListener(eventId.toString(), registerSeed);
      }
    }
  );
})();
