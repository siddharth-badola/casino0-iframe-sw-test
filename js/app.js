import { APP_CONFIG } from "./lib/appConfig";
import {
  PLAY_N_GO_EVENTS,
  CommonAppType,
  CASINO_EVENTS,
  AGGREGATOR,
  SERVICE_MESSAGE_EVENTS,
} from "./lib/constant";
import { isValidJsonString, modifyGameUrl } from "./lib/util";

class App {
  #sidePanel = null;
  #openBtn = null;
  #closeBtn = null;
  #loadingEl = null;
  #gameIframe = null;
  #gameInfo = {};

  init() {
    const search = this.#queryParams(window.location.search);
    this.#registerEvents();

    if (!search.p) return;

    const params = this.#queryParams(atob(search.p));
    this.#gameInfo = { code: params?.code, aggregator: params?.aggr };
    this.#getGameUrl(params);
  }

  #queryParams(queryString) {
    const searchParams = new URLSearchParams(queryString);
    return new Proxy(searchParams, {
      get: (params, prop) => params.get(prop),
    });
  }

  #getParsedParams() {
    const search = this.#queryParams(window.location.search);
    if (!search.p) return;

    return this.#queryParams(atob(search.p));
  }

  #getGameUrl(params) {
    const url = `${APP_CONFIG.API_URL}/api/v1/casino/games/${params.code}/start`;
    fetch(url, this.#getRequestInit(params))
      .then((response) => response.json())
      .then(({ gameUri }) => {
        const url = modifyGameUrl(gameUri, {
          isIos: true,
          aggregator: params.aggr,
          locale: params.locale,
        });
        this.#showIframe(url);
        setTimeout(() => this.#toggleLoading(false), 1000);
      })
      .catch((err) => {
        this.#log(err);
        this.#showErrorUi();
      });
  }

  #getRequestInit(params) {
    const body = JSON.stringify({
      openEmbedded: params.aggr !== "bragg",
      gameProvider: params.aggr,
    });
    return { method: "POST", headers: this.#getHeaders(params), body };
  }

  #getHeaders(params) {
    return {
      "Content-Type": "application/json",
      "X-AppBundleID": APP_CONFIG.APP_BUNDLE_ID,
      "X-UserId": params?.uId,
      "X-SessionId": params?.sId,
    };
  }

  #toggleLoading(shown) {
    if (this.#loadingEl?.style) {
      this.#loadingEl.style.display = shown ? "flex" : "none";
    }
  }

  #showIframe(gameUrl) {
    this.#gameIframe.src = gameUrl;
    this.#gameIframe.style.display = "block";
  }

  #openDrawer() {
    let startX,
      endX = 0;

    this.#openBtn.addEventListener("touchstart", (event) => {
      startX = event.touches[0].clientX;
      this.#sidePanel.classList.remove("transition");
    });

    this.#openBtn.addEventListener("touchmove", (event) => {
      endX = event.touches[0].clientX;

      if (endX - startX > 10) event.preventDefault();

      if (!this.#sidePanel) return;

      const { width } = this.#sidePanel.getBoundingClientRect();
      this.#moveSidePanel({ width, clientX: endX });
    });

    this.#openBtn.addEventListener("touchend", () => {
      const width = this.#sidePanel.getBoundingClientRect().width;
      const showSidePanel = startX && endX && endX - startX >= width / 3;
      const removeClassName = showSidePanel ? "closed" : "open";
      const addClassName = showSidePanel ? "open" : "closed";

      this.#sidePanel.classList.remove(removeClassName);
      this.#sidePanel.classList.add(addClassName, "transition");

      setTimeout(() => {
        this.#sidePanel.style.transform = null;
      }, 100);
    });

    this.#openBtn.addEventListener("click", () => {
      this.#sidePanel.classList.remove("closed");
      this.#sidePanel.classList.add("open");
    });

    this.#openBtn.addEventListener("touchend", () => {
      this.#sidePanel.classList.remove("closed");
      this.#sidePanel.classList.add("open");
    });
  }

  #closeDrawer() {
    this.#closeBtn.addEventListener("click", () => {
      this.#sidePanel.classList.remove("open");
      this.#sidePanel.classList.add("closed");
    });

    this.#closeBtn.addEventListener("touchend", () => {
      this.#sidePanel.classList.remove("open");
      this.#sidePanel.classList.add("closed");
    });
  }

  #closeWindow() {
    const exitBtn = document.getElementById("exit");

    exitBtn.addEventListener("click", this.#closePage.bind(this));
    exitBtn.addEventListener("touchend", this.#closePage.bind(this));
  }

  #log(...args) {
    console.log("||DEBUG||>", ...args);
  }

  #showErrorUi() {
    this.#toggleLoading(false);

    const errorImg = document.createElement("img");
    errorImg.src = "/img/error.png";
    errorImg.alt = "unable to launch game";
    errorImg.style = "width:80%; height:80%; object-fit:contain;";

    const errorEl = document.createElement("div");
    errorEl.classList.add(
      "flex",
      "items-center",
      "justify-center",
      "w-quarter",
      "h-quarter",
    );

    document.body.appendChild(errorEl).appendChild(errorImg);
  }

  #messageEventHandler(event) {
    const key = event.message ? "message" : "data";
    const message = isValidJsonString(event[key])
      ? JSON.parse(event[key])
      : event[key];

    switch (message.event) {
      case PLAY_N_GO_EVENTS.GAME_CLOSED:
        this.#closePage();
        break;
    }

    switch (message.name) {
      case CASINO_EVENTS.REQUEST_GAME_EXIT:
        this.#closePage();
        break;
    }
  }

  #iframeLoad() {
    this.#gameIframe.addEventListener("load", () => {
      this.#sendSyncRecentGameMessage();
    });
  }

  #registerEvents() {
    this.#sidePanel = document.getElementById("side-panel");
    this.#openBtn = document.getElementById("open-drawer");
    this.#closeBtn = document.getElementById("close-drawer");
    this.#loadingEl = document.getElementById("loading");
    this.#gameIframe = document.getElementById("game-frame");

    console.log("||DEBUG||> app::registerEvents");

    this.#openDrawer();
    this.#closeDrawer();
    this.#closeWindow();
    this.#iframeLoad();

    window.addEventListener("message", this.#messageEventHandler.bind(this));
    window.addEventListener("pagehide", this.#handlePagehide.bind(this));

    if ("serviceWorker" in navigator) {
      this.#log("registering service worker");
      navigator.serviceWorker
        .register("./sw.js")
        .then(() => {
          this.#log("service worker registered successfully");
        })
        .catch((e) => {
          console.log(e);
          this.#log("service worker registration failed");
        });
    } else {
      this.#log("service worker not supported");
    }
  }

  #moveSidePanel({ width, clientX }) {
    if (!this.#sidePanel) return;

    const transformFn = "translateX";
    const nextPosition = -width + clientX;

    if (nextPosition <= 0 && clientX >= 0)
      this.#sidePanel.style.transform = `${transformFn}(${nextPosition}px)`;
    else if (clientX <= 0)
      this.#sidePanel.style.transform = `${transformFn}(-100%)`;
    else this.#sidePanel.style.transform = `${transformFn}(0px)`;
  }

  #sendExitMessage() {
    this.#sendMessage(CASINO_EVENTS.CASINO_GAME_EXIT, {
      code: this.#gameInfo.code,
      aggregator: this.#gameInfo.aggregator,
    });
  }

  #sendSyncRecentGameMessage() {
    this.#sendMessage(CASINO_EVENTS.SYNC_RECENT_GAMES);
  }

  #closePage() {
    window.close();
    if (this.#gameInfo.aggregator === AGGREGATOR.HABA) {
      this.#habaLogout();
    }
  }

  #handlePagehide() {
    if (this.#gameInfo.aggregator === AGGREGATOR.HABA) {
      const params = this.#getParsedParams();
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          name: SERVICE_MESSAGE_EVENTS.HABA_BUYOUT,
          headers: this.#getHeaders(params),
          body: { gameId: this.#gameInfo.code },
          url: `${APP_CONFIG.API_URL}/api/haba/logout`,
        });
      }
    }

    this.#sendExitMessage();
  }

  /**
   * @param {string} name
   * @param {*} [data]
   */
  #sendMessage(name, data) {
    if (window.opener && typeof window.opener.postMessage === "function") {
      window.opener.postMessage(
        {
          sourceApp: CommonAppType.CASINO_IFRAME,
          name,
          ...(data ? { data } : {}),
        },
        { targetOrigin: APP_CONFIG.APP_TARGET },
      );
    }
  }

  #habaLogout() {
    const params = this.#getParsedParams();

    fetch(`${APP_CONFIG.API_URL}/api/haba/logout`, {
      method: "POST",
      body: JSON.stringify({ gameId: this.#gameInfo.code }),
      headers: this.#getHeaders(params),
      keepalive: true,
    });
  }
}

const app = new App();

console.log("||DEBUG||> document.readyState", document.readyState);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", app.init.bind(app));
} else {
  app.init();
}
