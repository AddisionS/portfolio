// Vercel serverless function. Deployed automatically since it lives in /api.
// This calls leetcode.com/graphql SERVER-SIDE, where CORS doesn't apply
// (CORS is a browser-only restriction), then serves the result from our
// own domain so the frontend can fetch it same-origin with zero CORS issues.
// This is the same trick every community "LeetCode stats API" uses under
// the hood -- we're just running our own instead of depending on someone
// else's uptime.

const QUERY = `
  query userStats($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      submissionCalendar
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
    }
  }
`;

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ status: "error", message: "username is required" });
  }

  try {
    const lcRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
    });

    if (!lcRes.ok) {
      return res.status(502).json({ status: "error", message: "LeetCode request failed" });
    }

    const json = await lcRes.json();
    const user = json?.data?.matchedUser;

    if (!user) {
      return res.status(404).json({ status: "error", message: "user not found" });
    }

    const totalsByDiff = Object.fromEntries(
      json.data.allQuestionsCount.map((d) => [d.difficulty, d.count])
    );
    const solvedByDiff = Object.fromEntries(
      user.submitStats.acSubmissionNum.map((d) => [d.difficulty, d.count])
    );

    // submissionCalendar comes back as a JSON-encoded string mapping
    // unix-timestamp (day, in seconds) -> submission count that day.
    // Normalize to {date: "YYYY-MM-DD", count} for easier frontend use.
    const rawCalendar = user.submissionCalendar
      ? JSON.parse(user.submissionCalendar)
      : {};
    const calendar = Object.entries(rawCalendar).map(([ts, count]) => ({
      date: new Date(Number(ts) * 1000).toISOString().slice(0, 10),
      count,
    }));

    // Contest ranking is null if the user has never entered a contest --
    // handle that gracefully rather than crashing.
    const contest = json.data.userContestRanking;

    // Cache at the edge for an hour -- LeetCode stats don't need to be
    // fetched fresh on every single page load.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return res.status(200).json({
      status: "success",
      totalSolved: solvedByDiff.All || 0,
      totalQuestions: totalsByDiff.All || 0,
      easySolved: solvedByDiff.Easy || 0,
      totalEasy: totalsByDiff.Easy || 0,
      mediumSolved: solvedByDiff.Medium || 0,
      totalMedium: totalsByDiff.Medium || 0,
      hardSolved: solvedByDiff.Hard || 0,
      totalHard: totalsByDiff.Hard || 0,
      ranking: user.profile?.ranking ?? null,
      calendar,
      contestRating: contest?.rating ? Math.round(contest.rating) : null,
      contestAttended: contest?.attendedContestsCount ?? 0,
      contestGlobalRanking: contest?.globalRanking ?? null,
      contestTotalParticipants: contest?.totalParticipants ?? null,
      contestTopPercentage: contest?.topPercentage ?? null,
    });
  } catch (err) {
    // TEMP: exposing the real error to debug the 500. Fine for local/dev,
    // but swap back to a generic message before this goes to production.
    return res.status(500).json({ status: "error", message: String(err) });
  }
}