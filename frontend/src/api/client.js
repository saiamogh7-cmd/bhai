const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Sends a URL to the QR Code verification backend.
 */
export async function checkQR(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second timeout (accommodates backend cold starts)

    const response = await fetch(`${BASE_URL}/api/qr/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error('RATE_LIMIT: API rate limit exceeded. Please wait before retrying.');
    }
    if (!response.ok) {
      throw new Error(`SERVER_ERROR: Server returned status code ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT: Network request timed out (limit 12s).');
    }
    throw error;
  }
}

/**
 * Sends pasted email text to the Email check verification backend.
 */
export async function checkEmail(content) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second timeout (accommodates backend cold starts)

    const response = await fetch(`${BASE_URL}/api/email/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error('RATE_LIMIT: API rate limit exceeded. Please wait before retrying.');
    }
    if (!response.ok) {
      throw new Error(`SERVER_ERROR: Server returned status code ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT: Network request timed out (limit 12s).');
    }
    throw error;
  }
}
