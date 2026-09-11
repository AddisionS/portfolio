// Vercel serverless function. GitHub's REST API supports public CORS
// requests directly (no proxy needed for basic stuff like followers/repos),
// but contribution-calendar data and streaks are only available through
// GitHub's GraphQL v4 API, which requires an auth token on every request
// -- even for public data. A token can't safely live in frontend code, so
// this lives server-side, reading the token from an environment variable.
//
// Setup: create a GitHub personal access token (classic token, no scopes
// needed for public data) and set it as GITHUB_TOKEN in your Vercel
// project's Environment Variables. For local testing with `vercel dev`,
// put it in a .env file (already gitignored) as GITHUB_TOKEN=your_token.

const QUERY = `
  query githubStats($username: String!) {
    user(login: $username) {
      login
      followers { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
        totalCount
        nodes { stargazerCount }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

function calcStreaks(days) {
  // days is chronological, oldest -> newest
  let longest = 0;
  let running = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  // Current streak: walk backwards from the most recent day. If today
  // has 0 contributions, don't zero the streak immediately -- the day
  // just isn't over yet -- start counting from yesterday instead.
  let current = 0;
  let i = days.length - 1;
  if (days[i].contributionCount === 0) i--;
  for (; i >= 0 && days[i].contributionCount > 0; i--) {
    current++;
  }

  return { current, longest };
}

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ status: "error", message: "username is required" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ status: "error", message: "server missing GITHUB_TOKEN" });
  }

  try {
    const ghRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
    });

    if (!ghRes.ok) {
      return res.status(502).json({ status: "error", message: "GitHub request failed" });
    }

    const json = await ghRes.json();
    const user = json?.data?.user;

    if (!user) {
      return res.status(404).json({ status: "error", message: "user not found" });
    }

    const days = user.contributionsCollection.contributionCalendar.weeks.flatMap(
      (w) => w.contributionDays
    );
    const { current, longest } = calcStreaks(days);
    // Note: only sums stars across the first 100 owned, non-fork repos.
    // Fine for basically everyone; would need pagination past 100 repos.
    const totalStars = user.repositories.nodes.reduce(
      (sum, r) => sum + r.stargazerCount,
      0
    );

    // Normalize for the frontend heatmap, same shape as the LeetCode one.
    const calendar = days.map((d) => ({
      date: d.date,
      count: d.contributionCount,
    }));

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return res.status(200).json({
      status: "success",
      followers: user.followers.totalCount,
      publicRepos: user.repositories.totalCount,
      totalStars,
      totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
      currentStreak: current,
      longestStreak: longest,
      totalCommits: user.contributionsCollection.totalCommitContributions,
      totalPRs: user.contributionsCollection.totalPullRequestContributions,
      totalIssues: user.contributionsCollection.totalIssueContributions,
      totalReposContributedTo: user.contributionsCollection.totalRepositoryContributions,
      calendar,
    });
  } catch {
    return res.status(500).json({ status: "error", message: "internal error" });
  }
}