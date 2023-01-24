const API_TOKEN = Deno.env.get('API_TOKEN');
const TARGET_NAME = Deno.env.get('TARGET_NAME');
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');

if (API_TOKEN === undefined) {
  throw new Error('please set "API_TOKEN"');
}

if (TARGET_NAME === undefined) {
  throw new Error('please set "TARGET_NAME"');
}

if (DISCORD_WEBHOOK_URL === undefined) {
  throw new Error('please set "DISCORD_WEBHOOK_URL"');
}

const fetchUserIdFromScreenName = async (screen_name: string) => {
  const res = await fetch(
    `https://api.twitter.com/2/users/by/username/${screen_name}`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    }
  );
  const jsonRes = await res.json();

  return jsonRes.data.id;
};

const fetchTweetsByUserId = async (id: string, since_id?: string) => {
  const params = {
    max_results: '100',
    exclude: 'retweets,replies',
    ...(since_id ? { since_id } : {}),
  };

  const res = await fetch(
    `https://api.twitter.com/2/users/${id}/tweets?` +
      new URLSearchParams(params),
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    }
  );
  const jsonRes = await res.json();

  return jsonRes;
};

let latestTweetId: string | undefined;

const userId = await fetchUserIdFromScreenName(TARGET_NAME);

const checkTweetUpdate = async () => {
  const tweets = await fetchTweetsByUserId(userId, latestTweetId);

  if (tweets.meta.result_count == 0) {
    return;
  }

  if (latestTweetId !== undefined) {
    const tweetUrls: string[] = tweets.data.map(
      (tweet: { id: string }) =>
        `https://twitter.com/${TARGET_NAME}/status/${tweet.id}`
    );

    for (const tweetUrl of tweetUrls) {
      console.log(`POST ${tweetUrl}`);

      fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ content: tweetUrl }),
      });
    }
  }

  latestTweetId = tweets.meta.newest_id;
};

checkTweetUpdate();
setInterval(checkTweetUpdate, 1000 * 60); // 60s
