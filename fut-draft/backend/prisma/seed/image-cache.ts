import { createHash } from "crypto";
import { access, mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

import {
  IMAGE_EXTENSIONS,
  IMAGE_FETCH_TIMEOUT_MS,
  IMAGE_REQUEST_DELAY_MS,
  PLAYER_IMAGE_CACHE_DIR,
  PLAYER_IMAGE_PUBLIC_PATH,
} from "./config";
import type { SeedPlayer } from "./types";
import { normalizeName, sleep } from "./utils";

export function resolveLocalImagePath(imageUrl: string): string | null {
  if (!imageUrl.startsWith(`${PLAYER_IMAGE_PUBLIC_PATH}/`)) {
    return null;
  }

  const filename = imageUrl.slice(PLAYER_IMAGE_PUBLIC_PATH.length + 1);

  if (
    !filename ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..")
  ) {
    return null;
  }

  return join(PLAYER_IMAGE_CACHE_DIR, filename);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);

    return true;
  } catch {
    return false;
  }
}

export async function cachePlayerImage(
  player: SeedPlayer,
): Promise<Pick<SeedPlayer, "imageSource" | "imageUrl">> {
  const imageUrl = player.imageUrl?.trim();

  if (!imageUrl) {
    return { imageSource: null, imageUrl: null };
  }

  if (imageUrl.startsWith(PLAYER_IMAGE_PUBLIC_PATH)) {
    const localImagePath = resolveLocalImagePath(imageUrl);

    if (localImagePath && (await fileExists(localImagePath))) {
      return { imageSource: player.imageSource ?? "local", imageUrl };
    }

    return { imageSource: null, imageUrl: null };
  }

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return { imageSource: player.imageSource ?? "local", imageUrl };
  }

  const filename = buildLocalImageFilename(player, imageUrl);
  const filePath = join(PLAYER_IMAGE_CACHE_DIR, filename);
  const publicImageUrl = `${PLAYER_IMAGE_PUBLIC_PATH}/${filename}`;

  if (await fileExists(filePath)) {
    return { imageSource: "local-thesportsdb", imageUrl: publicImageUrl };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (FUT Draft seed image cache)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`Player image failed: ${response.status} ${imageUrl}`);

      return { imageSource: null, imageUrl: null };
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType && !contentType.startsWith("image/")) {
      console.warn(
        `Player image skipped: unexpected content type ${contentType} ${imageUrl}`,
      );

      return { imageSource: null, imageUrl: null };
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      return { imageSource: null, imageUrl: null };
    }

    await mkdir(PLAYER_IMAGE_CACHE_DIR, { recursive: true });
    await writeFile(filePath, buffer);

    return { imageSource: "local-thesportsdb", imageUrl: publicImageUrl };
  } catch (error) {
    console.warn(`Player image failed: ${imageUrl}`, error);

    return { imageSource: null, imageUrl: null };
  } finally {
    clearTimeout(timeout);
    await sleep(IMAGE_REQUEST_DELAY_MS);
  }
}

function getImageExtension(imageUrl: string): string {
  try {
    const extension = extname(new URL(imageUrl).pathname).toLowerCase();

    return IMAGE_EXTENSIONS.has(extension) ? extension : ".png";
  } catch {
    return ".png";
  }
}

function buildLocalImageFilename(player: SeedPlayer, imageUrl: string): string {
  const safePlayerName =
    normalizeName(player.fullName).slice(0, 42) || "player";
  const imageHash = createHash("sha1")
    .update(imageUrl)
    .digest("hex")
    .slice(0, 12);

  return `${safePlayerName}-${imageHash}${getImageExtension(imageUrl)}`;
}
