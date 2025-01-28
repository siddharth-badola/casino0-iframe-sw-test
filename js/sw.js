import { SERVICE_MESSAGE_EVENTS } from "./lib/constant";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  const { data } = event;
  if (data && data.name === SERVICE_MESSAGE_EVENTS.HABA_BUYOUT) {
    console.log(data);
    const { url, body, headers } = data;
    fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
      keepalive: true,
    })
      .then((response) => {
        if (
          response.statusText === "ok" &&
          response.status >= 200 &&
          response.status < 400
        ) {
          return response.json();
        }
        throw response;
      })
      .then((data) => console.log("haba logout success", data))
      .catch((error) => {
        console.log("habe logout failed", error);
      });
  }
});
