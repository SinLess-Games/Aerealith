import { Hono } from 'hono';

type Bindings = {
  AEREALITH_AI: R2Bucket;
};

export const videosRouter = new Hono<{
  Bindings: Bindings;
}>();

const VIDEO_PREFIX = 'CDN/videos';

interface ByteRange {
  readonly start: number;
  readonly end: number;
}

function getVideoKey(videoId: string): string {
  return `${VIDEO_PREFIX}/${videoId}`;
}

function parseRange(rangeHeader: string, objectSize: number): ByteRange | null {
  if (objectSize <= 0) {
    return null;
  }

  // Multiple byte ranges are intentionally not supported by this endpoint.
  if (rangeHeader.includes(',')) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());

  if (!match) {
    return null;
  }

  const startValue = match[1];
  const endValue = match[2];

  if (!startValue && !endValue) {
    return null;
  }

  // Suffix range:
  //
  // Range: bytes=-500
  //
  // means "give me the final 500 bytes".
  if (!startValue) {
    const suffixLength = Number.parseInt(endValue, 10);

    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return null;
    }

    const length = Math.min(suffixLength, objectSize);

    return {
      start: objectSize - length,
      end: objectSize - 1,
    };
  }

  const start = Number.parseInt(startValue, 10);

  if (!Number.isSafeInteger(start) || start < 0 || start >= objectSize) {
    return null;
  }

  // Open-ended range:
  //
  // Range: bytes=500-
  if (!endValue) {
    return {
      start,
      end: objectSize - 1,
    };
  }

  const requestedEnd = Number.parseInt(endValue, 10);

  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) {
    return null;
  }

  return {
    start,
    end: Math.min(requestedEnd, objectSize - 1),
  };
}

function createBaseHeaders(object: R2Object): Headers {
  const headers = new Headers();

  object.writeHttpMetadata(headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'video/mp4');
  }

  headers.set('Accept-Ranges', 'bytes');
  headers.set('ETag', object.httpEtag);
  headers.set('Last-Modified', object.uploaded.toUTCString());

  /*
   * Do not force an immutable cache policy here unless videoId values
   * are guaranteed to be content-versioned.
   *
   * If the R2 object already has cacheControl HTTP metadata,
   * writeHttpMetadata() will preserve it.
   */

  return headers;
}

/**
 * GET /api/V1/cdn/videos/:videoId
 *
 * Streams videos from:
 *
 *   R2 bucket: aerealith-ai
 *   R2 prefix: CDN/videos/
 *
 * Example:
 *
 *   GET /api/V1/cdn/videos/call-to-investors.mp4
 *
 * resolves to:
 *
 *   CDN/videos/call-to-investors.mp4
 */
videosRouter.get('/:videoId', async (c) => {
  const videoId = c.req.param('videoId').trim();

  if (!videoId) {
    return c.json(
      {
        error: 'Video ID is required',
      },
      400,
    );
  }

  const bucket = c.env.AEREALITH_AI;
  const key = getVideoKey(videoId);

  try {
    const rangeHeader = c.req.header('range');

    /*
     * Range requests are important for HTML5 video playback.
     *
     * They allow browsers to:
     *
     * - seek
     * - scrub
     * - resume playback
     * - request only the bytes they currently need
     */
    if (rangeHeader) {
      const metadata = await bucket.head(key);

      if (!metadata) {
        return c.json(
          {
            error: 'Video not found',
          },
          404,
        );
      }

      const range = parseRange(rangeHeader, metadata.size);

      if (!range) {
        return new Response(null, {
          status: 416,
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes */${metadata.size}`,
          },
        });
      }

      const length = range.end - range.start + 1;

      const object = await bucket.get(key, {
        range: {
          offset: range.start,
          length,
        },
      });

      if (!object || !('body' in object)) {
        return c.json(
          {
            error: 'Video not found',
          },
          404,
        );
      }

      const headers = createBaseHeaders(object);

      headers.set(
        'Content-Range',
        `bytes ${range.start}-${range.end}/${metadata.size}`,
      );

      headers.set('Content-Length', length.toString());

      return new Response(object.body, {
        status: 206,
        headers,
      });
    }

    /*
     * Normal full-file request.
     *
     * Stream the R2 body directly instead of buffering the entire
     * MP4 inside the Worker.
     */
    const object = await bucket.get(key);

    if (!object || !('body' in object)) {
      return c.json(
        {
          error: 'Video not found',
        },
        404,
      );
    }

    const headers = createBaseHeaders(object);

    headers.set('Content-Length', object.size.toString());

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching CDN video', {
      videoId,
      key,
      error,
    });

    return c.json(
      {
        error: 'Internal server error',
      },
      500,
    );
  }
});

/**
 * HEAD /api/V1/cdn/videos/:videoId
 *
 * Allows browsers, CDN tooling, and clients to inspect the video's
 * metadata without downloading the video.
 */
videosRouter.on('HEAD', '/:videoId', async (c) => {
  const videoId = c.req.param('videoId').trim();

  if (!videoId) {
    return new Response(null, {
      status: 400,
    });
  }

  const key = getVideoKey(videoId);

  try {
    const object = await c.env.AEREALITH_AI.head(key);

    if (!object) {
      return new Response(null, {
        status: 404,
      });
    }

    const headers = createBaseHeaders(object);

    headers.set('Content-Length', object.size.toString());

    return new Response(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching CDN video metadata', {
      videoId,
      key,
      error,
    });

    return new Response(null, {
      status: 500,
    });
  }
});
