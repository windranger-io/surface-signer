"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var react_1 = __importStar(require("react"));
var provider_1 = require("./provider");
var styles_css_1 = __importDefault(require("./styles.css"));
// Noop/ignore bad warning message
var warn = console.warn;
console.warn = function (message) {
    if (message &&
        (!message.indexOf || message.indexOf("ObjectMultiplex") === -1)) {
        return warn(message);
    }
    return false;
};
// @TODO: The domain should be able to issue a welcome message defining appropriate message codes - these should be opt-in to the user via the domains settings
// When toggled open, this should show any active/expired sessions on the domain, and allow the user to kill any old sessions
function App() {
    var _this = this;
    // States that the app moves through
    var _a = __read((0, react_1.useState)(false), 2), broken = _a[0], setBroken = _a[1];
    var _b = __read((0, react_1.useState)([]), 2), history = _b[0], setHistory = _b[1];
    // Read from metamask (connect to site prompt)
    var _c = __read((0, react_1.useState)([]), 2), accounts = _c[0], setAccounts = _c[1];
    // These are here only to test interactions with metamask
    var _d = __read((0, react_1.useState)(false), 2), isOpen = _d[0], setIsOpen = _d[1];
    // get account list from metamask
    var updateAccounts = function () {
        provider_1.web3.eth.getAccounts().then(function (_accounts) {
            setAccounts(_accounts);
        });
    };
    var getHistory = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    // save details to background
                    chrome.runtime.sendMessage({
                        type: "get_domains_history",
                    }, function (_history) {
                        setHistory(_history.history);
                        resolve(_history.history);
                    });
                })];
        });
    }); };
    var revokeSession = function (session) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    // save details to background
                    chrome.runtime.sendMessage({
                        type: "revoke_session",
                        detail: {
                            session: session,
                        },
                    }, function (revoked) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, getHistory()];
                                case 1:
                                    _a.sent();
                                    resolve(revoked.revoked);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                })];
        });
    }); };
    // check accounts every 3s
    (0, react_1.useEffect)(function () {
        // update on load
        updateAccounts();
        // then every 3s thereafter
        var interval = setInterval(function () {
            updateAccounts();
            getHistory();
        }, 3000);
        // teardown
        return function () {
            clearInterval(interval);
        };
    }, []);
    // Get the current state out of baackground.js storage
    var init = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getHistory()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    // remove app - broken state
                    setBroken(true);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Listen for messages from the background.js
    (0, react_1.useEffect)(function () {
        chrome.runtime.onMessage.addListener(function (request) {
            switch (request.type) {
                // case "set_loading_state":
                //   setLoading(request.detail.loading);
                //   break;
                default:
                    break;
            }
        });
    }, []);
    // Populate with initial state
    (0, react_1.useEffect)(function () {
        init();
    }, []);
    // Hide if broken else logged in / logged out states
    return broken || accounts.length === 0 ? (react_1.default.createElement("span", null)) : (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("style", { type: "text/css" }, styles_css_1.default),
        react_1.default.createElement("div", { className: "mm-signer-wrapper" },
            react_1.default.createElement("div", { className: "mm-signer".concat(isOpen ? " open" : "") },
                react_1.default.createElement("div", { style: {
                        width: "48px",
                        height: "48px",
                        float: "right",
                        cursor: "pointer",
                    }, onClick: function () { return setIsOpen(!isOpen); }, onKeyDown: function () { return setIsOpen(!isOpen); }, "aria-hidden": "true" },
                    react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", xmlSpace: "preserve", id: "Layer_1", x: "0", y: "0", version: "1.1", viewBox: "0 0 318.6 318.6" },
                        react_1.default.createElement("style", null, ".st1,.st6{fill:#e4761b;stroke:#e4761b;stroke-linecap:round;stroke-linejoin:round}.st6{fill:#f6851b;stroke:#f6851b}"),
                        react_1.default.createElement("path", { fill: "#e2761b", stroke: "#e2761b", strokeLinecap: "round", strokeLinejoin: "round", d: "m274.1 35.5-99.5 73.9L193 65.8z" }),
                        react_1.default.createElement("path", { d: "m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z", className: "st1" }),
                        react_1.default.createElement("path", { d: "m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z", className: "st1" }),
                        react_1.default.createElement("path", { fill: "#d7c1b3", stroke: "#d7c1b3", strokeLinecap: "round", strokeLinejoin: "round", d: "m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z" }),
                        react_1.default.createElement("path", { fill: "#233447", stroke: "#233447", strokeLinecap: "round", strokeLinejoin: "round", d: "m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z" }),
                        react_1.default.createElement("path", { fill: "#cd6116", stroke: "#cd6116", strokeLinecap: "round", strokeLinejoin: "round", d: "m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z" }),
                        react_1.default.createElement("path", { fill: "#e4751f", stroke: "#e4751f", strokeLinecap: "round", strokeLinejoin: "round", d: "m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z" }),
                        react_1.default.createElement("path", { d: "m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z", className: "st6" }),
                        react_1.default.createElement("path", { fill: "#c0ad9e", stroke: "#c0ad9e", strokeLinecap: "round", strokeLinejoin: "round", d: "m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z" }),
                        react_1.default.createElement("path", { fill: "#161616", stroke: "#161616", strokeLinecap: "round", strokeLinejoin: "round", d: "m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z" }),
                        react_1.default.createElement("path", { fill: "#763d16", stroke: "#763d16", strokeLinecap: "round", strokeLinejoin: "round", d: "m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z" }),
                        react_1.default.createElement("path", { d: "m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z", className: "st6" }))),
                isOpen ? (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("h1", { className: "tw-text-xl tw-text-slate-800 tw-my-2 tw-truncate" },
                        "Delegated Signing Responsibilities on ",
                        document.location.host),
                    react_1.default.createElement("div", { className: "tw-relative tw-rounded-xl tw-overflow-auto" },
                        react_1.default.createElement("div", { className: "tw-shadow-sm tw-my-8 tw-h-[296px] tw-overflow-auto" },
                            react_1.default.createElement("table", { className: "tw-border-collapse tw-table-auto tw-w-full tw-text-sm" },
                                react_1.default.createElement("thead", { className: "tw-sticky tw-top-0 tw-bg-[#f8f7ce]", style: { boxShadow: "1px 0 0 #000000" } },
                                    react_1.default.createElement("tr", null,
                                        react_1.default.createElement("th", { className: "tw-border-b tw-border-slate-600 tw-font-medium tw-p-4 tw-pl-8 tw-pt-0 tw-pb-3 tw-text-slate-800 tw-text-left" }, "Delegator"),
                                        react_1.default.createElement("th", { className: "tw-border-b tw-border-slate-600 tw-font-medium tw-p-4 tw-pt-0 tw-pb-3 tw-text-slate-800 tw-text-left" }, "Signer"),
                                        react_1.default.createElement("th", { className: "tw-border-b tw-border-slate-600 tw-font-medium tw-p-4 tw-pr-8 tw-pt-0 tw-pb-3 tw-text-slate-800 tw-text-left" }, "Msg Count"),
                                        react_1.default.createElement("th", { className: "tw-border-b tw-border-slate-600 tw-font-medium tw-p-4 tw-pr-8 tw-pt-0 tw-pb-3 tw-text-slate-800 tw-text-left" }, "Status"))),
                                react_1.default.createElement("tbody", null, Object.keys(history)
                                    .sort(function (a, b) {
                                    return new Date(history[b][0].issuedAt).getTime() -
                                        new Date(history[a][0].issuedAt).getTime();
                                })
                                    .map(function (session) {
                                    var _a = history[session][0], delegator = _a.delegator, signer = _a.signer, expirationTime = _a.expirationTime, revoked = _a.revoked;
                                    var total = history[session].length;
                                    return (react_1.default.createElement("tr", { key: session },
                                        react_1.default.createElement("td", { className: "tw-border-b tw-border-slate-500 tw-p-4 tw-pl-8 tw-text-slate-800" }, delegator),
                                        react_1.default.createElement("td", { className: "tw-border-b tw-border-slate-500 tw-p-4 tw-text-slate-800" }, signer),
                                        react_1.default.createElement("td", { className: "tw-border-b tw-border-slate-500 tw-p-4 tw-pr-8 tw-text-slate-800" }, total),
                                        react_1.default.createElement("td", { className: "tw-border-b tw-border-slate-500 tw-p-4 tw-pr-8 tw-text-slate-800" }, 
                                        // eslint-disable-next-line no-nested-ternary
                                        revoked
                                            ? "Revoked"
                                            : expirationTime < new Date().getTime()
                                                ? "Expired"
                                                : (function () { return (react_1.default.createElement(react_1.default.Fragment, null,
                                                    "Active",
                                                    " ",
                                                    react_1.default.createElement("button", { className: "hover:underline", type: "button", onClick: function () {
                                                            return revokeSession(session);
                                                        }, onKeyDown: function () {
                                                            return revokeSession(session);
                                                        }, "aria-hidden": "true" }, "(revoke)"))); })())));
                                }))))))) : null))));
}
exports.default = App;
//# sourceMappingURL=app.js.map