import type { Page } from "playwright";

const PIXEL_CHANNEL_THRESHOLD = 16;

type ScreenshotComparison = {
  changedRatio: number;
  matchingDimensions: boolean;
};

const comparisonInBrowser = (
  page: Page,
  baseline: Buffer,
  actual: Buffer
): Promise<ScreenshotComparison> =>
  page.evaluate(
    async ({ actualBase64, baselineBase64, threshold }) => {
      const baselineBytes = Uint8Array.from(
        atob(baselineBase64),
        (character) => character.codePointAt(0) ?? 0
      );
      const actualBytes = Uint8Array.from(
        atob(actualBase64),
        (character) => character.codePointAt(0) ?? 0
      );
      const [baselineImage, actualImage] = await Promise.all([
        createImageBitmap(new Blob([baselineBytes], { type: "image/png" })),
        createImageBitmap(new Blob([actualBytes], { type: "image/png" })),
      ]);
      if (
        baselineImage.width !== actualImage.width ||
        baselineImage.height !== actualImage.height
      ) {
        return { changedRatio: 1, matchingDimensions: false };
      }

      const canvas = document.createElement("canvas");
      canvas.width = baselineImage.width;
      canvas.height = baselineImage.height;
      const context = canvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!context) {
        throw new Error("Could not create an image comparison canvas.");
      }

      context.drawImage(baselineImage, 0, 0);
      const baselinePixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(actualImage, 0, 0);
      const actualPixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;

      let changedPixels = 0;
      for (let index = 0; index < baselinePixels.length; index += 4) {
        const redDifference = Math.abs(
          baselinePixels[index] - actualPixels[index]
        );
        const greenDifference = Math.abs(
          baselinePixels[index + 1] - actualPixels[index + 1]
        );
        const blueDifference = Math.abs(
          baselinePixels[index + 2] - actualPixels[index + 2]
        );
        if (
          Math.max(redDifference, greenDifference, blueDifference) > threshold
        ) {
          changedPixels += 1;
        }
      }

      return {
        changedRatio:
          changedPixels / (baselineImage.width * baselineImage.height),
        matchingDimensions: true,
      };
    },
    {
      actualBase64: actual.toString("base64"),
      baselineBase64: baseline.toString("base64"),
      threshold: PIXEL_CHANNEL_THRESHOLD,
    }
  );

export { comparisonInBrowser, type ScreenshotComparison };
