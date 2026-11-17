import { mockGmXmlHttpRequest } from "../runtime/subject-runtime-test-utils";
import { responseIsRestricted } from "./live-rating-audit-classification";
import type { NetworkObservation } from "./live-rating-audit-types";

const installFetchBackedGmTransport = (
  observations: NetworkObservation[]
): void => {
  observations.length = 0;
  mockGmXmlHttpRequest.mockImplementation(((request: {
    data?: string;
    headers?: Record<string, string>;
    method?: string;
    onabort?: () => void;
    onerror?: () => void;
    onload: (response: {
      finalUrl: string;
      responseText: string;
      status: number;
    }) => void;
    ontimeout?: () => void;
    timeout?: number;
    url: string;
  }) => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, request.timeout ?? 15_000);
    void (async () => {
      try {
        const response = await fetch(request.url, {
          body: request.data,
          credentials: "omit",
          headers: request.headers,
          method: request.method ?? "GET",
          redirect: "follow",
          signal: controller.signal,
        });
        const responseText = await response.text();
        clearTimeout(timer);
        observations.push({
          finalUrl: response.url || request.url,
          restricted: responseIsRestricted({
            finalUrl: response.url || request.url,
            requestUrl: request.url,
            responseText,
            status: response.status,
          }),
          requestUrl: request.url,
          status: response.status,
        });
        request.onload({
          finalUrl: response.url || request.url,
          responseText,
          status: response.status,
        });
      } catch {
        clearTimeout(timer);
        if (timedOut) {
          request.ontimeout?.();
        } else if (controller.signal.aborted) {
          request.onabort?.();
        } else {
          request.onerror?.();
        }
      }
    })();
    return {
      abort: () => {
        controller.abort();
        request.onabort?.();
      },
    };
  }) as never);
};

export { installFetchBackedGmTransport };
