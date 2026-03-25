"use strict";

/**
 * ServerFetchTransport — a bare-mux transport that routes all proxy requests
 * through the server's /api/proxy-fetch endpoint using plain HTTP fetch.
 * This works in both dev and production without requiring any WebSocket/Wisp setup.
 */
class ServerFetchTransport {
	ready = true;

	async request(remote, method, body, headers, signal) {
		// Normalize headers to a plain object
		let headersObj = {};
		if (headers) {
			if (typeof headers[Symbol.iterator] === "function") {
				for (const [k, v] of headers) headersObj[k] = v;
			} else {
				Object.assign(headersObj, headers);
			}
		}

		// Collect request body bytes when applicable
		let bodyData;
		const m = (method || "GET").toUpperCase();
		if (body && !["GET", "HEAD"].includes(m)) {
			if (body instanceof ReadableStream) {
				const chunks = [];
				const reader = body.getReader();
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
				}
				const total = chunks.reduce((n, c) => n + c.length, 0);
				bodyData = new Uint8Array(total);
				let off = 0;
				for (const c of chunks) { bodyData.set(c, off); off += c.length; }
			} else if (body instanceof ArrayBuffer) {
				bodyData = new Uint8Array(body);
			} else {
				bodyData = body;
			}
		}

		const resp = await fetch("/api/proxy-fetch", {
			method: "POST",
			headers: {
				"X-Proxy-URL": remote.toString(),
				"X-Proxy-Method": m,
				"X-Proxy-Headers": JSON.stringify(headersObj),
			},
			body: bodyData,
			signal,
		});

		const status = parseInt(resp.headers.get("X-Proxy-Status") || "200");
		const statusText = resp.headers.get("X-Proxy-StatusText") || "";
		let proxyHeaders = {};
		try { proxyHeaders = JSON.parse(resp.headers.get("X-Proxy-Headers") || "{}"); } catch {}

		return { status, statusText, headers: proxyHeaders, body: resp.body };
	}

	connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
		// WebSocket tunneling not implemented in server-fetch mode
		onerror("WebSocket tunneling not supported");
		return [() => {}, () => {}];
	}
}

export { ServerFetchTransport, ServerFetchTransport as default };
