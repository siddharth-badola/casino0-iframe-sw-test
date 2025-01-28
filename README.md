# Casino Game Iframe Integration

## Overview

This project enables the embedding of a casino game iframe using a payload parameter `p` in the URL. The payload is
base64 encoded, and we decode it using the browser's `atob` function to extract key parameters necessary for API calls.
After decoding, the extracted values are used to call a `start` API, which returns the required `gameUri` to be embedded
in an iframe.

## Workflow

### Step 1: URL Parameter

The website works with a URL that includes a query parameter `p`, which is base64 encoded.

Example URL:

```
https://casino-game.com/?p=Y29kZT1FVk9fTElWRV9TVVBFUl9TSUNCTyZhZ2dyPXZpc2lvbmxpbmsmdUlkPTExNTE3JnNJZD02ZWNhZTk5YWU0NDljZmMwZDEzMDQ1NzVhZGRjZDIxNg==
```

### Step 2: Decode the Payload

The value of the `p` parameter is decoded using the `atob` function in the browser. This gives a string containing
URL-like parameters that can be extracted using `URLSearchParams`.

```js
// Decode the payload
const payload = atob(
  "Y29kZT1FVk9fTElWRV9TVVBFUl9TSUNCTyZhZ2dyPXZpc2lvbmxpbmsmdUlkPTExNTE3JnNJZD02ZWNhZTk5YWU0NDljZmMwZDEzMDQ1NzVhZGRjZDIxNg==",
);
console.log(payload);
// Output: "code=EVO_LIVE_SUPER_SICBO&aggr=visionlink&uId=11517&sId=6ecae99ae449cfc0d1304575addcd216"
```

### Step 3: Extract URL Parameters

After decoding, we use `URLSearchParams` to extract the individual parameters from the payload.

```js
const params = new URLSearchParams(payload);

// Extract individual values
console.log(params.get("code")); // EVO_LIVE_SUPER_SICBO
console.log(params.get("aggr")); // visionlink
console.log(params.get("uId")); // 11517
console.log(params.get("sId")); // 6ecae99ae449cfc0d1304575addcd216
```

### Step 4: Call the `start` API

Using the decoded parameters, the `start` API is called to get the game URL to be embedded in the iframe.

#### Example API Call

```js
fetch('https://casino-backend.com/api/games/${params.get("code")}/start', {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-AppBundleID": atob(this.APP_BUNDLE_ID),
    "X-UserId": params.get("uId"),
    "X-SessionId": params.get("sId"),
  },
  body: JSON.stringify({
    openEmbedded: params.get("aggr") !== "bragg",
    gameProvider: params.get("aggr"),
  }),
})
  .then((response) => response.json())
  .then((data) => {
    const gameUri = data.gameUri;
    document.getElementById("game-iframe").src = gameUri;
  })
  .catch((error) => console.error("Error:", error));
```

### Step 5: Embed the Game in an Iframe

Once the `gameUri` is received from the `start` API, set it as the `src` of the iframe.

```html
<iframe id="game-iframe" width="100%" height="100vh"></iframe>
```

## Summary

1. Decode the `p` parameter from the URL using `atob`.
2. Extract parameters using `URLSearchParams`.
3. Make an API call to get the `gameUri`.
4. Set the iframe source to the returned `gameUri`.

This process will embed the casino game inside an iframe for seamless gameplay.

## Local Development

1. Install packages.

```bash
yarn install
```

2. Add **`.env.local`** file

```
API_URL=
APP_BUNDLE_ID=
APP_ENV=
```

3. Start dev server

```bash
yarn start
```
